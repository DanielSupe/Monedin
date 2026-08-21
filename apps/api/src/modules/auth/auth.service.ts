import {
  CHILD_LOCKOUT_MINUTES,
  CHILD_MAX_FAILED_ATTEMPTS,
  CHILD_SESSION_HOURS,
  PARENT_LOCKOUT_MINUTES,
  PARENT_MAX_FAILED_ATTEMPTS,
  PARENT_SESSION_DAYS,
} from "@monedin/contracts";
import type { Actor } from "../../shared/actor.js";
import { hashCredential, verifyCredential } from "../../shared/crypto/credentials.js";
import { generateSessionToken } from "../../shared/crypto/session-token.js";
import { NotFoundError, TooManyAttemptsError } from "../../shared/errors/domain-errors.js";
import * as repository from "./auth.repository.js";
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidPinError,
  ParentSessionRequiredError,
} from "./auth.errors.js";

/**
 * Reglas de negocio y autorización del módulo `auth`.
 *
 * Los métodos que operan sobre datos de una familia reciben el actor como
 * primer argumento, como todos. Los de acceso (registro, login) no lo reciben
 * porque su cometido es precisamente crear uno: son públicos por definición.
 */

// ---------------------------------------------------------------------------
// Utilidades de tiempo y bloqueo
// ---------------------------------------------------------------------------

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 3_600_000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

/** Si hay un bloqueo vigente, devuelve cuándo caduca. */
function activeLockout(lockedUntil: Date | null): Date | undefined {
  if (lockedUntil === null) return undefined;
  return lockedUntil.getTime() > Date.now() ? lockedUntil : undefined;
}

/**
 * Iguala el coste de un intento contra una cuenta inexistente.
 *
 * Sin esto, un correo no registrado respondería mucho antes que uno registrado
 * —no habría hash que calcular— y eso permite enumerar cuentas cronometrando.
 * Se hashea contra un valor de descarte para pagar el mismo precio.
 */
const DUMMY_HASH_PROMISE = hashCredential("credencial-inexistente-para-igualar-tiempos");

async function burnEquivalentTime(candidate: string): Promise<void> {
  await verifyCredential(candidate, await DUMMY_HASH_PROMISE);
}

// ---------------------------------------------------------------------------
// Padre
// ---------------------------------------------------------------------------

export interface ParentSummary {
  id: string;
  name: string;
  email: string;
}

export interface IssuedSession {
  token: string;
  expiresAt: Date;
}

/** Registro público de un padre. Deja la sesión iniciada. */
export async function registerParent(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ parent: ParentSummary; session: IssuedSession }> {
  const email = normalizeEmail(input.email);

  // La unicidad la garantiza el almacén; comprobar antes solo mejora el
  // mensaje. Dos registros simultáneos siguen sin poder crear dos cuentas
  // porque el repositorio traduce el choque a conflicto.
  if ((await repository.findParentByEmail(email)) !== null) {
    throw new EmailAlreadyRegisteredError();
  }

  const parent = await repository.createParent({
    name: input.name,
    email,
    passwordHash: await hashCredential(input.password),
  });

  return { parent, session: await issueParentSession(parent.id) };
}

/** Acceso con correo y contraseña. */
export async function loginParent(input: {
  email: string;
  password: string;
}): Promise<{ parent: ParentSummary; session: IssuedSession }> {
  const email = normalizeEmail(input.email);
  const found = await repository.findParentByEmail(email);

  if (found === null) {
    // Se paga el mismo coste que si existiera, y se responde lo mismo.
    await burnEquivalentTime(input.password);
    throw new InvalidCredentialsError();
  }

  const lockedUntil = activeLockout(found.lockedUntil);
  if (lockedUntil !== undefined) {
    throw new TooManyAttemptsError(lockedUntil);
  }

  const { valid, needsRehash } = await verifyCredential(input.password, found.passwordHash);

  if (!valid) {
    const attempts = await repository.registerFailedLogin(found.id);
    if (attempts >= PARENT_MAX_FAILED_ATTEMPTS) {
      await repository.lockParentUntil(found.id, minutesFromNow(PARENT_LOCKOUT_MINUTES));
    }
    throw new InvalidCredentialsError();
  }

  // Un acceso correcto limpia el contador.
  if (found.failedLoginAttempts > 0 || found.lockedUntil !== null) {
    await repository.clearParentLockout(found.id);
  }

  // Único momento en que se tiene la credencial en claro para re-derivarla.
  if (needsRehash) {
    await repository.updateParentPasswordHash(found.id, await hashCredential(input.password));
  }

  return {
    parent: { id: found.id, name: found.name, email: found.email },
    session: await issueParentSession(found.id),
  };
}

/** Cambio de contraseña. Revoca las demás sesiones y conserva la actual. */
export async function changePassword(
  actor: Actor,
  sessionId: string,
  input: { currentPassword: string; newPassword: string },
): Promise<void> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const found = await repository.findParentCredentialsById(actor.userId);
  if (found === null) {
    throw new NotFoundError();
  }

  const { valid } = await verifyCredential(input.currentPassword, found.passwordHash);
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  await repository.updateParentPasswordHash(found.id, await hashCredential(input.newPassword));
  await repository.revokeAllSessionsOfUser(found.id, sessionId);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function issueParentSession(userId: string): Promise<IssuedSession> {
  const token = generateSessionToken();
  const expiresAt = daysFromNow(PARENT_SESSION_DAYS);

  await repository.createSession({ token, userId, expiresAt });

  return { token, expiresAt };
}

// ---------------------------------------------------------------------------
// Niño
// ---------------------------------------------------------------------------

export interface SelectableChild {
  id: string;
  name: string;
  avatar: string | null;
  locked: boolean;
}

/** Perfiles que puede elegir quien tiene esta sesión de padre. */
export async function listSelectableChildren(actor: Actor): Promise<SelectableChild[]> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const children = await repository.findSelectableChildren(actor.userId);

  // Solo nombre y avatar: el selector no necesita más, y el saldo o la edad de
  // un niño no tienen por qué verse antes de entrar.
  return children.map((child) => ({
    id: child.id,
    name: child.name,
    avatar: child.avatar,
    locked: activeLockout(child.lockedUntil) !== undefined,
  }));
}

export interface ChildSummary {
  id: string;
  name: string;
  avatar: string | null;
  coins: number;
}

/** Entrada a un perfil de niño desde la sesión de su padre. */
export async function enterChildProfile(
  actor: Actor,
  parentSessionId: string,
  input: { childProfileId: string; pin: string },
): Promise<{ child: ChildSummary; session: IssuedSession }> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const found = await repository.findChildCredentials(input.childProfileId);

  // Perfil inexistente, de otra familia o dado de baja: la MISMA respuesta en
  // los tres casos. Distinguirlos permitiría descubrir qué perfiles existen.
  if (found === null || found.parentId !== actor.userId || found.deletedAt !== null) {
    await burnEquivalentTime(input.pin);
    throw new InvalidPinError();
  }

  const lockedUntil = activeLockout(found.lockedUntil);
  if (lockedUntil !== undefined) {
    throw new TooManyAttemptsError(lockedUntil);
  }

  const { valid, needsRehash } = await verifyCredential(input.pin, found.pinHash);

  if (!valid) {
    const attempts = await repository.registerFailedPin(found.id);
    if (attempts >= CHILD_MAX_FAILED_ATTEMPTS) {
      await repository.lockChildUntil(found.id, minutesFromNow(CHILD_LOCKOUT_MINUTES));
    }
    throw new InvalidPinError();
  }

  if (found.failedPinAttempts > 0 || found.lockedUntil !== null) {
    await repository.clearChildLockout(found.id);
  }

  if (needsRehash) {
    await repository.updateChildPinHash(found.id, await hashCredential(input.pin));
  }

  const child = await repository.findChildForSession(found.id);
  if (child === null) {
    throw new NotFoundError();
  }

  const token = generateSessionToken();
  // La sesión de niño nunca dura más que la de su padre.
  const expiresAt = hoursFromNow(CHILD_SESSION_HOURS);

  await repository.createSession({
    token,
    userId: actor.userId,
    childProfileId: child.id,
    parentSessionId,
    expiresAt,
  });

  return {
    child: { id: child.id, name: child.name, avatar: child.avatar, coins: child.coins },
    session: { token, expiresAt },
  };
}

/**
 * Salida del perfil de niño.
 *
 * Solo revoca la sesión del niño. La del padre nunca se tocó, así que volver a
 * ella no requiere hacer nada más.
 */
export async function leaveChildProfile(childSessionId: string): Promise<void> {
  await repository.revokeSession(childSessionId);
}

/** El padre establece o restablece el PIN de un hijo suyo. */
export async function setChildPin(
  actor: Actor,
  input: { childProfileId: string; pin: string },
): Promise<void> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const found = await repository.findChildCredentials(input.childProfileId);
  if (found === null || found.deletedAt !== null) {
    throw new NotFoundError();
  }
  if (found.parentId !== actor.userId) {
    // Existe pero no es suyo: 404 y no 403, para no confirmar que existe.
    throw new NotFoundError();
  }

  await repository.updateChildPinHash(found.id, await hashCredential(input.pin));
  // Cambiar el PIN echa fuera a quien estuviera dentro con el anterior.
  await repository.revokeSessionsOfChildProfile(found.id);
}

/** El padre desbloquea el perfil de un hijo suyo. */
export async function unlockChildProfile(
  actor: Actor,
  childProfileId: string,
): Promise<void> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const found = await repository.findChildCredentials(childProfileId);
  if (found === null || found.parentId !== actor.userId || found.deletedAt !== null) {
    throw new NotFoundError();
  }

  await repository.clearChildLockout(found.id);
}

// ---------------------------------------------------------------------------
// Descripción de quien está dentro
// ---------------------------------------------------------------------------

/** Datos básicos del padre para la respuesta de estado. Nunca su credencial. */
export function describeParent(userId: string): Promise<ParentSummary | null> {
  return repository.findParentById(userId);
}

/** Datos básicos del niño, con su saldo, para la respuesta de estado. */
export async function describeChild(childProfileId: string): Promise<ChildSummary | null> {
  const child = await repository.findChildForSession(childProfileId);
  if (child === null) return null;

  return { id: child.id, name: child.name, avatar: child.avatar, coins: child.coins };
}

// ---------------------------------------------------------------------------
// Cierre de sesión
// ---------------------------------------------------------------------------

/** Cierra la sesión del padre. La cascada se lleva las de sus niños. */
export async function logout(sessionId: string): Promise<void> {
  await repository.revokeSession(sessionId);
}

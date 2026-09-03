import {
  CHILD_LOCKOUT_MINUTES,
  CHILD_MAX_FAILED_ATTEMPTS,
  CHILD_SESSION_HOURS,
  PARENT_LOCKOUT_MINUTES,
  PARENT_MAX_FAILED_ATTEMPTS,
  PARENT_PIN_LOCKOUT_MINUTES,
  PARENT_PIN_MAX_FAILED_ATTEMPTS,
  PARENT_PROFILE_ID,
  PARENT_SESSION_DAYS,
  resolveAvatarKey,
  type AvatarValue,
  type ImageContentType,
  type UpdateParentAvatarInput,
  type UploadUrl,
} from "@monedin/contracts";
import { randomUUID } from "node:crypto";
import type { Actor } from "../../shared/actor.js";
import { resolveAvatarForResponse } from "../../shared/avatar/resolve-avatar.js";
import { hashCredential, verifyCredential } from "../../shared/crypto/credentials.js";
import { generateSessionToken } from "../../shared/crypto/session-token.js";
import { NotFoundError, TooManyAttemptsError } from "../../shared/errors/domain-errors.js";
import {
  extensionForContentType,
  getStorageProvider,
  isConfirmableUpload,
} from "../../shared/storage/index.js";
import * as repository from "./auth.repository.js";
import {
  ChildSessionRequiredError,
  EmailAlreadyRegisteredError,
  InvalidAvatarUploadError,
  InvalidCredentialsError,
  InvalidPinError,
  ParentSessionRequiredError,
} from "./auth.errors.js";

/**
 * Reglas de negocio y autorización del módulo `auth`.
 *
 * Aquí conviven dos niveles: acreditar la CUENTA con la contraseña, y activar
 * un PERFIL con su PIN. La rejilla de perfiles vive en este módulo y no en uno
 * aparte porque listar, entrar y salir de un perfil es comportamiento de
 * sesión: un módulo separado necesitaría exactamente este repositorio.
 *
 * Ver la decisión 1 del design de `add-profile-selection`.
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
 * Iguala el coste de un intento contra algo que no existe.
 *
 * Sin esto, un correo o un perfil inexistentes responderían mucho antes —no
 * habría hash que calcular— y eso permite enumerarlos cronometrando.
 */
const DUMMY_HASH_PROMISE = hashCredential("credencial-inexistente-para-igualar-tiempos");

async function burnEquivalentTime(candidate: string): Promise<void> {
  await verifyCredential(candidate, await DUMMY_HASH_PROMISE);
}

// ---------------------------------------------------------------------------
// Cuenta: registro, acceso y contraseña
// ---------------------------------------------------------------------------

export interface ParentSummary {
  id: string;
  name: string;
  email: string;
}

/** Lo mismo, más el avatar YA resuelto: lo que hace falta para armar el actor. */
export interface ParentProfileSummary extends ParentSummary {
  avatar: AvatarValue;
}

export interface IssuedSession {
  token: string;
  expiresAt: Date;
}

/**
 * Registro público de un padre. Acredita la CUENTA.
 *
 * NO deja ningún perfil activo: al terminar se llega a la rejilla, igual que en
 * cualquier apertura posterior. El PIN se pide aquí para no arrastrar por todo
 * el sistema el estado «cuenta sin PIN». Ver la decisión 4 del design.
 */
export async function registerParent(input: {
  name: string;
  email: string;
  password: string;
  pin: string;
}): Promise<{ parent: ParentSummary; session: IssuedSession }> {
  const email = normalizeEmail(input.email);

  if ((await repository.findParentByEmail(email)) !== null) {
    throw new EmailAlreadyRegisteredError();
  }

  const parent = await repository.createParent({
    name: input.name,
    email,
    passwordHash: await hashCredential(input.password),
    pinHash: await hashCredential(input.pin),
  });

  return { parent, session: await issueAccountSession(parent.id) };
}

/** Acceso con correo y contraseña. Acredita la cuenta; no activa ningún perfil. */
export async function loginParent(input: {
  email: string;
  password: string;
}): Promise<{ parent: ParentSummary; session: IssuedSession }> {
  const email = normalizeEmail(input.email);
  const found = await repository.findParentByEmail(email);

  if (found === null) {
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

  if (found.failedLoginAttempts > 0 || found.lockedUntil !== null) {
    await repository.clearParentLockout(found.id);
  }

  if (needsRehash) {
    await repository.updateParentPasswordHash(found.id, await hashCredential(input.password));
  }

  return {
    parent: { id: found.id, name: found.name, email: found.email },
    session: await issueAccountSession(found.id),
  };
}

/** Cambio de contraseña. Revoca las demás sesiones y conserva la actual. */
export async function changePassword(
  actor: Actor,
  accountSessionId: string,
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
  await repository.revokeAllSessionsOfUser(found.id, accountSessionId);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function issueAccountSession(userId: string): Promise<IssuedSession> {
  const token = generateSessionToken();
  const expiresAt = daysFromNow(PARENT_SESSION_DAYS);

  await repository.createSession({ token, userId, expiresAt });

  return { token, expiresAt };
}

// ---------------------------------------------------------------------------
// PIN de adulto
// ---------------------------------------------------------------------------

/** Cambio del PIN indicando el actual. Exige tener el perfil de padre activo. */
export async function changeAdultPin(
  actor: Actor,
  input: { currentPin: string; newPin: string },
): Promise<void> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const found = await repository.findParentCredentialsById(actor.userId);
  if (found === null) {
    throw new NotFoundError();
  }

  const { valid } = await verifyCredential(input.currentPin, found.pinHash);
  if (!valid) {
    throw new InvalidPinError();
  }

  await repository.updateParentPinHash(found.id, await hashCredential(input.newPin));
}

/**
 * Restablecimiento del PIN con la contraseña.
 *
 * NO exige perfil activo, a propósito: es la vía por la que un padre bloqueado
 * fuera de su propio perfil se rescata. Exigirlo lo dejaría encerrado.
 */
export async function resetAdultPin(
  accountUserId: string,
  input: { password: string; newPin: string },
): Promise<void> {
  const found = await repository.findParentCredentialsById(accountUserId);
  if (found === null) {
    throw new NotFoundError();
  }

  const { valid } = await verifyCredential(input.password, found.passwordHash);
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  // Poner un PIN nuevo desbloquea: es justo para lo que se viene aquí.
  await repository.updateParentPinHash(found.id, await hashCredential(input.newPin));
}

// ---------------------------------------------------------------------------
// Rejilla de perfiles
// ---------------------------------------------------------------------------

export interface SelectableProfile {
  /** El del hijo, o `PARENT_PROFILE_ID` para el del padre. */
  id: string;
  familyRole: "PARENT" | "CHILD";
  name: string;
  /** Clave del catálogo o URL firmada, ya resuelta. */
  avatar: AvatarValue;
  locked: boolean;
}

/**
 * Los perfiles de la familia: el del padre y el de cada hijo activo.
 *
 * Recibe el identificador de la CUENTA y no un actor, porque se llama justo
 * antes de ser nadie: de eso va la rejilla.
 *
 * Solo nombre y avatar. El saldo o la edad de un niño no tienen por qué verse
 * antes de entrar.
 */
export async function listProfiles(accountUserId: string): Promise<SelectableProfile[]> {
  const parent = await repository.findParentCredentialsById(accountUserId);
  if (parent === null) {
    throw new NotFoundError();
  }

  const profile = await repository.findParentById(accountUserId);
  const children = await repository.findSelectableChildren(accountUserId);

  const storage = getStorageProvider();

  return [
    {
      id: PARENT_PROFILE_ID,
      familyRole: "PARENT",
      name: parent.name,
      avatar: await resolveAvatarForResponse(storage, profile?.image ?? null),
      locked: activeLockout(parent.pinLockedUntil) !== undefined,
    },
    ...(await Promise.all(
      children.map(async (child) => ({
        id: child.id,
        familyRole: "CHILD" as const,
        name: child.name,
        avatar: await resolveAvatarForResponse(storage, child.avatar),
        locked: activeLockout(child.lockedUntil) !== undefined,
      })),
    )),
  ];
}

export interface ActiveProfile {
  familyRole: "PARENT" | "CHILD";
  id: string;
  name: string;
  avatar: AvatarValue;
  /** Solo en un perfil de niño. */
  coins?: number;
  /** Solo en el perfil del padre. */
  email?: string;
}

/**
 * Activa un perfil de la rejilla, sea el del padre o el de un hijo.
 *
 * Un único camino para los dos: desde la rejilla son perfiles iguales, y tener
 * dos endpoints invitaría a proteger uno y olvidarse del otro.
 */
export async function enterProfile(
  accountUserId: string,
  accountSessionId: string,
  input: { profileId: string; pin: string },
): Promise<{ profile: ActiveProfile; session: IssuedSession }> {
  return input.profileId === PARENT_PROFILE_ID
    ? enterParentProfile(accountUserId, accountSessionId, input.pin)
    : enterChildProfile(accountUserId, accountSessionId, input.profileId, input.pin);
}

async function enterParentProfile(
  accountUserId: string,
  accountSessionId: string,
  pin: string,
): Promise<{ profile: ActiveProfile; session: IssuedSession }> {
  const found = await repository.findParentCredentialsById(accountUserId);
  if (found === null) {
    await burnEquivalentTime(pin);
    throw new InvalidPinError();
  }

  const lockedUntil = activeLockout(found.pinLockedUntil);
  if (lockedUntil !== undefined) {
    throw new TooManyAttemptsError(lockedUntil);
  }

  const { valid, needsRehash } = await verifyCredential(pin, found.pinHash);

  if (!valid) {
    const attempts = await repository.registerFailedParentPin(found.id);
    if (attempts >= PARENT_PIN_MAX_FAILED_ATTEMPTS) {
      await repository.lockParentPinUntil(found.id, minutesFromNow(PARENT_PIN_LOCKOUT_MINUTES));
    }
    throw new InvalidPinError();
  }

  if (found.failedPinAttempts > 0 || found.pinLockedUntil !== null) {
    await repository.clearParentPinLockout(found.id);
  }
  if (needsRehash) {
    await repository.updateParentPinHash(found.id, await hashCredential(pin));
  }

  const profile = await repository.findParentById(accountUserId);

  // Cambiar de perfil no deja dos activos: se retira el anterior.
  await repository.revokeProfileSessionsOf(accountSessionId);
  const session = await issueProfileSession(accountUserId, accountSessionId, undefined);

  return {
    profile: {
      familyRole: "PARENT",
      id: PARENT_PROFILE_ID,
      name: found.name,
      email: found.email,
      avatar: await resolveAvatarForResponse(getStorageProvider(), profile?.image ?? null),
    },
    session,
  };
}

async function enterChildProfile(
  accountUserId: string,
  accountSessionId: string,
  childProfileId: string,
  pin: string,
): Promise<{ profile: ActiveProfile; session: IssuedSession }> {
  const found = await repository.findChildCredentials(childProfileId);

  // Inexistente, de otra familia o dado de baja: la MISMA respuesta en los tres
  // casos, para que no se pueda descubrir qué perfiles existen.
  if (found === null || found.parentId !== accountUserId || found.deletedAt !== null) {
    await burnEquivalentTime(pin);
    throw new InvalidPinError();
  }

  const lockedUntil = activeLockout(found.lockedUntil);
  if (lockedUntil !== undefined) {
    throw new TooManyAttemptsError(lockedUntil);
  }

  const { valid, needsRehash } = await verifyCredential(pin, found.pinHash);

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
    await repository.updateChildPinHash(found.id, await hashCredential(pin));
  }

  const child = await repository.findChildForSession(found.id);
  if (child === null) {
    throw new NotFoundError();
  }

  await repository.revokeProfileSessionsOf(accountSessionId);
  const session = await issueProfileSession(accountUserId, accountSessionId, child.id);

  return {
    profile: {
      familyRole: "CHILD",
      id: child.id,
      name: child.name,
      avatar: resolveAvatarKey(child.avatar),
      coins: child.coins,
    },
    session,
  };
}

async function issueProfileSession(
  accountUserId: string,
  accountSessionId: string,
  childProfileId: string | undefined,
): Promise<IssuedSession> {
  const token = generateSessionToken();
  const expiresAt = hoursFromNow(CHILD_SESSION_HOURS);

  await repository.createSession({
    token,
    userId: accountUserId,
    ...(childProfileId === undefined ? {} : { childProfileId }),
    parentSessionId: accountSessionId,
    expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Sale del perfil activo y vuelve a la rejilla.
 *
 * Solo revoca el perfil. La sesión de cuenta no se toca, así que elegir otro no
 * exige la contraseña.
 */
export async function leaveProfile(profileSessionId: string): Promise<void> {
  await repository.revokeSession(profileSessionId);
}

// ---------------------------------------------------------------------------
// Gestión del PIN de los hijos
// ---------------------------------------------------------------------------

export async function setChildPin(
  actor: Actor,
  input: { childProfileId: string; pin: string },
): Promise<void> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const found = await repository.findChildCredentials(input.childProfileId);
  // Existe pero no es suyo: 404 y no 403, para no confirmar que existe.
  if (found === null || found.deletedAt !== null || found.parentId !== actor.userId) {
    throw new NotFoundError();
  }

  await repository.updateChildPinHash(found.id, await hashCredential(input.pin));
  await repository.revokeSessionsOfChildProfile(found.id);
}

/**
 * El niño cambia SU PIN, demostrando el actual.
 *
 * Distinta de `setChildPin` en las dos cosas que importan: el perfil sale del
 * ACTOR y no de la petición, y hay que conocer el PIN anterior. La otra es la
 * vía de rescate del padre y por eso no lo exige.
 *
 * Fallar el actual cuenta para el MISMO bloqueo que fallar al entrar. Sin eso,
 * quien recibe la tablet con el perfil de otro abierto podría probar
 * combinaciones sin coste hasta cambiarle el PIN y dejarlo fuera.
 *
 * NO revoca ninguna sesión, ni la propia ni la de otro dispositivo: un perfil
 * ya abierto sigue siendo el mismo perfil de la misma persona. Ver la decisión
 * 10 del design de `add-children`, que corrige la spec en ese punto.
 */
export async function changeOwnChildPin(
  actor: Actor,
  input: { currentPin: string; newPin: string },
): Promise<void> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildSessionRequiredError();
  }

  const found = await repository.findChildCredentials(actor.childProfileId);
  if (found === null || found.deletedAt !== null) {
    throw new NotFoundError();
  }

  const lockedUntil = activeLockout(found.lockedUntil);
  if (lockedUntil !== undefined) {
    throw new TooManyAttemptsError(lockedUntil);
  }

  const { valid } = await verifyCredential(input.currentPin, found.pinHash);
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

  await repository.updateChildPinHash(found.id, await hashCredential(input.newPin));
}

export async function unlockChildProfile(actor: Actor, childProfileId: string): Promise<void> {
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

export async function describeParent(userId: string): Promise<ParentProfileSummary | null> {
  const parent = await repository.findParentById(userId);
  if (parent === null) return null;

  return {
    id: parent.id,
    name: parent.name,
    email: parent.email,
    avatar: await resolveAvatarForResponse(getStorageProvider(), parent.image),
  };
}

// ---------------------------------------------------------------------------
// Avatar propio del padre
// ---------------------------------------------------------------------------

/**
 * El avatar del padre vive aquí y no en `children` porque `User.image` es de
 * este módulo: nadie más lee ni escribe esa columna. Ver la decisión 6 del
 * design de `add-file-storage`.
 */
function parentAvatarPrefix(userId: string): string {
  return `avatars/parents/${userId}/`;
}

/** La foto que se confirma tiene que ser de ESTE padre y estar subida de verdad. */
async function confirmedParentAvatarKey(userId: string, key: string): Promise<string> {
  if (!(await isConfirmableUpload(getStorageProvider(), key, parentAvatarPrefix(userId)))) {
    throw new InvalidAvatarUploadError();
  }

  return key;
}

export async function requestParentAvatarUploadUrl(
  actor: Actor,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const key = `${parentAvatarPrefix(actor.userId)}${randomUUID()}.${extensionForContentType(contentType)}`;

  const { uploadUrl, expiresAt } = await getStorageProvider().createUploadUrl({ key, contentType });

  return { uploadUrl, key, expiresAt: expiresAt.toISOString() };
}

export async function updateParentAvatar(
  actor: Actor,
  input: UpdateParentAvatarInput,
): Promise<ParentProfileSummary> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  /*
   * Dos formas del mismo campo, excluyentes, y el esquema ya garantiza que
   * llega exactamente una. La del catálogo no necesita comprobar nada contra el
   * almacén: es un enum cerrado, así que validarla ES el esquema.
   */
  const image =
    input.avatar !== undefined
      ? input.avatar
      : await confirmedParentAvatarKey(actor.userId, input.avatarUploadKey as string);

  await repository.updateParentImage(actor.userId, image);

  const updated = await describeParent(actor.userId);
  if (updated === null) {
    // Inalcanzable: el actor sale de una sesión viva.
    throw new NotFoundError();
  }

  return updated;
}

export interface ChildSummary {
  id: string;
  name: string;
  avatar: string | null;
  coins: number;
}

export async function describeChild(childProfileId: string): Promise<ChildSummary | null> {
  const child = await repository.findChildForSession(childProfileId);
  if (child === null) return null;

  return { id: child.id, name: child.name, avatar: child.avatar, coins: child.coins };
}

// ---------------------------------------------------------------------------
// Cierre de sesión
// ---------------------------------------------------------------------------

/** Cierra la sesión de cuenta. La cascada se lleva el perfil activo. */
export async function logout(accountSessionId: string): Promise<void> {
  await repository.revokeSession(accountSessionId);
}

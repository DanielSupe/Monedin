import { getPrisma, withTranslatedErrors } from "../../shared/database/index.js";
import { hashSessionToken } from "../../shared/crypto/session-token.js";

/**
 * Capa de datos del módulo `auth`.
 *
 * ÚNICO archivo del módulo que toca Prisma. Es el dueño de la tabla de
 * sesiones: ningún otro módulo la lee, y el middleware de sesión pasa por aquí
 * en lugar de consultar la base de datos por su cuenta.
 *
 * También lee y escribe `User` y `ChildProfile`, pero solo lo que es
 * autenticación: credenciales, bloqueo y los datos mínimos para pintar el
 * selector de perfil. Crear, listar y editar hijos como entidad de producto es
 * de `add-children`.
 */

// ---------------------------------------------------------------------------
// Padres
// ---------------------------------------------------------------------------

export interface ParentCredentials {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  /** PIN de adulto. Su bloqueo se cuenta aparte del de la contraseña. */
  pinHash: string;
  failedPinAttempts: number;
  pinLockedUntil: Date | null;
}

export function findParentByEmail(email: string): Promise<ParentCredentials | null> {
  return withTranslatedErrors(() =>
    getPrisma().user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        pinHash: true,
        failedPinAttempts: true,
        pinLockedUntil: true,
      },
    }),
  );
}

export function findParentCredentialsById(id: string): Promise<ParentCredentials | null> {
  return withTranslatedErrors(() =>
    getPrisma().user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        pinHash: true,
        failedPinAttempts: true,
        pinLockedUntil: true,
      },
    }),
  );
}

export function findParentById(
  id: string,
): Promise<{
  id: string;
  name: string;
  email: string;
  image: string | null;
  tutorialSeenAt: Date | null;
} | null> {
  return withTranslatedErrors(() =>
    getPrisma().user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, image: true, tutorialSeenAt: true },
    }),
  );
}

/** Cambia la imagen del padre. `null` la quita. */
export function updateParentImage(id: string, image: string | null): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({ where: { id }, data: { image } });
  });
}

export function createParent(data: {
  name: string;
  email: string;
  passwordHash: string;
  pinHash: string;
}): Promise<{ id: string; name: string; email: string }> {
  return withTranslatedErrors(() =>
    getPrisma().user.create({
      data,
      select: { id: true, name: true, email: true },
    }),
  );
}

export function updateParentPasswordHash(id: string, passwordHash: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({ where: { id }, data: { passwordHash } });
  });
}

/** Suma un intento fallido y devuelve cuántos van. */
export function registerFailedLogin(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const updated = await getPrisma().user.update({
      where: { id },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    return updated.failedLoginAttempts;
  });
}

export function lockParentUntil(id: string, until: Date): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({ where: { id }, data: { lockedUntil: until } });
  });
}

/** Un acceso correcto pone el contador a cero y levanta cualquier bloqueo. */
export function clearParentLockout(id: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });
}

/**
 * Cambia el PIN de adulto y desbloquea.
 *
 * Poner un PIN nuevo desbloquea el perfil: es la vía por la que un padre se
 * rescata a sí mismo cuando lo ha olvidado y se ha quedado fuera.
 */
export function updateParentPinHash(id: string, pinHash: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({
      where: { id },
      data: { pinHash, failedPinAttempts: 0, pinLockedUntil: null },
    });
  });
}

export function registerFailedParentPin(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const updated = await getPrisma().user.update({
      where: { id },
      data: { failedPinAttempts: { increment: 1 } },
      select: { failedPinAttempts: true },
    });
    return updated.failedPinAttempts;
  });
}

export function lockParentPinUntil(id: string, until: Date): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({ where: { id }, data: { pinLockedUntil: until } });
  });
}

export function clearParentPinLockout(id: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({
      where: { id },
      data: { failedPinAttempts: 0, pinLockedUntil: null },
    });
  });
}

// ---------------------------------------------------------------------------
// Perfiles de niño
// ---------------------------------------------------------------------------

export interface ChildCredentials {
  id: string;
  name: string;
  parentId: string;
  pinHash: string;
  failedPinAttempts: number;
  lockedUntil: Date | null;
  deletedAt: Date | null;
}

/** Perfiles activos de un padre, con lo justo para pintar el selector. */
export function findSelectableChildren(
  parentId: string,
): Promise<Array<{ id: string; name: string; avatar: string | null; lockedUntil: Date | null }>> {
  return withTranslatedErrors(() =>
    getPrisma().childProfile.findMany({
      where: { parentId, deletedAt: null },
      select: { id: true, name: true, avatar: true, lockedUntil: true },
      orderBy: { createdAt: "asc" },
    }),
  );
}

export function findChildCredentials(id: string): Promise<ChildCredentials | null> {
  return withTranslatedErrors(() =>
    getPrisma().childProfile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        parentId: true,
        pinHash: true,
        failedPinAttempts: true,
        lockedUntil: true,
        deletedAt: true,
      },
    }),
  );
}

export function findChildForSession(
  id: string,
): Promise<{
  id: string;
  name: string;
  avatar: string | null;
  coins: number;
  parentId: string;
  tutorialSeenAt: Date | null;
} | null> {
  return withTranslatedErrors(() =>
    getPrisma().childProfile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        coins: true,
        parentId: true,
        tutorialSeenAt: true,
      },
    }),
  );
}

/**
 * Marca —o desmarca— el recorrido de bienvenida de un perfil.
 *
 * Dos funciones y no una con una bandera de tabla: son dos tablas distintas y
 * el repositorio no adivina cuál toca. Quién es quién lo decide el servicio, que
 * es donde vive la rama por rol.
 */
export function setParentTutorialSeen(id: string, seenAt: Date | null): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({ where: { id }, data: { tutorialSeenAt: seenAt } });
  });
}

export function setChildTutorialSeen(id: string, seenAt: Date | null): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().childProfile.update({ where: { id }, data: { tutorialSeenAt: seenAt } });
  });
}

export function updateChildPinHash(id: string, pinHash: string): Promise<void> {
  return withTranslatedErrors(async () => {
    // Poner un PIN nuevo desbloquea el perfil: es el camino por el que un padre
    // rescata a un hijo que se quedó fuera.
    await getPrisma().childProfile.update({
      where: { id },
      data: { pinHash, failedPinAttempts: 0, lockedUntil: null },
    });
  });
}

export function registerFailedPin(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const updated = await getPrisma().childProfile.update({
      where: { id },
      data: { failedPinAttempts: { increment: 1 } },
      select: { failedPinAttempts: true },
    });
    return updated.failedPinAttempts;
  });
}

export function lockChildUntil(id: string, until: Date): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().childProfile.update({ where: { id }, data: { lockedUntil: until } });
  });
}

export function clearChildLockout(id: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().childProfile.update({
      where: { id },
      data: { failedPinAttempts: 0, lockedUntil: null },
    });
  });
}

// ---------------------------------------------------------------------------
// Sesiones
// ---------------------------------------------------------------------------

export interface StoredSession {
  id: string;
  userId: string;
  childProfileId: string | null;
  parentSessionId: string | null;
  expiresAt: Date;
}

export function createSession(data: {
  token: string;
  userId: string;
  childProfileId?: string;
  parentSessionId?: string;
  expiresAt: Date;
}): Promise<StoredSession> {
  return withTranslatedErrors(() =>
    getPrisma().session.create({
      // Se guarda el HASH del identificador, nunca el identificador.
      data: {
        tokenHash: hashSessionToken(data.token),
        userId: data.userId,
        ...(data.childProfileId === undefined ? {} : { childProfileId: data.childProfileId }),
        ...(data.parentSessionId === undefined ? {} : { parentSessionId: data.parentSessionId }),
        expiresAt: data.expiresAt,
      },
      select: {
        id: true,
        userId: true,
        childProfileId: true,
        parentSessionId: true,
        expiresAt: true,
      },
    }),
  );
}

export function findSessionByToken(token: string): Promise<StoredSession | null> {
  return withTranslatedErrors(() =>
    getPrisma().session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      select: {
        id: true,
        userId: true,
        childProfileId: true,
        parentSessionId: true,
        expiresAt: true,
      },
    }),
  );
}

export function findSessionById(id: string): Promise<StoredSession | null> {
  return withTranslatedErrors(() =>
    getPrisma().session.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        childProfileId: true,
        parentSessionId: true,
        expiresAt: true,
      },
    }),
  );
}

export function extendSession(id: string, expiresAt: Date): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().session.update({
      where: { id },
      data: { expiresAt, lastUsedAt: new Date() },
    });
  });
}

/** Revoca una sesión. Borrar la fila se lleva por cascada las de sus hijos. */
export function revokeSession(id: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().session.deleteMany({ where: { id } });
  });
}

/**
 * Revoca todas las sesiones de una cuenta, salvando opcionalmente un dispositivo.
 *
 * «Salvar un dispositivo» es salvar su sesión de cuenta **y el perfil que tenga
 * activo**. Salvar solo la cuenta echaría a quien acaba de cambiar su
 * contraseña de vuelta a la rejilla, que no es conservar su sesión: es
 * expulsarlo con más pasos.
 */
export function revokeAllSessionsOfUser(
  userId: string,
  keepAccountSessionId?: string,
): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().session.deleteMany({
      where: {
        userId,
        ...(keepAccountSessionId === undefined
          ? {}
          : {
              AND: [
                { id: { not: keepAccountSessionId } },
                {
                  OR: [
                    { parentSessionId: null },
                    { parentSessionId: { not: keepAccountSessionId } },
                  ],
                },
              ],
            }),
      },
    });
    return result.count;
  });
}

/** Revoca todas las sesiones abiertas de un perfil de niño concreto. */
export function revokeSessionsOfChildProfile(childProfileId: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().session.deleteMany({ where: { childProfileId } });
    return result.count;
  });
}

/**
 * Revoca los perfiles activos que cuelgan de una sesión de cuenta.
 *
 * Se usa al entrar a un perfil, para que nunca haya dos activos a la vez.
 */
export function revokeProfileSessionsOf(accountSessionId: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().session.deleteMany({
      where: { parentSessionId: accountSessionId },
    });
    return result.count;
  });
}

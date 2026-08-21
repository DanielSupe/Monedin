import { PARENT_SESSION_DAYS } from "@monedin/contracts";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import * as authRepository from "../../modules/auth/auth.repository.js";
import type { Actor } from "../actor.js";
import { ForbiddenError, UnauthorizedError } from "../errors/domain-errors.js";
import {
  clearAccountSessionCookie,
  clearProfileSessionCookie,
  readAccountSessionCookie,
  readProfileSessionCookie,
} from "./session-cookies.js";

/**
 * Resolución de la sesión y protección de rutas.
 *
 * Hay DOS niveles, y esa es la diferencia con `add-authentication`:
 *
 *   sesión de CUENTA   acredita que el dispositivo pertenece a esta familia.
 *                      NO da actor.
 *   perfil ACTIVO      dice quién está usando el dispositivo. SÍ da actor.
 *
 * Que la cookie de cuenta no conceda poderes es lo que hace que la rejilla sea
 * una frontera y no una pantalla que se rodea llamando al endpoint: sin esto,
 * un niño podría aprobarse sus propias tareas. Ver la decisión 2 del design de
 * `add-profile-selection`.
 *
 * Vive aquí y no en el módulo `auth` porque lo consume toda la API, y lee las
 * sesiones a través del repositorio de `auth`, nunca con Prisma directamente.
 */

/** Lo que se ha podido resolver de una petición. */
export interface ResolvedSession {
  /** La cuenta acreditada. Presente siempre que haya cookie de cuenta válida. */
  accountUserId: string;
  accountSessionId: string;
  /** Quién está operando. Ausente mientras no se haya elegido perfil. */
  actor?: Actor;
  /** Identificador de la fila del perfil activo, si lo hay. */
  profileSessionId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: ResolvedSession;
      isPublicRoute?: boolean;
      isAccountOnlyRoute?: boolean;
    }
  }
}

/** Renueva la caducidad cuando ya ha pasado un cuarto de su vida. */
const RENEWAL_THRESHOLD = 0.25;

function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}

/**
 * Resuelve lo que haya. NUNCA rechaza: quien exige es el guardián.
 */
export const resolveSession: RequestHandler = (req, res, next) => {
  void resolve(req, res)
    .then(() => next())
    .catch(next);
};

async function resolve(req: Request, res: Response): Promise<void> {
  const accountToken = readAccountSessionCookie(req);

  if (accountToken === undefined) {
    // Sin cuenta no puede haber perfil: si quedó una cookie suelta, se retira.
    if (readProfileSessionCookie(req) !== undefined) {
      clearProfileSessionCookie(res);
    }
    return;
  }

  const account = await authRepository.findSessionByToken(accountToken);

  // Una fila con `parentSessionId` no es una cuenta, es un perfil: alguien la
  // presentó en el hueco equivocado.
  if (account === null || account.parentSessionId !== null || isExpired(account.expiresAt)) {
    clearAccountSessionCookie(res);
    clearProfileSessionCookie(res);
    return;
  }

  await renewIfNeeded(account.id, account.expiresAt);

  // Cuenta acreditada. Todavía no hay actor.
  req.session = { accountUserId: account.userId, accountSessionId: account.id };

  const profileToken = readProfileSessionCookie(req);
  if (profileToken === undefined) return;

  const profile = await authRepository.findSessionByToken(profileToken);

  const valid =
    profile !== null &&
    // Un perfil siempre cuelga de una cuenta, y tiene que ser ESTA.
    profile.parentSessionId === account.id &&
    !isExpired(profile.expiresAt);

  if (!valid) {
    // Perfil huérfano, caducado o de otra cuenta: se retira y se sigue con la
    // cuenta acreditada pero sin actor, que manda a la rejilla.
    clearProfileSessionCookie(res);
    return;
  }

  await renewIfNeeded(profile.id, profile.expiresAt);

  req.session.profileSessionId = profile.id;
  req.session.actor =
    profile.childProfileId === null
      ? { familyRole: "PARENT", userId: profile.userId }
      : {
          familyRole: "CHILD",
          childProfileId: profile.childProfileId,
          parentId: profile.userId,
        };
}

/**
 * Prolonga la caducidad si ya consumió buena parte de su vida.
 *
 * No se renueva en cada petición para no escribir en la base constantemente;
 * con este umbral, un uso continuado nunca expulsa a nadie.
 */
async function renewIfNeeded(sessionId: string, expiresAt: Date): Promise<void> {
  const totalMs = PARENT_SESSION_DAYS * 86_400_000;
  const remaining = expiresAt.getTime() - Date.now();

  if (remaining > totalMs * RENEWAL_THRESHOLD) return;

  await authRepository.extendSession(sessionId, new Date(Date.now() + totalMs));
}

/**
 * Exige ACTOR, no solo cuenta.
 *
 * Es el guardián por defecto de todas las rutas. Una cookie de cuenta sin
 * perfil elegido responde 401 igual que si no hubiera nada: es exactamente lo
 * que impide rodear la rejilla.
 */
export const requireSession: RequestHandler = (req, _res, next) => {
  if (req.session?.actor === undefined) {
    next(new UnauthorizedError());
    return;
  }
  next();
};

/**
 * Exige únicamente CUENTA acreditada, sin perfil elegido.
 *
 * Solo para las rutas de la rejilla: listar los perfiles y entrar a uno son
 * justo los pasos previos a ser alguien. Cualquier otra ruta usa el guardián
 * por defecto.
 */
export const requireAccount: RequestHandler = (req, _res, next) => {
  if (req.session === undefined) {
    next(new UnauthorizedError());
    return;
  }
  next();
};

/**
 * Marca la petición como dirigida a una ruta pública.
 *
 * No se usa directamente: lo pone `moduleRouter()` en sus métodos `public*`.
 */
export const markPublic: RequestHandler = (req, _res, next) => {
  req.isPublicRoute = true;
  next();
};

/**
 * Marca la petición como dirigida a una ruta de SOLO CUENTA.
 *
 * Lo pone `moduleRouter()` en sus métodos `account*`. Tiene que ser una marca y
 * no un middleware suelto: el guardián por defecto se ejecuta ANTES que los
 * manejadores propios de la ruta, así que un `requireAccount` puesto detrás no
 * llegaría nunca a correr.
 */
export const markAccountOnly: RequestHandler = (req, _res, next) => {
  req.isAccountOnlyRoute = true;
  next();
};

/**
 * Guardián por defecto. Exige ACTOR, salvo en rutas declaradas.
 *
 * Público  -> pasa sin nada.
 * Solo cuenta -> basta con la cuenta acreditada.
 * Lo demás -> hace falta perfil elegido.
 */
export const requireSessionUnlessPublic: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isPublicRoute === true) {
    next();
    return;
  }
  if (req.isAccountOnlyRoute === true) {
    requireAccount(req, res, next);
    return;
  }
  requireSession(req, res, next);
};

/**
 * Exige que quien llama sea un padre.
 *
 * Es un filtro GRUESO y NO sustituye a la autorización: que un padre tenga el
 * rol correcto no dice nada sobre si el recurso es suyo. Eso lo comprueba el
 * servicio, con el actor.
 */
export const requireParent: RequestHandler = (req, _res, next) => {
  const actor = req.session?.actor;
  if (actor === undefined) {
    next(new UnauthorizedError());
    return;
  }
  if (actor.familyRole !== "PARENT") {
    next(new ForbiddenError());
    return;
  }
  next();
};

/** Exige que quien llama sea un niño. */
export const requireChild: RequestHandler = (req, _res, next) => {
  const actor = req.session?.actor;
  if (actor === undefined) {
    next(new UnauthorizedError());
    return;
  }
  if (actor.familyRole !== "CHILD") {
    next(new ForbiddenError());
    return;
  }
  next();
};

/** Lee la cuenta acreditada. Se usa tras `requireAccount`. */
export function accountOf(req: Request): ResolvedSession {
  if (req.session === undefined) {
    throw new UnauthorizedError();
  }
  return req.session;
}

/** Lee el actor. Se usa tras `requireSession`, que garantiza que existe. */
export function actorOf(req: Request): Actor {
  const actor = req.session?.actor;
  if (actor === undefined) {
    throw new UnauthorizedError();
  }
  return actor;
}

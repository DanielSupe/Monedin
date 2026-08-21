import { PARENT_SESSION_DAYS } from "@monedin/contracts";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import * as authRepository from "../../modules/auth/auth.repository.js";
import type { Actor } from "../actor.js";
import { ForbiddenError, UnauthorizedError } from "../errors/domain-errors.js";
import { clearChildSessionCookie, clearParentSessionCookie, readChildSessionCookie, readParentSessionCookie } from "./session-cookies.js";

/**
 * Resolución de la sesión y protección de rutas.
 *
 * Vive aquí y no en el módulo `auth` porque lo consume toda la API. Es la única
 * pieza fuera de `auth` que sabe de sesiones, y lo hace a través del repositorio
 * de `auth`, nunca con Prisma directamente.
 *
 * Cada petición se resuelve a un actor o a ninguno ANTES de que se ejecute nada
 * de negocio. Los servicios reciben ese actor y no lo reconstruyen.
 */

/** La sesión ya resuelta de una petición. */
export interface ResolvedSession {
  actor: Actor;
  /** Identificador de la fila de sesión activa: la del niño si la hay. */
  sessionId: string;
  /** Identificador de la sesión de padre, esté activa o suspendida detrás. */
  parentSessionId: string;
  /** Si hay una sesión de padre esperando detrás de una de niño. */
  parentSessionAvailable: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: ResolvedSession;
      isPublicRoute?: boolean;
    }
  }
}

/** Renueva la caducidad cuando ya ha pasado un cuarto de su vida. */
const RENEWAL_THRESHOLD = 0.25;

function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}

/**
 * Resuelve la sesión de la petición si la hay.
 *
 * Se monta antes de todo y NUNCA rechaza: solo deja el actor disponible. Quien
 * exige sesión es el guardián.
 */
export const resolveSession: RequestHandler = (req, res, next) => {
  void resolve(req, res)
    .then(() => next())
    .catch(next);
};

async function resolve(req: Request, res: Response): Promise<void> {
  const parentToken = readParentSessionCookie(req);
  if (parentToken === undefined) {
    // Sin sesión de padre no puede haber sesión de niño: si quedó una cookie
    // suelta, se retira.
    if (readChildSessionCookie(req) !== undefined) {
      clearChildSessionCookie(res);
    }
    return;
  }

  const parentSession = await authRepository.findSessionByToken(parentToken);

  if (parentSession === null || parentSession.childProfileId !== null || isExpired(parentSession.expiresAt)) {
    // Caducada, inexistente, o alguien presentó una cookie de niño en el hueco
    // de la de padre. En los tres casos: no hay sesión.
    clearParentSessionCookie(res);
    clearChildSessionCookie(res);
    return;
  }

  await renewIfNeeded(parentSession.id, parentSession.expiresAt);

  const childToken = readChildSessionCookie(req);
  if (childToken !== undefined) {
    const childSession = await authRepository.findSessionByToken(childToken);

    const valid =
      childSession !== null &&
      childSession.childProfileId !== null &&
      !isExpired(childSession.expiresAt) &&
      // La sesión de niño solo vale si nació de ESTA sesión de padre.
      childSession.parentSessionId === parentSession.id;

    if (valid && childSession.childProfileId !== null) {
      await renewIfNeeded(childSession.id, childSession.expiresAt);

      req.session = {
        actor: {
          familyRole: "CHILD",
          childProfileId: childSession.childProfileId,
          parentId: childSession.userId,
        },
        sessionId: childSession.id,
        parentSessionId: parentSession.id,
        parentSessionAvailable: true,
      };
      return;
    }

    // Cookie de niño huérfana o caducada: se retira y se sigue como el padre.
    clearChildSessionCookie(res);
  }

  req.session = {
    actor: { familyRole: "PARENT", userId: parentSession.userId },
    sessionId: parentSession.id,
    parentSessionId: parentSession.id,
    parentSessionAvailable: false,
  };
}

/**
 * Prolonga la caducidad si ya ha consumido buena parte de su vida.
 *
 * No se renueva en cada petición para no escribir en la base de datos
 * constantemente; con este umbral, un uso continuado nunca expulsa a nadie.
 */
async function renewIfNeeded(sessionId: string, expiresAt: Date): Promise<void> {
  const totalMs = PARENT_SESSION_DAYS * 86_400_000;
  const remaining = expiresAt.getTime() - Date.now();

  if (remaining > totalMs * RENEWAL_THRESHOLD) return;

  await authRepository.extendSession(sessionId, new Date(Date.now() + totalMs));
}

/**
 * Exige sesión.
 *
 * Se monta sobre todo el router de la API, y las rutas públicas se declaran una
 * a una con `publicRoute`. Olvidarse deja la ruta protegida, que es el fallo
 * benigno. Ver la decisión 5 del design.
 */
export const requireSession: RequestHandler = (req, _res, next) => {
  if (req.session === undefined) {
    next(new UnauthorizedError());
    return;
  }
  next();
};

/**
 * Marca la petición como dirigida a una ruta pública.
 *
 * Va justo delante del guardián en la cadena de esa ruta. No se usa
 * directamente: lo pone `moduleRouter()` en sus métodos `public*`.
 */
export const markPublic: RequestHandler = (req, _res, next) => {
  req.isPublicRoute = true;
  next();
};

/** Guardián que respeta las rutas declaradas públicas. */
export const requireSessionUnlessPublic: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isPublicRoute === true) {
    next();
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
  if (req.session === undefined) {
    next(new UnauthorizedError());
    return;
  }
  if (req.session.actor.familyRole !== "PARENT") {
    next(new ForbiddenError());
    return;
  }
  next();
};

/** Exige que quien llama sea un niño. */
export const requireChild: RequestHandler = (req, _res, next) => {
  if (req.session === undefined) {
    next(new UnauthorizedError());
    return;
  }
  if (req.session.actor.familyRole !== "CHILD") {
    next(new ForbiddenError());
    return;
  }
  next();
};

/**
 * Lee la sesión resuelta.
 *
 * Se usa después de `requireSession`, que garantiza que existe.
 */
export function sessionOf(req: Request): ResolvedSession {
  if (req.session === undefined) {
    throw new UnauthorizedError();
  }
  return req.session;
}

/** Lee el actor. Es lo que el controlador pasa al servicio. */
export function actorOf(req: Request): Actor {
  return sessionOf(req).actor;
}

import {
  type SessionState,
  changePasswordSchema,
  enterChildProfileSchema,
  loginParentSchema,
  registerParentSchema,
  setChildPinSchema,
} from "@monedin/contracts";
import type { Request, RequestHandler } from "express";
import {
  clearChildSessionCookie,
  clearParentSessionCookie,
  setChildSessionCookie,
  setParentSessionCookie,
} from "../../shared/http/session-cookies.js";
import { actorOf, sessionOf } from "../../shared/http/session.js";
import { validatedPart } from "../../shared/http/validate.js";
import * as service from "./auth.service.js";
import { ParentSessionRequiredError } from "./auth.errors.js";

/**
 * Parseo y serialización. Cero autorización.
 *
 * Lo único que decide aquí es qué cookies emitir y qué forma tiene la
 * respuesta. Quién puede hacer qué lo decide el servicio, con el actor.
 */

// ---------------------------------------------------------------------------
// Padre
// ---------------------------------------------------------------------------

export const handleRegister: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", registerParentSchema);
  const { parent, session } = await service.registerParent(input);

  setParentSessionCookie(res, session.token, session.expiresAt);

  res.status(201).json(parentState(parent));
};

export const handleLogin: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", loginParentSchema);
  const { parent, session } = await service.loginParent(input);

  // Entrar como padre descarta cualquier perfil de niño que hubiera activo.
  clearChildSessionCookie(res);
  setParentSessionCookie(res, session.token, session.expiresAt);

  res.status(200).json(parentState(parent));
};

export const handleLogout: RequestHandler = async (req, res) => {
  const current = req.session;

  if (current !== undefined) {
    // Cerrar la del padre se lleva por cascada las de sus niños.
    await service.logout(current.parentSessionId);
  }

  clearChildSessionCookie(res);
  clearParentSessionCookie(res);

  res.status(204).send();
};

export const handleChangePassword: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", changePasswordSchema);
  const current = sessionOf(req);

  await service.changePassword(current.actor, current.sessionId, input);

  res.status(204).send();
};

// ---------------------------------------------------------------------------
// Niño
// ---------------------------------------------------------------------------

export const handleListChildProfiles: RequestHandler = async (req, res) => {
  const children = await service.listSelectableChildren(actorOf(req));

  res.status(200).json({ children });
};

export const handleEnterChildProfile: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", enterChildProfileSchema);
  const current = sessionOf(req);

  const { child, session } = await service.enterChildProfile(
    current.actor,
    current.parentSessionId,
    input,
  );

  setChildSessionCookie(res, session.token, session.expiresAt);

  res.status(200).json({
    actor: { familyRole: "CHILD" as const, ...child },
    parentSessionAvailable: true,
  } satisfies SessionState);
};

export const handleLeaveChildProfile: RequestHandler = async (req, res) => {
  const current = sessionOf(req);

  if (current.actor.familyRole !== "CHILD") {
    throw new ParentSessionRequiredError();
  }

  await service.leaveChildProfile(current.sessionId);
  clearChildSessionCookie(res);

  res.status(204).send();
};

export const handleSetChildPin: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", setChildPinSchema);

  await service.setChildPin(actorOf(req), input);

  res.status(204).send();
};

export const handleUnlockChildProfile: RequestHandler = async (req, res) => {
  // Express tipa los parámetros como `string | string[]`; una ruta con un solo
  // segmento nombrado siempre da una cadena.
  const raw = req.params.childProfileId;
  const childProfileId = typeof raw === "string" ? raw : "";

  await service.unlockChildProfile(actorOf(req), childProfileId);

  res.status(204).send();
};

// ---------------------------------------------------------------------------
// Estado de la sesión
// ---------------------------------------------------------------------------

/**
 * Responde 200 con o sin sesión.
 *
 * No es un endpoint de error: la aplicación web lo llama al cargarse, y que
 * todavía no haya entrado nadie es el caso normal.
 */
export const handleSessionState: RequestHandler = async (req, res) => {
  res.status(200).json(await buildSessionState(req));
};

async function buildSessionState(req: Request): Promise<SessionState> {
  const current = req.session;

  if (current === undefined) {
    return { actor: null, parentSessionAvailable: false };
  }

  if (current.actor.familyRole === "CHILD") {
    const child = await service.describeChild(current.actor.childProfileId);

    return {
      actor: child === null ? null : { familyRole: "CHILD", ...child },
      parentSessionAvailable: current.parentSessionAvailable,
    };
  }

  const parent = await service.describeParent(current.actor.userId);

  return {
    actor: parent === null ? null : { familyRole: "PARENT", ...parent },
    parentSessionAvailable: false,
  };
}

function parentState(parent: service.ParentSummary): SessionState {
  return {
    actor: { familyRole: "PARENT", ...parent },
    parentSessionAvailable: false,
  };
}

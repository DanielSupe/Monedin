import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireChild, requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import {
  changePasswordSchema,
  enterChildProfileSchema,
  loginParentSchema,
  registerParentSchema,
  setChildPinSchema,
} from "@monedin/contracts";
import * as controller from "./auth.controller.js";

/**
 * Monta las rutas del módulo. Cero lógica.
 *
 * Las tres primeras son PÚBLICAS y se declaran como tales una a una: registro y
 * acceso no pueden exigir sesión, y el estado de sesión es lo que la aplicación
 * web llama antes de tener ninguna. Todo lo demás hereda la protección.
 */
const auth = moduleRouter();

export const authRouter: ExpressRouter = auth.router;

// --- Públicas ---------------------------------------------------------------

auth.publicPost(
  "/auth/register",
  validate({ body: registerParentSchema }),
  controller.handleRegister,
);

auth.publicPost("/auth/login", validate({ body: loginParentSchema }), controller.handleLogin);

auth.publicGet("/auth/session", controller.handleSessionState);

// Cerrar sesión es público a propósito: si la sesión ya no vale, cerrarla debe
// seguir borrando las cookies en lugar de responder 401.
auth.publicPost("/auth/logout", controller.handleLogout);

// --- Requieren sesión de padre ----------------------------------------------

auth.post(
  "/auth/password",
  requireParent,
  validate({ body: changePasswordSchema }),
  controller.handleChangePassword,
);

auth.get("/auth/child-profiles", requireParent, controller.handleListChildProfiles);

auth.post(
  "/auth/child-profiles/enter",
  requireParent,
  validate({ body: enterChildProfileSchema }),
  controller.handleEnterChildProfile,
);

auth.post(
  "/auth/child-profiles/pin",
  requireParent,
  validate({ body: setChildPinSchema }),
  controller.handleSetChildPin,
);

auth.post(
  "/auth/child-profiles/:childProfileId/unlock",
  requireParent,
  controller.handleUnlockChildProfile,
);

// --- Requiere sesión de niño ------------------------------------------------

auth.post("/auth/child-profiles/leave", requireChild, controller.handleLeaveChildProfile);

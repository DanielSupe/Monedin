import {
  changeAdultPinSchema,
  changePasswordSchema,
  enterProfileSchema,
  loginParentSchema,
  registerParentSchema,
  resetAdultPinSchema,
  setChildPinSchema,
} from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./auth.controller.js";

/**
 * Monta las rutas del módulo. Cero lógica.
 *
 * Hay TRES niveles de protección aquí, y la diferencia importa:
 *
 *   públicas          registro, acceso, cierre y estado. No hay ni cuenta.
 *   `requireAccount`  la rejilla: listar perfiles y entrar a uno. Son los pasos
 *                     previos a ser alguien, así que no pueden exigir actor.
 *   por defecto       todo lo demás exige ACTOR, es decir, perfil ya elegido.
 *
 * Que `requireAccount` esté en tres rutas contadas y no sea el criterio general
 * es lo que impide rodear la rejilla. Ver la decisión 2 del design de
 * `add-profile-selection`.
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

// --- Solo cuenta acreditada: la rejilla -------------------------------------

auth.accountGet("/auth/profiles", controller.handleListProfiles);

auth.accountPost(
  "/auth/profiles/enter",
  validate({ body: enterProfileSchema }),
  controller.handleEnterProfile,
);

auth.accountPost("/auth/profiles/leave", controller.handleLeaveProfile);

// Restablecer el PIN con la contraseña rescata a un padre bloqueado fuera de su
// propio perfil: exigirle perfil activo lo dejaría encerrado.
auth.accountPost(
  "/auth/pin/reset",
  validate({ body: resetAdultPinSchema }),
  controller.handleResetAdultPin,
);

// --- Exigen perfil de padre activo ------------------------------------------

auth.post(
  "/auth/password",
  requireParent,
  validate({ body: changePasswordSchema }),
  controller.handleChangePassword,
);

auth.post(
  "/auth/pin",
  requireParent,
  validate({ body: changeAdultPinSchema }),
  controller.handleChangeAdultPin,
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

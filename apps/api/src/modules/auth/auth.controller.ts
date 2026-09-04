import {
  type SessionState,
  changeAdultPinSchema,
  changeOwnChildPinSchema,
  changePasswordSchema,
  createUploadUrlSchema,
  enterProfileSchema,
  loginParentSchema,
  registerParentSchema,
  resetAdultPinSchema,
  resolveAvatarKey,
  setChildPinSchema,
  updateParentAvatarSchema,
  updateTutorialSchema,
} from "@monedin/contracts";
import type { Request, RequestHandler } from "express";
import {
  clearAccountSessionCookie,
  clearProfileSessionCookie,
  setAccountSessionCookie,
  setProfileSessionCookie,
} from "../../shared/http/session-cookies.js";
import { accountOf, actorOf } from "../../shared/http/session.js";
import { validatedPart } from "../../shared/http/validate.js";
import * as service from "./auth.service.js";

/**
 * Parseo y serialización. Cero autorización.
 *
 * Lo único que decide aquí es qué cookies emitir y qué forma tiene la
 * respuesta. Quién puede hacer qué lo decide el servicio, con el actor.
 */

// ---------------------------------------------------------------------------
// Cuenta
// ---------------------------------------------------------------------------

export const handleRegister: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", registerParentSchema);
  const { session } = await service.registerParent(input);

  // Registrarse acredita la cuenta y NO activa ningún perfil: se llega a la
  // rejilla, igual que en cualquier apertura posterior.
  setAccountSessionCookie(res, session.token, session.expiresAt);

  res.status(201).json(accountWithoutProfile());
};

export const handleLogin: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", loginParentSchema);
  const { session } = await service.loginParent(input);

  // Entrar descarta cualquier perfil que hubiera activo.
  clearProfileSessionCookie(res);
  setAccountSessionCookie(res, session.token, session.expiresAt);

  res.status(200).json(accountWithoutProfile());
};

export const handleLogout: RequestHandler = async (req, res) => {
  const current = req.session;

  if (current !== undefined) {
    // Cerrar la cuenta se lleva por cascada el perfil activo.
    await service.logout(current.accountSessionId);
  }

  clearProfileSessionCookie(res);
  clearAccountSessionCookie(res);

  res.status(204).send();
};

export const handleChangePassword: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", changePasswordSchema);
  const current = accountOf(req);

  await service.changePassword(actorOf(req), current.accountSessionId, input);

  res.status(204).send();
};

// ---------------------------------------------------------------------------
// PIN de adulto
// ---------------------------------------------------------------------------

export const handleChangeAdultPin: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", changeAdultPinSchema);

  await service.changeAdultPin(actorOf(req), input);

  res.status(204).send();
};

/** El niño cambia el PIN de SU perfil, el de la sesión, sabiendo el actual. */
export const handleChangeOwnChildPin: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", changeOwnChildPinSchema);

  await service.changeOwnChildPin(actorOf(req), input);

  res.status(204).send();
};

/**
 * Restablecer el PIN con la contraseña.
 *
 * Solo exige cuenta, no perfil activo: es la vía por la que un padre bloqueado
 * fuera de su propio perfil se rescata.
 */
export const handleResetAdultPin: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", resetAdultPinSchema);
  const account = accountOf(req);

  await service.resetAdultPin(account.accountUserId, input);

  res.status(204).send();
};

// ---------------------------------------------------------------------------
// Rejilla de perfiles
// ---------------------------------------------------------------------------

export const handleListProfiles: RequestHandler = async (req, res) => {
  const account = accountOf(req);
  const profiles = await service.listProfiles(account.accountUserId);

  res.status(200).json({ profiles });
};

export const handleEnterProfile: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", enterProfileSchema);
  const account = accountOf(req);

  const { profile, session } = await service.enterProfile(
    account.accountUserId,
    account.accountSessionId,
    input,
  );

  setProfileSessionCookie(res, session.token, session.expiresAt);

  res.status(200).json({
    actor:
      profile.familyRole === "CHILD"
        ? {
            familyRole: "CHILD" as const,
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            coins: profile.coins ?? 0,
            tutorialSeen: profile.tutorialSeen,
          }
        : {
            familyRole: "PARENT" as const,
            id: profile.id,
            name: profile.name,
            email: profile.email ?? "",
            avatar: profile.avatar,
            tutorialSeen: profile.tutorialSeen,
          },
    hasAccount: true,
  } satisfies SessionState);
};

export const handleLeaveProfile: RequestHandler = async (req, res) => {
  const current = accountOf(req);

  if (current.profileSessionId !== undefined) {
    await service.leaveProfile(current.profileSessionId);
  }

  // Borrar la cookie es idempotente: salir sin estar dentro no es un error.
  clearProfileSessionCookie(res);

  res.status(204).send();
};

// ---------------------------------------------------------------------------
// PIN de los hijos
// ---------------------------------------------------------------------------

export const handleSetChildPin: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", setChildPinSchema);

  await service.setChildPin(actorOf(req), input);

  res.status(204).send();
};

export const handleUnlockChildProfile: RequestHandler = async (req, res) => {
  const raw = req.params.childProfileId;
  const childProfileId = typeof raw === "string" ? raw : "";

  await service.unlockChildProfile(actorOf(req), childProfileId);

  res.status(204).send();
};

// ---------------------------------------------------------------------------
// Estado de la sesión
// ---------------------------------------------------------------------------

/**
 * Responde 200 en las TRES situaciones.
 *
 * No es un endpoint de error: la aplicación web lo llama al cargarse, y tanto
 * «no ha entrado nadie» como «hay cuenta y falta elegir perfil» son casos
 * normales que deciden qué pantalla pintar.
 */
export const handleSessionState: RequestHandler = async (req, res) => {
  res.status(200).json(await buildSessionState(req));
};

async function buildSessionState(req: Request): Promise<SessionState> {
  const current = req.session;

  if (current === undefined) {
    return { actor: null, hasAccount: false };
  }

  const actor = current.actor;
  if (actor === undefined) {
    return accountWithoutProfile();
  }

  if (actor.familyRole === "CHILD") {
    const child = await service.describeChild(actor.childProfileId);

    return child === null
      ? accountWithoutProfile()
      : {
          actor: {
            familyRole: "CHILD",
            id: child.id,
            name: child.name,
            // Resuelto al de por defecto, igual que en la rejilla: eran dos
            // formas del mismo dato y el front tenía que tratar el hueco.
            avatar: resolveAvatarKey(child.avatar),
            coins: child.coins,
            tutorialSeen: child.tutorialSeen,
          },
          hasAccount: true,
        };
  }

  const parent = await service.describeParent(actor.userId);

  return parent === null
    ? accountWithoutProfile()
    : {
        actor: {
          familyRole: "PARENT",
          id: parent.id,
          name: parent.name,
          email: parent.email,
          avatar: parent.avatar,
          tutorialSeen: parent.tutorialSeen,
        },
        hasAccount: true,
      };
}

/** Hay cuenta acreditada y todavía no se ha elegido perfil: toca la rejilla. */
function accountWithoutProfile(): SessionState {
  return { actor: null, hasAccount: true };
}

// ---------------------------------------------------------------------------
// Avatar propio del padre
// ---------------------------------------------------------------------------

/**
 * Marcar el recorrido como visto, o pedirlo otra vez.
 *
 * El controlador parsea y ya: qué tabla se toca lo decide el servicio a partir
 * del actor, que es donde vive la rama por rol.
 */
export const handleUpdateTutorial: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", updateTutorialSchema);

  await service.updateTutorialSeen(actorOf(req), input);
  res.status(204).send();
};

export const handleAvatarUploadUrl: RequestHandler = async (req, res) => {
  const { contentType } = validatedPart(req, "body", createUploadUrlSchema);

  res.status(200).json(await service.requestParentAvatarUploadUrl(actorOf(req), contentType));
};

export const handleUpdateAvatar: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", updateParentAvatarSchema);
  const parent = await service.updateParentAvatar(actorOf(req), input);

  res.status(200).json({
    familyRole: "PARENT" as const,
    id: parent.id,
    name: parent.name,
    email: parent.email,
    avatar: parent.avatar,
  });
};

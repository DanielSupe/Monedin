import {
  changeAdultPinSchema,
  changeOwnChildPinSchema,
  changePasswordSchema,
  createUploadUrlSchema,
  enterProfileSchema,
  loginParentSchema,
  registerParentSchema,
  resetAdultPinSchema,
  setChildPinSchema,
  updateParentAvatarSchema,
  updateThemeSchema,
  updateTutorialSchema,
} from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireChild, requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./auth.controller.js";

const auth = moduleRouter();

export const authRouter: ExpressRouter = auth.router;

auth.publicPost(
  "/auth/register",
  validate({ body: registerParentSchema }),
  controller.handleRegister,
);

auth.publicPost("/auth/login", validate({ body: loginParentSchema }), controller.handleLogin);

auth.publicGet("/auth/session", controller.handleSessionState);

auth.publicPost("/auth/logout", controller.handleLogout);

auth.accountGet("/auth/profiles", controller.handleListProfiles);

auth.accountPost(
  "/auth/profiles/enter",
  validate({ body: enterProfileSchema }),
  controller.handleEnterProfile,
);

auth.accountPost("/auth/profiles/leave", controller.handleLeaveProfile);

auth.accountPost(
  "/auth/pin/reset",
  validate({ body: resetAdultPinSchema }),
  controller.handleResetAdultPin,
);

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
  "/auth/child-profiles/me/pin",
  requireChild,
  validate({ body: changeOwnChildPinSchema }),
  controller.handleChangeOwnChildPin,
);

auth.post(
  "/auth/child-profiles/:childProfileId/unlock",
  requireParent,
  controller.handleUnlockChildProfile,
);

auth.patch(
  "/auth/tutorial",
  validate({ body: updateTutorialSchema }),
  controller.handleUpdateTutorial,
);

auth.patch("/auth/theme", validate({ body: updateThemeSchema }), controller.handleUpdateTheme);

auth.post(
  "/auth/avatar/upload-url",
  requireParent,
  validate({ body: createUploadUrlSchema }),
  controller.handleAvatarUploadUrl,
);

auth.patch(
  "/auth/avatar",
  requireParent,
  validate({ body: updateParentAvatarSchema }),
  controller.handleUpdateAvatar,
);

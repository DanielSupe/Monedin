import {
  childParamsSchema,
  createChildSchema,
  createUploadUrlSchema,
  listChildrenQuerySchema,
  updateChildSchema,
  updateOwnChildSchema,
} from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireChild, requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./children.controller.js";

const children = moduleRouter();

export const childrenRouter: ExpressRouter = children.router;

children.accountPost(
  "/children",
  validate({ body: createChildSchema }),
  controller.handleCreate,
);

children.get("/children/me", requireChild, controller.handleOwnDetail);

children.patch(
  "/children/me",
  requireChild,
  validate({ body: updateOwnChildSchema }),
  controller.handleOwnUpdate,
);

children.post(
  "/children/me/avatar/upload-url",
  requireChild,
  validate({ body: createUploadUrlSchema }),
  controller.handleOwnAvatarUploadUrl,
);

children.get(
  "/children",
  requireParent,
  validate({ query: listChildrenQuerySchema }),
  controller.handleList,
);

children.get(
  "/children/:childId",
  requireParent,
  validate({ params: childParamsSchema }),
  controller.handleDetail,
);

children.patch(
  "/children/:childId",
  requireParent,
  validate({ params: childParamsSchema, body: updateChildSchema }),
  controller.handleUpdate,
);

children.post(
  "/children/:childId/avatar/upload-url",
  requireParent,
  validate({ params: childParamsSchema, body: createUploadUrlSchema }),
  controller.handleAvatarUploadUrl,
);

children.delete(
  "/children/:childId",
  requireParent,
  validate({ params: childParamsSchema }),
  controller.handleDeactivate,
);

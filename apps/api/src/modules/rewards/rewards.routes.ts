import {
  createRewardSchema,
  createUploadUrlSchema,
  listOwnRewardsQuerySchema,
  listRewardsQuerySchema,
  replaceAssignmentsSchema,
  rewardParamsSchema,
  updateRewardSchema,
} from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireChild, requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./rewards.controller.js";

const rewards = moduleRouter();

export const rewardsRouter: ExpressRouter = rewards.router;

rewards.post(
  "/rewards",
  requireParent,
  validate({ body: createRewardSchema }),
  controller.handleCreate,
);

rewards.get(
  "/rewards",
  requireParent,
  validate({ query: listRewardsQuerySchema }),
  controller.handleList,
);

rewards.get(
  "/rewards/mine",
  requireChild,
  validate({ query: listOwnRewardsQuerySchema }),
  controller.handleOwnList,
);

rewards.post(
  "/rewards/image/upload-url",
  requireParent,
  validate({ body: createUploadUrlSchema }),
  controller.handlePendingImageUploadUrl,
);

rewards.get(
  "/rewards/:rewardId",
  validate({ params: rewardParamsSchema }),
  controller.handleDetail,
);

rewards.patch(
  "/rewards/:rewardId",
  requireParent,
  validate({ params: rewardParamsSchema, body: updateRewardSchema }),
  controller.handleUpdate,
);

rewards.put(
  "/rewards/:rewardId/assignments",
  requireParent,
  validate({ params: rewardParamsSchema, body: replaceAssignmentsSchema }),
  controller.handleReplaceAssignments,
);

rewards.post(
  "/rewards/:rewardId/image/upload-url",
  requireParent,
  validate({ params: rewardParamsSchema, body: createUploadUrlSchema }),
  controller.handleImageUploadUrl,
);

rewards.delete(
  "/rewards/:rewardId",
  requireParent,
  validate({ params: rewardParamsSchema }),
  controller.handleRetire,
);

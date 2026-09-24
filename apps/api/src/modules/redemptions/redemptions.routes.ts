import {
  createRedemptionSchema,
  listOwnRedemptionsQuerySchema,
  listRedemptionsQuerySchema,
  redemptionParamsSchema,
} from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireChild, requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./redemptions.controller.js";

const redemptions = moduleRouter();

export const redemptionsRouter: ExpressRouter = redemptions.router;

redemptions.post(
  "/redemptions",
  requireChild,
  validate({ body: createRedemptionSchema }),
  controller.handleCreate,
);

redemptions.get(
  "/redemptions",
  requireParent,
  validate({ query: listRedemptionsQuerySchema }),
  controller.handleList,
);

redemptions.get(
  "/redemptions/mine",
  requireChild,
  validate({ query: listOwnRedemptionsQuerySchema }),
  controller.handleOwnList,
);

redemptions.get(
  "/redemptions/:redemptionId",
  validate({ params: redemptionParamsSchema }),
  controller.handleDetail,
);

redemptions.post(
  "/redemptions/:redemptionId/approve",
  requireParent,
  validate({ params: redemptionParamsSchema }),
  controller.handleApprove,
);

redemptions.post(
  "/redemptions/:redemptionId/reject",
  requireParent,
  validate({ params: redemptionParamsSchema }),
  controller.handleReject,
);

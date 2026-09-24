import { coinsParamsSchema, listCoinsQuerySchema, listOwnCoinsQuerySchema } from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireChild, requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./coins.controller.js";

const coins = moduleRouter();

export const coinsRouter: ExpressRouter = coins.router;

coins.get(
  "/children/me/coins",
  requireChild,
  validate({ query: listOwnCoinsQuerySchema }),
  controller.handleOwnHistory,
);

coins.get(
  "/children/:childId/coins",
  requireParent,
  validate({ params: coinsParamsSchema, query: listCoinsQuerySchema }),
  controller.handleChildHistory,
);

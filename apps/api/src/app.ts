import { API_PREFIX } from "@monedin/contracts";
import cookieParser from "cookie-parser";
import express, { type Express, Router, type Router as ExpressRouter } from "express";
import { assistantRouter } from "./modules/assistant/assistant.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { childrenRouter } from "./modules/children/children.routes.js";
import { coinsRouter } from "./modules/coins/coins.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { redemptionsRouter } from "./modules/redemptions/redemptions.routes.js";
import { rewardsRouter } from "./modules/rewards/rewards.routes.js";
import { tasksRouter } from "./modules/tasks/tasks.routes.js";
import { errorHandler } from "./shared/errors/error-handler.js";
import { notFoundHandler } from "./shared/errors/not-found-handler.js";
import { resolveSession } from "./shared/http/session.js";

export const apiRouters: ExpressRouter[] = [
  healthRouter,
  authRouter,
  childrenRouter,
  coinsRouter,
  tasksRouter,
  rewardsRouter,
  redemptionsRouter,
  assistantRouter,
];

export function createApp(routers: ExpressRouter[] = apiRouters): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  const api = Router();

  api.use(resolveSession);

  for (const router of routers) {
    api.use(router);
  }

  app.use(API_PREFIX, api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

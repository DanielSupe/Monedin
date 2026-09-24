import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { handleGetHealth } from "./health.controller.js";

const health = moduleRouter();

health.publicGet("/health", handleGetHealth);

export const healthRouter: ExpressRouter = health.router;

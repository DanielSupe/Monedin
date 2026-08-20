import { Router, type Router as ExpressRouter } from "express";
import { handleGetHealth } from "./health.controller.js";

/**
 * Monta las rutas del módulo. Cero lógica.
 *
 * El router se monta bajo el prefijo `/api/v1`, que se define una sola vez en
 * `@monedin/contracts` y comparten API y front.
 */
export const healthRouter: ExpressRouter = Router();

healthRouter.get("/health", handleGetHealth);

import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { handleGetHealth } from "./health.controller.js";

/**
 * Monta las rutas del módulo. Cero lógica.
 *
 * El router se monta bajo el prefijo `/api/v1`, que se define una sola vez en
 * `@monedin/contracts` y comparten API y front.
 *
 * `health` es PÚBLICA y se declara como tal: es una sonda de vida y pedirle
 * credenciales la haría inútil para un balanceador.
 */
const health = moduleRouter();

health.publicGet("/health", handleGetHealth);

export const healthRouter: ExpressRouter = health.router;

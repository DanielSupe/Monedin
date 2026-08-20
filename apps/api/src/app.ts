import { API_PREFIX } from "@monedin/contracts";
import express, { type Express, Router, type Router as ExpressRouter } from "express";
import { healthRouter } from "./modules/health/health.routes.js";
import { errorHandler } from "./shared/errors/error-handler.js";
import { notFoundHandler } from "./shared/errors/not-found-handler.js";

/**
 * Construye la aplicación Express.
 *
 * Se separa de `server.ts` para que los tests puedan levantar la app sin abrir
 * un puerto. Recibe los routers a montar: la lista por defecto es la de los
 * módulos de la API, y crece con cada módulo nuevo.
 *
 * El orden importa: primero las rutas, después el manejador de ruta desconocida
 * y en último lugar el traductor de errores. Si el traductor no va al final, hay
 * errores que se escapan al formato por defecto de Express.
 */
export const apiRouters: ExpressRouter[] = [healthRouter];

export function createApp(routers: ExpressRouter[] = apiRouters): Express {
  const app = express();

  // No anunciar el framework ni su versión.
  app.disable("x-powered-by");

  app.use(express.json({ limit: "1mb" }));

  // Todas las rutas de la API cuelgan del prefijo versionado. `/health` sin
  // prefijo no existe, y así una ruta de navegación del front nunca choca con
  // un endpoint.
  const api = Router();
  for (const router of routers) {
    api.use(router);
  }
  app.use(API_PREFIX, api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

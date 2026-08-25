import { API_PREFIX } from "@monedin/contracts";
import cookieParser from "cookie-parser";
import express, { type Express, Router, type Router as ExpressRouter } from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { childrenRouter } from "./modules/children/children.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { rewardsRouter } from "./modules/rewards/rewards.routes.js";
import { tasksRouter } from "./modules/tasks/tasks.routes.js";
import { errorHandler } from "./shared/errors/error-handler.js";
import { notFoundHandler } from "./shared/errors/not-found-handler.js";
import { resolveSession } from "./shared/http/session.js";

/**
 * Construye la aplicación Express.
 *
 * Se separa de `server.ts` para que los tests puedan levantar la app sin abrir
 * un puerto. Recibe los routers a montar: la lista por defecto es la de los
 * módulos de la API, y crece con cada módulo nuevo.
 *
 * El orden importa, y aquí más que antes:
 *
 *   1. Lectura de cookies y del cuerpo.
 *   2. `resolveSession`, que deja el actor disponible SIN rechazar nada.
 *   3. Los routers.
 *   4. Ruta desconocida y, al final del todo, el traductor de errores.
 *
 * El guardián de sesión NO se monta aquí: va dentro de la cadena de cada ruta,
 * puesto por `moduleRouter()`. Montarlo aquí obligaría a elegir entre ponerlo
 * antes de los routers —cuando todavía no se sabe si la ruta es pública— o
 * después, cuando el manejador ya habría respondido. Ver la decisión 5 del
 * design de `add-authentication`.
 */

export const apiRouters: ExpressRouter[] = [
  healthRouter,
  authRouter,
  childrenRouter,
  tasksRouter,
  rewardsRouter,
];

export function createApp(routers: ExpressRouter[] = apiRouters): Express {
  const app = express();

  // No anunciar el framework ni su versión.
  app.disable("x-powered-by");

  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  // Todas las rutas de la API cuelgan del prefijo versionado. `/health` sin
  // prefijo no existe, y así una ruta de navegación del front nunca choca con
  // un endpoint.
  const api = Router();

  // Resuelve el actor si hay sesión. Nunca rechaza.
  api.use(resolveSession);

  for (const router of routers) {
    api.use(router);
  }

  app.use(API_PREFIX, api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

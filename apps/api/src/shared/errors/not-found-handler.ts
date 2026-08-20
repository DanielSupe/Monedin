import type { RequestHandler } from "express";
import { RouteNotFoundError } from "./domain-errors.js";

/**
 * Ruta desconocida.
 *
 * Se monta después de todas las rutas y antes del traductor de errores. Existe
 * para que un 404 de ruta tenga exactamente la misma forma de cuerpo que
 * cualquier otro error, en vez del HTML por defecto de Express.
 */
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new RouteNotFoundError());
};

import type { RequestHandler } from "express";
import { getHealth } from "./health.service.js";

/**
 * Parseo y serialización. Cero autorización.
 *
 * En un módulo de dominio, el controlador construye el actor a partir de la
 * sesión y se lo pasa al servicio. Lo que NO hace, nunca, es decidir si ese
 * actor tiene permiso: esa decisión vive en el servicio.
 */
export const handleGetHealth: RequestHandler = (_req, res) => {
  res.status(200).json(getHealth());
};

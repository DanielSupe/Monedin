import { coinsParamsSchema, listCoinsQuerySchema, listOwnCoinsQuerySchema } from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireChild, requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./coins.controller.js";

/**
 * Monta las rutas del historial de monedas. Cero lógica.
 *
 * SOLO LECTURA, y es una decisión y no un descuido: crear un movimiento suelto
 * mueve dinero, así que exige transacción interactiva, comprobación de fila
 * afectada y pruebas de doble tap. `MANUAL_ADJUSTMENT` existe en el enum
 * esperando exactamente eso y sigue sin exponerse.
 *
 * OJO AL ORDEN: `/children/me/coins` va ANTES que `/children/:childId/coins`.
 * Express casa las rutas por orden de registro, así que al revés «me» entraría
 * por `:childId` y un niño acabaría pidiendo el historial del perfil llamado
 * «me», que no existe. Mismo cuidado que en `children`.
 */
const coins = moduleRouter();

export const coinsRouter: ExpressRouter = coins.router;

// --- El historial propio del niño -------------------------------------------
//
// Sin ningún identificador, ni en la ruta ni en la query: ahí está la garantía
// de que no puede leer el de su hermano. Su esquema es `.strict()`, así que
// mandar uno es 422.

coins.get(
  "/children/me/coins",
  requireChild,
  validate({ query: listOwnCoinsQuerySchema }),
  controller.handleOwnHistory,
);

// --- El de un hijo, pedido por su padre --------------------------------------

coins.get(
  "/children/:childId/coins",
  requireParent,
  validate({ params: coinsParamsSchema, query: listCoinsQuerySchema }),
  controller.handleChildHistory,
);

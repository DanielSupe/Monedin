import {
  createRedemptionSchema,
  listOwnRedemptionsQuerySchema,
  listRedemptionsQuerySchema,
  redemptionParamsSchema,
} from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireChild, requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./redemptions.controller.js";

/**
 * Monta las rutas del módulo. Cero lógica.
 *
 * Todas exigen ACTOR: solicitar y resolver un canje no son pasos previos a
 * ser alguien, así que no hay ninguna ruta de solo cuenta.
 *
 * Solo seis rutas: un canje no se edita ni se retira, solo se resuelve. Sin
 * `PATCH`, `PUT` ni `DELETE`. Ver la decisión 7 del design.
 */
const redemptions = moduleRouter();

export const redemptionsRouter: ExpressRouter = redemptions.router;

// --- Alta, por el niño -------------------------------------------------------

redemptions.post(
  "/redemptions",
  requireChild,
  validate({ body: createRedemptionSchema }),
  controller.handleCreate,
);

// --- Bandeja del padre --------------------------------------------------------

redemptions.get(
  "/redemptions",
  requireParent,
  validate({ query: listRedemptionsQuerySchema }),
  controller.handleList,
);

// --- Lista propia del niño ----------------------------------------------------
//
// OJO AL ORDEN: esta va ANTES que `/redemptions/:redemptionId`. Express casa
// las rutas por orden de registro, así que al revés «mine» entraría por
// `:redemptionId`, el servicio buscaría un canje con ese identificador y el
// niño recibiría un 404 en su propia lista. Mismo tropiezo que `/tasks/mine`
// y `/rewards/mine`.

redemptions.get(
  "/redemptions/mine",
  requireChild,
  validate({ query: listOwnRedemptionsQuerySchema }),
  controller.handleOwnList,
);

// --- Detalle, para los dos roles ----------------------------------------------
//
// ÚNICA ruta del módulo sin filtro de rol, y a conciencia: cada rol ve su
// propia vista del mismo canje. La rama vive en el servicio.

redemptions.get(
  "/redemptions/:redemptionId",
  validate({ params: redemptionParamsSchema }),
  controller.handleDetail,
);

// --- Transiciones, por el padre ------------------------------------------------

redemptions.post(
  "/redemptions/:redemptionId/approve",
  requireParent,
  validate({ params: redemptionParamsSchema }),
  controller.handleApprove,
);

redemptions.post(
  "/redemptions/:redemptionId/reject",
  requireParent,
  validate({ params: redemptionParamsSchema }),
  controller.handleReject,
);

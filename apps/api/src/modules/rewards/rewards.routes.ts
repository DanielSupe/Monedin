import {
  createRewardSchema,
  createUploadUrlSchema,
  listOwnRewardsQuerySchema,
  listRewardsQuerySchema,
  replaceAssignmentsSchema,
  rewardParamsSchema,
  updateRewardSchema,
} from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireChild, requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./rewards.controller.js";

/**
 * Monta las rutas del módulo. Cero lógica.
 *
 * Todas exigen ACTOR: publicar y pedir premios no son pasos previos a ser
 * alguien, así que aquí no hay ninguna ruta de solo cuenta.
 */
const rewards = moduleRouter();

export const rewardsRouter: ExpressRouter = rewards.router;

// --- Gestión del padre ------------------------------------------------------

rewards.post(
  "/rewards",
  requireParent,
  validate({ body: createRewardSchema }),
  controller.handleCreate,
);

rewards.get(
  "/rewards",
  requireParent,
  validate({ query: listRewardsQuerySchema }),
  controller.handleList,
);

// --- Escaparate propio del niño ----------------------------------------------
//
// OJO AL ORDEN: esta va ANTES que `/rewards/:rewardId`. Express casa las rutas
// por orden de registro, así que al revés «mine» entraría por `:rewardId`, el
// servicio buscaría un premio con ese identificador y el niño recibiría un 404
// en su propio escaparate. El fallo no es ruidoso —un 404 es perfectamente
// plausible— y por eso lleva test. Es el mismo tropiezo que `/tasks/mine` y
// `/children/me`.

rewards.get(
  "/rewards/mine",
  requireChild,
  validate({ query: listOwnRewardsQuerySchema }),
  controller.handleOwnList,
);

// --- Detalle, para los dos roles --------------------------------------------
//
// ÚNICA ruta del módulo sin filtro de rol, y a conciencia: cada rol ve su
// propia vista del mismo premio. La rama vive en el servicio, que es donde se
// decide quién puede ver qué; el controlador no sabe de roles.

rewards.get(
  "/rewards/:rewardId",
  validate({ params: rewardParamsSchema }),
  controller.handleDetail,
);

rewards.patch(
  "/rewards/:rewardId",
  requireParent,
  validate({ params: rewardParamsSchema, body: updateRewardSchema }),
  controller.handleUpdate,
);

// `PUT` y no `PATCH`: lo que se manda es el conjunto COMPLETO de ofertas, no
// una actualización parcial. Ver la decisión 7 del design.
rewards.put(
  "/rewards/:rewardId/assignments",
  requireParent,
  validate({ params: rewardParamsSchema, body: replaceAssignmentsSchema }),
  controller.handleReplaceAssignments,
);

rewards.post(
  "/rewards/:rewardId/image/upload-url",
  requireParent,
  validate({ params: rewardParamsSchema, body: createUploadUrlSchema }),
  controller.handleImageUploadUrl,
);

rewards.delete(
  "/rewards/:rewardId",
  requireParent,
  validate({ params: rewardParamsSchema }),
  controller.handleRetire,
);

import {
  createTaskSchema,
  listOwnTasksQuerySchema,
  listTasksQuerySchema,
  taskParamsSchema,
  updateTaskSchema,
} from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { requireChild, requireParent } from "../../shared/http/session.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./tasks.controller.js";

/**
 * Monta las rutas del módulo. Cero lógica.
 *
 * Todas exigen ACTOR: aquí no hay ninguna de solo cuenta. Repartir tareas y
 * aprobarlas no son pasos previos a ser alguien, son cosas que hace alguien
 * concreto, y el saldo de un niño no se toca desde una cookie de dispositivo.
 *
 * Las transiciones van por POST y no por PATCH. Aprobar no es una actualización
 * parcial de un recurso: tiene un efecto secundario sobre otro —el saldo— y no
 * es idempotente. El precedente del proyecto son las acciones de `auth`, todas
 * POST. Ver la decisión 7 del design de `add-tasks`.
 */
const tasks = moduleRouter();

export const tasksRouter: ExpressRouter = tasks.router;

// --- Gestión del padre ------------------------------------------------------

tasks.post(
  "/tasks",
  requireParent,
  validate({ body: createTaskSchema }),
  controller.handleCreate,
);

tasks.get(
  "/tasks",
  requireParent,
  validate({ query: listTasksQuerySchema }),
  controller.handleList,
);

// --- Vista propia del niño --------------------------------------------------
//
// OJO AL ORDEN: esta va ANTES que `/tasks/:taskId`. Express casa las rutas por
// orden de registro, así que al revés «mine» entraría por `:taskId`, el
// servicio buscaría una tarea con ese identificador y el niño recibiría un 404
// en su propia lista. El fallo no es ruidoso —un 404 es perfectamente
// plausible— y por eso lleva test. Es el mismo tropiezo que `/children/me`.

tasks.get(
  "/tasks/mine",
  requireChild,
  validate({ query: listOwnTasksQuerySchema }),
  controller.handleOwnList,
);

// --- Detalle, para los dos roles --------------------------------------------
//
// ÚNICA ruta del módulo sin filtro de rol, y a conciencia: cada rol ve su
// propia vista de la misma tarea. La rama vive en el servicio, que es donde se
// decide quién puede ver qué; el controlador no sabe de roles.

tasks.get(
  "/tasks/:taskId",
  validate({ params: taskParamsSchema }),
  controller.handleDetail,
);

tasks.patch(
  "/tasks/:taskId",
  requireParent,
  validate({ params: taskParamsSchema, body: updateTaskSchema }),
  controller.handleUpdate,
);

tasks.delete(
  "/tasks/:taskId",
  requireParent,
  validate({ params: taskParamsSchema }),
  controller.handleDelete,
);

// --- Transiciones -----------------------------------------------------------

tasks.post(
  "/tasks/:taskId/complete",
  requireChild,
  validate({ params: taskParamsSchema }),
  controller.handleComplete,
);

tasks.post(
  "/tasks/:taskId/approve",
  requireParent,
  validate({ params: taskParamsSchema }),
  controller.handleApprove,
);

tasks.post(
  "/tasks/:taskId/reject",
  requireParent,
  validate({ params: taskParamsSchema }),
  controller.handleReject,
);

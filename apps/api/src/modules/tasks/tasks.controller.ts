import {
  createTaskSchema,
  listOwnTasksQuerySchema,
  listTasksQuerySchema,
  taskParamsSchema,
  updateTaskSchema,
} from "@monedin/contracts";
import type { RequestHandler } from "express";
import { actorOf } from "../../shared/http/session.js";
import { validatedPart } from "../../shared/http/validate.js";
import * as service from "./tasks.service.js";

/**
 * Parseo y serialización. Cero autorización.
 *
 * Ni un `if` sobre el rol ni sobre la propiedad de una tarea: eso lo decide el
 * servicio, con el actor. Aquí solo se lee la petición y se le da forma a la
 * respuesta.
 *
 * Las transiciones devuelven 200 con la tarea RESULTANTE, no 204: quien acaba
 * de aprobar necesita ver el estado en el que quedó sin volver a preguntar, y
 * es lo que permite al front pintar la fila nueva sin recargar la lista entera.
 */

export const handleCreate: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", createTaskSchema);

  res.status(201).json(await service.createBatch(actorOf(req), input));
};

export const handleList: RequestHandler = async (req, res) => {
  const query = validatedPart(req, "query", listTasksQuerySchema);

  res.status(200).json(await service.listBatches(actorOf(req), query));
};

export const handleDetail: RequestHandler = async (req, res) => {
  const { taskId } = validatedPart(req, "params", taskParamsSchema);

  res.status(200).json(await service.getTaskForActor(actorOf(req), taskId));
};

export const handleUpdate: RequestHandler = async (req, res) => {
  const { taskId } = validatedPart(req, "params", taskParamsSchema);
  const input = validatedPart(req, "body", updateTaskSchema);

  res.status(200).json(await service.updateTask(actorOf(req), taskId, input));
};

export const handleDelete: RequestHandler = async (req, res) => {
  const { taskId } = validatedPart(req, "params", taskParamsSchema);

  await service.deleteTask(actorOf(req), taskId);

  res.status(204).send();
};

// ---------------------------------------------------------------------------
// Vista propia del niño
// ---------------------------------------------------------------------------

export const handleOwnList: RequestHandler = async (req, res) => {
  const query = validatedPart(req, "query", listOwnTasksQuerySchema);

  res.status(200).json(await service.listOwnTasks(actorOf(req), query));
};

// ---------------------------------------------------------------------------
// Transiciones
// ---------------------------------------------------------------------------

export const handleComplete: RequestHandler = async (req, res) => {
  const { taskId } = validatedPart(req, "params", taskParamsSchema);

  res.status(200).json(await service.completeTask(actorOf(req), taskId));
};

export const handleApprove: RequestHandler = async (req, res) => {
  const { taskId } = validatedPart(req, "params", taskParamsSchema);

  res.status(200).json(await service.approveTask(actorOf(req), taskId));
};

export const handleReject: RequestHandler = async (req, res) => {
  const { taskId } = validatedPart(req, "params", taskParamsSchema);

  res.status(200).json(await service.rejectTask(actorOf(req), taskId));
};

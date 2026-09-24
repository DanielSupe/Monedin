import {
  completeTaskSchema,
  createTaskSchema,
  createUploadUrlSchema,
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

const tasks = moduleRouter();

export const tasksRouter: ExpressRouter = tasks.router;

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

tasks.get(
  "/tasks/mine",
  requireChild,
  validate({ query: listOwnTasksQuerySchema }),
  controller.handleOwnList,
);

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

tasks.post(
  "/tasks/:taskId/complete",
  requireChild,
  validate({ params: taskParamsSchema, body: completeTaskSchema }),
  controller.handleComplete,
);

tasks.post(
  "/tasks/:taskId/evidence/upload-url",
  requireChild,
  validate({ params: taskParamsSchema, body: createUploadUrlSchema }),
  controller.handleEvidenceUploadUrl,
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

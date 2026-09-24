import {
  type CreateTaskInput,
  type CreatedTasks,
  type ListOwnTasksQuery,
  type ListTasksQuery,
  type OwnTask,
  type OwnTasksPage,
  type Task,
  type TaskBatchesPage,
  type UpdateTaskInput,
  createdTasksSchema,
  ownTaskSchema,
  ownTasksPageSchema,
  taskBatchesPageSchema,
  taskSchema,
  type ImageContentType,
  type UploadUrl,
  uploadUrlSchema,
} from "@monedin/contracts";
import { z } from "zod";
import { apiFetch } from "../lib/http-client.js";

const emptySchema = z.unknown();

function queryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  for (const [clave, valor] of Object.entries(query)) {
    if (valor !== undefined) params.set(clave, String(valor));
  }

  const cadena = params.toString();
  return cadena === "" ? "" : `?${cadena}`;
}

export function createTasks(input: CreateTaskInput): Promise<CreatedTasks> {
  return apiFetch("/tasks", createdTasksSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchTaskBatches(query: Partial<ListTasksQuery> = {}): Promise<TaskBatchesPage> {
  return apiFetch(
    `/tasks${queryString({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      childId: query.childId,
    })}`,
    taskBatchesPageSchema,
  );
}

export function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  return apiFetch(`/tasks/${taskId}`, taskSchema, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiFetch(`/tasks/${taskId}`, emptySchema, { method: "DELETE" });
}

export function approveTask(taskId: string): Promise<Task> {
  return apiFetch(`/tasks/${taskId}/approve`, taskSchema, { method: "POST" });
}

export function rejectTask(taskId: string): Promise<Task> {
  return apiFetch(`/tasks/${taskId}/reject`, taskSchema, { method: "POST" });
}

export function fetchOwnTasks(query: Partial<ListOwnTasksQuery> = {}): Promise<OwnTasksPage> {
  return apiFetch(
    `/tasks/mine${queryString({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
    })}`,
    ownTasksPageSchema,
  );
}

export function requestEvidenceUploadUrl(
  taskId: string,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  return apiFetch(`/tasks/${taskId}/evidence/upload-url`, uploadUrlSchema, {
    method: "POST",
    body: JSON.stringify({ contentType }),
  });
}

export function completeTask(taskId: string, evidenceUploadKey?: string): Promise<OwnTask> {
  return apiFetch(`/tasks/${taskId}/complete`, ownTaskSchema, {
    method: "POST",
    body: JSON.stringify(evidenceUploadKey === undefined ? {} : { evidenceUploadKey }),
  });
}

export const tasksQueryKey = ["tasks"] as const;

export const taskBatchesQueryKey = (query: Partial<ListTasksQuery>) =>
  ["tasks", "batches", query] as const;

export const ownTasksQueryKey = (query: Partial<ListOwnTasksQuery> = {}) =>
  ["tasks", "mine", query] as const;

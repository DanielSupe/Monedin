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
} from "@monedin/contracts";
import { z } from "zod";
import { apiFetch } from "../lib/http-client.js";

/**
 * Llamadas de las tareas.
 *
 * Los tipos NO se declaran aquí: vienen de `@monedin/contracts`, el mismo
 * paquete del que la API deriva su validación. Si el contrato cambia, esto deja
 * de compilar.
 *
 * Las transiciones van por POST, igual que en la API: aprobar no es una
 * actualización parcial de un recurso.
 */

const emptySchema = z.unknown();

/** Query string de un listado, en el orden en que lo espera la API. */
function queryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  for (const [clave, valor] of Object.entries(query)) {
    if (valor !== undefined) params.set(clave, String(valor));
  }

  const cadena = params.toString();
  return cadena === "" ? "" : `?${cadena}`;
}

// --- Gestión del padre ------------------------------------------------------

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

// --- Vista propia del niño --------------------------------------------------

/**
 * Las tareas del niño.
 *
 * NO admite un identificador de hijo, igual que la API: el perfil sale de la
 * sesión. Si esta función aceptara uno, la garantía dejaría de ser estructural.
 */
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

export function completeTask(taskId: string): Promise<OwnTask> {
  return apiFetch(`/tasks/${taskId}/complete`, ownTaskSchema, { method: "POST" });
}

// --- Claves de consulta -----------------------------------------------------

/** Raíz de todo lo de tareas: invalidarla refresca las dos vistas. */
export const tasksQueryKey = ["tasks"] as const;

export const taskBatchesQueryKey = (query: Partial<ListTasksQuery>) =>
  ["tasks", "batches", query] as const;

export const ownTasksQueryKey = (query: Partial<ListOwnTasksQuery> = {}) =>
  ["tasks", "mine", query] as const;

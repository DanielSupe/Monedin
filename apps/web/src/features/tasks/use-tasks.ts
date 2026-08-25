import {
  ERROR_CODES,
  type ListOwnTasksQuery,
  type ListTasksQuery,
  type UpdateTaskInput,
} from "@monedin/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../../api/auth.js";
import * as childrenApi from "../../api/children.js";
import * as api from "../../api/tasks.js";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";

/**
 * Datos de las tareas.
 *
 * Lo que hay que invalidar al aprobar no es solo la lista: aprobar cambia DOS
 * cosas, el estado de la tarea y el SALDO del hijo. Y el saldo viaja dentro del
 * actor de `GET /auth/session` y también en `GET /children/me`, así que olvidar
 * esas dos claves deja al niño viendo su saldo viejo justo después de que le
 * paguen, que es el momento en el que más mira. Ver la decisión 9 del design de
 * `add-tasks`.
 */
function useRefreshTasks(): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: api.tasksQueryKey });
  };
}

/** Lo anterior MÁS todo lo que enseña un saldo. Solo para lo que mueve monedas. */
function useRefreshTasksAndCoins(): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: api.tasksQueryKey });
    await queryClient.invalidateQueries({ queryKey: authApi.sessionQueryKey });
    await queryClient.invalidateQueries({ queryKey: childrenApi.ownChildQueryKey });
    await queryClient.invalidateQueries({ queryKey: childrenApi.childrenQueryKey });
  };
}

// --- Gestión del padre ------------------------------------------------------

export function useTaskBatches(query: Partial<ListTasksQuery>) {
  return useQuery({
    queryKey: api.taskBatchesQueryKey(query),
    queryFn: () => api.fetchTaskBatches(query),
  });
}

export function useCreateTasks() {
  const refresh = useRefreshTasks();

  return useMutation({ mutationFn: api.createTasks, onSuccess: refresh });
}

export function useUpdateTask() {
  const refresh = useRefreshTasks();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      api.updateTask(taskId, input),
    onSuccess: refresh,
  });
}

export function useDeleteTask() {
  const refresh = useRefreshTasks();

  return useMutation({ mutationFn: api.deleteTask, onSuccess: refresh });
}

/** Aprobar ACREDITA: es la mutación que obliga a invalidar también el saldo. */
export function useApproveTask() {
  const refresh = useRefreshTasksAndCoins();

  return useMutation({ mutationFn: api.approveTask, onSuccess: refresh });
}

export function useRejectTask() {
  const refresh = useRefreshTasks();

  return useMutation({ mutationFn: api.rejectTask, onSuccess: refresh });
}

// --- Vista propia del niño --------------------------------------------------

export function useOwnTasks(query: Partial<ListOwnTasksQuery> = {}) {
  return useQuery({
    queryKey: api.ownTasksQueryKey(query),
    queryFn: () => api.fetchOwnTasks(query),
  });
}

/** Marcar como hecha NO paga, así que no hace falta refrescar ningún saldo. */
export function useCompleteTask() {
  const refresh = useRefreshTasks();

  return useMutation({ mutationFn: api.completeTask, onSuccess: refresh });
}

/**
 * Traduce un error de tareas a un texto para la persona.
 *
 * NO se reutiliza `describeChildrenError` a propósito: allí un 409 significa
 * «esta familia ya tiene el máximo de perfiles», y aquí significa «esa tarea ya
 * no está pendiente». El código HTTP es estable, pero no quiere decir lo mismo
 * en dos módulos distintos; el mensaje lo decide el contexto.
 */
export function describeTasksError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return messages.errors.network;
  }

  switch (error.code) {
    case ERROR_CODES.CONFLICT:
      return messages.tasks.conflict;
    case ERROR_CODES.NOT_FOUND:
      return messages.tasks.notFound;
    case ERROR_CODES.FORBIDDEN:
      return messages.tasks.forbidden;
    case ERROR_CODES.VALIDATION_ERROR:
      return error.details[0]?.message ?? messages.tasks.invalidData;
    default:
      return messages.errors.network;
  }
}

/** El estado de una tarea, tal como lo lee una persona. */
export function describeTaskStatus(status: "PENDING" | "COMPLETED" | "APPROVED"): string {
  switch (status) {
    case "PENDING":
      return messages.tasks.statusPending;
    case "COMPLETED":
      return messages.tasks.statusCompleted;
    case "APPROVED":
      return messages.tasks.statusApproved;
  }
}

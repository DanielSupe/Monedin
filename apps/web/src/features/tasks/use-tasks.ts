import {
  ERROR_CODES,
  type ListOwnTasksQuery,
  type ListTasksQuery,
  type UpdateTaskInput,
} from "@monedin/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../../api/auth.js";
import * as childrenApi from "../../api/children.js";
import * as coinsApi from "../../api/coins.js";
import * as api from "../../api/tasks.js";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";

function useRefreshTasks(): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: api.tasksQueryKey });
  };
}

function useRefreshTasksAndCoins(): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: api.tasksQueryKey });
    await queryClient.invalidateQueries({ queryKey: authApi.sessionQueryKey });
    await queryClient.invalidateQueries({ queryKey: childrenApi.ownChildQueryKey });
    await queryClient.invalidateQueries({ queryKey: childrenApi.childrenQueryKey });

    await queryClient.invalidateQueries({ queryKey: coinsApi.coinHistoryQueryKey });
  };
}

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

export function useApproveTask() {
  const refresh = useRefreshTasksAndCoins();

  return useMutation({ mutationFn: api.approveTask, onSuccess: refresh });
}

export function useRejectTask() {
  const refresh = useRefreshTasks();

  return useMutation({ mutationFn: api.rejectTask, onSuccess: refresh });
}

export function useOwnTasks(query: Partial<ListOwnTasksQuery> = {}) {
  return useQuery({
    queryKey: api.ownTasksQueryKey(query),
    queryFn: () => api.fetchOwnTasks(query),
  });
}

export function useCompleteTask() {
  const refresh = useRefreshTasks();

  return useMutation({
    mutationFn: ({ taskId, evidenceUploadKey }: { taskId: string; evidenceUploadKey?: string }) =>
      api.completeTask(taskId, evidenceUploadKey),
    onSuccess: refresh,
  });
}

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

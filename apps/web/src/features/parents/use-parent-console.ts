import { MAX_PAGE_SIZE, type Child } from "@monedin/contracts";
import { useChildren } from "../children/use-children.js";
import { useRedemptions } from "../redemptions/use-redemptions.js";
import { useTaskBatches } from "../tasks/use-tasks.js";

export type Recuento = { value: number; exact: boolean };

export type ParentConsole = {
  tasksToApprove: Recuento;
  redemptionsWaiting: Recuento;
  children: Child[];
  isPending: boolean;
  error: unknown;
};

export function usePendingCounts(): {
  tasksToApprove: Recuento;
  redemptionsWaiting: Recuento;
  isPending: boolean;
  error: unknown;
} {
  const tareas = useTaskBatches({ page: 1, pageSize: MAX_PAGE_SIZE, status: "COMPLETED" });

  const canjes = useRedemptions({ page: 1, pageSize: 1, status: "PENDING" });

  const filasCompletadas = (tareas.data?.items ?? []).reduce(
    (suma, reparto) =>
      suma + reparto.tasks.filter((tarea) => tarea.status === "COMPLETED").length,
    0,
  );

  return {
    tasksToApprove: {
      value: filasCompletadas,

      exact: (tareas.data?.totalPages ?? 1) <= 1,
    },
    redemptionsWaiting: { value: canjes.data?.total ?? 0, exact: true },
    isPending: tareas.isPending || canjes.isPending,

    error: tareas.error ?? canjes.error,
  };
}

export function useParentConsole(): ParentConsole {
  const bandejas = usePendingCounts();

  const hijos = useChildren(1);

  return {
    ...bandejas,
    children: hijos.data?.items ?? [],
    isPending: bandejas.isPending || hijos.isPending,
    error: bandejas.error ?? hijos.error,
  };
}

import { TASK_STATUSES } from "@monedin/contracts";
import { createFileRoute } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { statusSearch } from "../app/search.js";
import { TaskBatchList } from "../features/tasks/TaskBatchList.js";

/**
 * Bandeja de tareas del padre, agrupada por reparto.
 *
 * Filtrar por COMPLETED es la bandeja de aprobacion, y por eso el filtro viaja
 * en la direccion: es lo que un padre marca, abre una tarea y vuelve.
 */
export const Route = createFileRoute("/tasks/")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  validateSearch: statusSearch(TASK_STATUSES),
  component: TasksRoute,
});

function TasksRoute(): React.ReactElement {
  const { page, status } = Route.useSearch();

  return <TaskBatchList page={page} status={status} />;
}

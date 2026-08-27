import { createFileRoute } from "@tanstack/react-router";
import { requireChild } from "../app/guards.js";
import { MyTasks } from "../features/tasks/MyTasks.js";

/** Destino del nino. Un padre que abra esta direccion acaba en su propio inicio. */
export const Route = createFileRoute("/me/tasks")({
  beforeLoad: ({ context }) => requireChild(context.queryClient),
  component: MyTasks,
});

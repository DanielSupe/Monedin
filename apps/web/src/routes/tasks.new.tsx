import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireParent } from "../app/guards.js";
import { TaskForm } from "../features/tasks/TaskForm.js";

/** Repartir una tarea entre uno o varios hijos. */
export const Route = createFileRoute("/tasks/new")({
  beforeLoad: ({ context }) => requireParent(context.queryClient),
  component: NewTaskRoute,
});

function NewTaskRoute(): React.ReactElement {
  const navigate = useNavigate();
  const alListado = (): void =>
    void navigate({ to: "/tasks", search: { page: 1, status: "ALL" } });

  return <TaskForm onSaved={alListado} />;
}

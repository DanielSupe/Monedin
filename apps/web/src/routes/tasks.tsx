import { Link, createFileRoute } from "@tanstack/react-router";
import { AuthGate, ParentOnly } from "../features/auth/AuthGate.js";
import { TaskBatchList } from "../features/tasks/TaskBatchList.js";
import { messages } from "../lib/messages.js";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
});

/**
 * Reparto y bandeja de aprobación del padre.
 *
 * `AuthGate` decide antes si toca la pantalla de acceso o la rejilla;
 * `ParentOnly` cubre el caso de un niño que llegue aquí con la URL. La guarda de
 * verdad sigue estando en el servidor, que responde 403 a un niño que llame a
 * `GET /tasks`: esto solo evita enseñar una interfaz que no va a funcionar.
 */
function TasksPage(): React.ReactElement {
  return (
    <AuthGate>
      <ParentOnly fallback={<NoEsParaTi />}>
        <TaskBatchList />
      </ParentOnly>
    </AuthGate>
  );
}

function NoEsParaTi(): React.ReactElement {
  return (
    <section>
      <p>{messages.tasks.forbidden}</p>
      <Link to="/">{messages.tasks.back}</Link>
    </section>
  );
}

import { Link, createFileRoute } from "@tanstack/react-router";
import { AuthGate, ParentOnly } from "../features/auth/AuthGate.js";
import { ChildrenList } from "../features/children/ChildrenList.js";
import { messages } from "../lib/messages.js";

export const Route = createFileRoute("/children")({
  component: ChildrenPage,
});

/**
 * Gestión de los perfiles de la familia.
 *
 * `AuthGate` decide antes si toca la pantalla de acceso o la rejilla;
 * `ParentOnly` cubre el caso de un niño que llegue aquí con la URL. La guarda
 * de verdad sigue estando en el servidor, que responde 403 a un niño que llame
 * a `GET /children`: esto solo evita enseñar una interfaz que no va a funcionar.
 */
function ChildrenPage(): React.ReactElement {
  return (
    <AuthGate>
      <ParentOnly fallback={<NoEsParaTi />}>
        <ChildrenList />
      </ParentOnly>
    </AuthGate>
  );
}

function NoEsParaTi(): React.ReactElement {
  return (
    <section>
      <p>{messages.children.forbidden}</p>
      <Link to="/">{messages.children.back}</Link>
    </section>
  );
}

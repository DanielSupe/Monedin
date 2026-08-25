import { Link, createFileRoute } from "@tanstack/react-router";
import { AuthGate, ParentOnly } from "../features/auth/AuthGate.js";
import { RewardCatalog } from "../features/rewards/RewardCatalog.js";
import { messages } from "../lib/messages.js";

export const Route = createFileRoute("/rewards")({
  component: RewardsPage,
});

/**
 * Catálogo de premios del padre.
 *
 * `AuthGate` decide antes si toca la pantalla de acceso o la rejilla;
 * `ParentOnly` cubre el caso de un niño que llegue aquí con la URL. La guarda
 * de verdad sigue estando en el servidor, que responde 403 a un niño que llame
 * a `GET /rewards`: esto solo evita enseñar una interfaz que no va a
 * funcionar.
 */
function RewardsPage(): React.ReactElement {
  return (
    <AuthGate>
      <ParentOnly fallback={<NoEsParaTi />}>
        <RewardCatalog />
      </ParentOnly>
    </AuthGate>
  );
}

function NoEsParaTi(): React.ReactElement {
  return (
    <section>
      <p>{messages.rewards.forbidden}</p>
      <Link to="/">{messages.rewards.back}</Link>
    </section>
  );
}

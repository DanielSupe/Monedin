import { Link, createFileRoute } from "@tanstack/react-router";
import { requireActor } from "../app/guards.js";
import { useLeaveProfile, useLogout, useSession } from "../features/auth/use-session.js";
import { messages } from "../lib/messages.js";

/**
 * El inicio, consciente del rol.
 *
 * Hasta `add-app-shell` esta ruta era la aplicación entera del niño: seis
 * booleanos decidían qué pantalla enseñar, así que nunca salía de aquí y el
 * botón atrás lo sacaba de Monedín. Ahora cada destino tiene su dirección y
 * esto vuelve a ser lo que su nombre dice.
 */
export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => requireActor(context.queryClient),
  component: Home,
});

function Home(): React.ReactElement {
  const { session } = useSession();
  const actor = session?.actor;

  if (actor == null) {
    return <p>{messages.health.loading}</p>;
  }

  return (
    <section>
      <h2>Hola, {actor.name}</h2>
      {actor.familyRole === "CHILD" ? <ChildHome coins={actor.coins} /> : <ParentHome />}
      <LeaveProfile />
    </section>
  );
}

/**
 * El inicio del niño: su saldo y sus cuatro destinos.
 *
 * El saldo sigue aquí y no en la cabecera. Tenerlo siempre a la vista refuerza
 * el ciclo que el producto enseña, pero es una decisión de diseño de
 * `redesign-child-home` y este change no la toma.
 */
function ChildHome({ coins }: { coins: number }): React.ReactElement {
  return (
    <>
      <p>
        Tienes <strong>{coins}</strong> monedas.
      </p>

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
        <li>
          <Link to="/me/tasks">{messages.tasks.myTasks}</Link>
        </li>
        <li>
          <Link to="/me/rewards">{messages.rewards.myRewards}</Link>
        </li>
        <li>
          <Link to="/me/redemptions">{messages.redemptions.myRedemptions}</Link>
        </li>
        <li>
          <Link to="/me/settings">{messages.children.myProfileTitle}</Link>
        </li>
      </ul>
    </>
  );
}

/** El inicio del padre: sus cuatro áreas de gestión y su cuenta. */
function ParentHome(): React.ReactElement {
  const logout = useLogout();

  return (
    <>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
        <li>
          <Link to="/tasks" search={{ page: 1, status: "ALL" }}>
            {messages.tasks.title}
          </Link>
        </li>
        <li>
          <Link to="/rewards" search={{ page: 1, status: "ACTIVE" }}>
            {messages.rewards.title}
          </Link>
        </li>
        <li>
          <Link to="/redemptions" search={{ page: 1, status: "ALL" }}>
            {messages.redemptions.title}
          </Link>
        </li>
        <li>
          <Link to="/children" search={{ page: 1 }}>
            {messages.children.title}
          </Link>
        </li>
        <li>
          <Link to="/account">{messages.auth.myAvatarTitle}</Link>
        </li>
      </ul>

      <button
        type="button"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
        style={{ marginTop: "1rem" }}
      >
        {messages.auth.signOut}
      </button>
    </>
  );
}

/**
 * Volver a la rejilla.
 *
 * No navega: salir pone el actor a nulo, y la guarda de esta ruta reevaluada
 * manda sola a la rejilla. Lo mismo vale para cerrar sesión.
 */
function LeaveProfile(): React.ReactElement {
  const leave = useLeaveProfile();

  return (
    <button
      type="button"
      disabled={leave.isPending}
      onClick={() => leave.mutate()}
      style={{ marginTop: "1rem" }}
    >
      {messages.auth.changeProfile}
    </button>
  );
}

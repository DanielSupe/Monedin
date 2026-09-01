import { createFileRoute } from "@tanstack/react-router";
import { requireActor } from "../app/guards.js";
import { ParentHome } from "../features/auth/ParentHome.js";
import { LeaveProfile } from "../features/auth/LeaveProfile.js";
import { useSession } from "../features/auth/use-session.js";
import { ChildHome } from "../features/children/ChildHome.js";
import { messages } from "../lib/messages.js";

/**
 * El inicio, consciente del rol.
 *
 * Hasta `add-app-shell` esta ruta era la aplicación entera del niño: seis
 * booleanos decidían qué pantalla enseñar, así que nunca salía de aquí y el
 * botón atrás lo sacaba de Monedín.
 *
 * Y hasta `redesign-child-home` seguía teniendo las DOS pantallas de inicio
 * dentro. Elegir por rol es legítimo —el destino es el mismo y quien lo abre
 * no—, pero lo elegido vive fuera: un archivo de ruta monta el destino, no lo
 * dibuja. Es la misma regla que `add-app-shell` aplicó a quince componentes,
 * un nivel más arriba.
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

  /*
   * El saludo y la salida los pone cada pantalla, no esta ruta. El del niño va
   * dentro de su tarjeta de saldo y el del padre sigue como estaba hasta
   * `redesign-parent-home`.
   */
  if (actor.familyRole === "CHILD") {
    return <ChildHome name={actor.name} coins={actor.coins} />;
  }

  return (
    <section>
      <h2>Hola, {actor.name}</h2>
      <ParentHome />
      <LeaveProfile />
    </section>
  );
}

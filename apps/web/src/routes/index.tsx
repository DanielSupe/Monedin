import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuthGate, ChildOnly, ParentOnly } from "../features/auth/AuthGate.js";
import { ChangePinScreen } from "../features/auth/ChangePinScreen.js";
import { useLeaveProfile, useLogout, useSession } from "../features/auth/use-session.js";
import { messages } from "../lib/messages.js";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home(): React.ReactElement {
  return (
    <AuthGate>
      <SignedIn />
    </AuthGate>
  );
}

/**
 * Lo que se ve con un perfil activo, padre o hijo.
 *
 * Andamio: enseña quién está dentro y deja volver a la rejilla. Las pantallas
 * de producto llegan con sus módulos.
 */
function SignedIn(): React.ReactElement {
  const { session } = useSession();
  const [changingPin, setChangingPin] = useState(false);
  const logout = useLogout();
  const leave = useLeaveProfile();

  const actor = session?.actor;
  if (actor == null) return <p>{messages.health.loading}</p>;

  if (changingPin) {
    return <ChangePinScreen onDone={() => setChangingPin(false)} />;
  }

  return (
    <section>
      <h2>Hola, {actor.name}</h2>

      <ChildOnly>
        <p>
          Tienes <strong>{actor.familyRole === "CHILD" ? actor.coins : 0}</strong> monedas.
        </p>
      </ChildOnly>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button type="button" onClick={() => leave.mutate()}>
          {messages.auth.changeProfile}
        </button>

        <ParentOnly>
          <button type="button" onClick={() => setChangingPin(true)}>
            {messages.auth.changePinTitle}
          </button>
          <button type="button" onClick={() => logout.mutate()}>
            {messages.auth.signOut}
          </button>
        </ParentOnly>
      </div>
    </section>
  );
}

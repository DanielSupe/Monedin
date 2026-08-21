import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuthGate, ChildOnly, ParentOnly } from "../features/auth/AuthGate.js";
import { ChildProfilePicker } from "../features/auth/ChildProfilePicker.js";
import { useLeaveChildProfile, useLogout, useSession } from "../features/auth/use-session.js";
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
 * Lo que se ve con sesión iniciada.
 *
 * Andamio: enseña quién está dentro y deja pasar a un perfil de niño y volver.
 * Las pantallas de producto llegan con sus módulos.
 */
function SignedIn(): React.ReactElement {
  const { session } = useSession();
  const [picking, setPicking] = useState(false);
  const logout = useLogout();
  const leave = useLeaveChildProfile();

  const actor = session?.actor;
  if (actor == null) return <p>{messages.health.loading}</p>;

  if (picking) {
    return (
      <ChildProfilePicker
        onCancel={() => {
          setPicking(false);
        }}
        onEntered={() => {
          setPicking(false);
        }}
      />
    );
  }

  return (
    <section>
      <h2>Hola, {actor.name}</h2>

      <ChildOnly>
        <p>
          Tienes <strong>{actor.familyRole === "CHILD" ? actor.coins : 0}</strong> monedas.
        </p>
        <button
          type="button"
          onClick={() => {
            leave.mutate();
          }}
        >
          {messages.auth.leaveChild}
        </button>
      </ChildOnly>

      <ParentOnly>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button
            type="button"
            onClick={() => {
              setPicking(true);
            }}
          >
            {messages.auth.enterAsChild}
          </button>
          <button
            type="button"
            onClick={() => {
              logout.mutate();
            }}
          >
            {messages.auth.signOut}
          </button>
        </div>
      </ParentOnly>
    </section>
  );
}

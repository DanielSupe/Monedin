import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuthGate, ChildOnly, ParentOnly } from "../features/auth/AuthGate.js";
import { ChangePinScreen } from "../features/auth/ChangePinScreen.js";
import { ParentAvatarScreen } from "../features/auth/ParentAvatarScreen.js";
import { useLeaveProfile, useLogout, useSession } from "../features/auth/use-session.js";
import { ChildSettings } from "../features/children/ChildSettings.js";
import { MyRedemptions } from "../features/redemptions/MyRedemptions.js";
import { MyRewards } from "../features/rewards/MyRewards.js";
import { MyTasks } from "../features/tasks/MyTasks.js";
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
  const [miFoto, setMiFoto] = useState(false);
  const [misAjustes, setMisAjustes] = useState(false);
  const [misTareas, setMisTareas] = useState(false);
  const [misPremios, setMisPremios] = useState(false);
  const [misCanjes, setMisCanjes] = useState(false);
  const logout = useLogout();
  const leave = useLeaveProfile();

  const actor = session?.actor;
  if (actor == null) return <p>{messages.health.loading}</p>;

  if (changingPin) {
    return <ChangePinScreen onDone={() => setChangingPin(false)} />;
  }

  if (miFoto) {
    return <ParentAvatarScreen onDone={() => setMiFoto(false)} />;
  }

  if (misAjustes) {
    return <ChildSettings onDone={() => setMisAjustes(false)} />;
  }

  if (misTareas) {
    return <MyTasks onDone={() => setMisTareas(false)} />;
  }

  if (misPremios) {
    return <MyRewards onDone={() => setMisPremios(false)} />;
  }

  if (misCanjes) {
    return <MyRedemptions onDone={() => setMisCanjes(false)} />;
  }

  return (
    <section>
      <h2>Hola, {actor.name}</h2>

      <ChildOnly>
        <p>
          Tienes <strong>{actor.familyRole === "CHILD" ? actor.coins : 0}</strong> monedas.
        </p>
        <button type="button" onClick={() => setMisTareas(true)}>
          {messages.tasks.myTasks}
        </button>
        <button type="button" onClick={() => setMisPremios(true)}>
          {messages.rewards.myRewards}
        </button>
        <button type="button" onClick={() => setMisCanjes(true)}>
          {messages.redemptions.myRedemptions}
        </button>
        <button type="button" onClick={() => setMisAjustes(true)}>
          {messages.children.myProfileTitle}
        </button>
      </ChildOnly>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => leave.mutate()}>
          {messages.auth.changeProfile}
        </button>

        <ParentOnly>
          <Link to="/tasks">{messages.tasks.title}</Link>
          <Link to="/rewards">{messages.rewards.title}</Link>
          <Link to="/redemptions">{messages.redemptions.title}</Link>
          <Link to="/children">{messages.children.title}</Link>
          <button type="button" onClick={() => setMiFoto(true)}>
            {messages.auth.myAvatarTitle}
          </button>
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

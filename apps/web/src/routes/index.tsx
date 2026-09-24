import { createFileRoute } from "@tanstack/react-router";
import { requireActor } from "../app/guards.js";
import { useSession } from "../features/auth/use-session.js";
import { ChildHome } from "../features/children/ChildHome.js";
import { ParentConsole } from "../features/parents/ParentConsole.js";
import { messages } from "../lib/messages.js";

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

  if (actor.familyRole === "CHILD") {
    return <ChildHome name={actor.name} coins={actor.coins} />;
  }

  return <ParentConsole name={actor.name} />;
}

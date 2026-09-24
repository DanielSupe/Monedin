import type { QueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { ChildShell } from "../app/ChildShell.js";
import { EntryShell } from "../app/EntryShell.js";
import { ParentShell } from "../app/ParentShell.js";
import { useSession } from "../features/auth/use-session.js";
import { PendingBadge } from "../features/parents/PendingBadge.js";
import { messages } from "../lib/messages.js";
import { EmptyState, buttonClasses } from "../ui/index.js";

export interface RouterContext {
  queryClient: QueryClient;
}

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    fullBleed?: boolean;
    fullHeight?: boolean;
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: AppFrame,
  notFoundComponent: NotFound,
});

function AppFrame(): React.ReactElement {
  const { session } = useSession();
  const actor = session?.actor;
  const aSangre = useRouterState({
    select: (estado) => estado.matches.some((match) => match.staticData.fullBleed === true),
  });
  const altoCompleto = useRouterState({
    select: (estado) => estado.matches.some((match) => match.staticData.fullHeight === true),
  });

  if (actor?.familyRole === "CHILD") {
    return (
      <ChildShell
        avatar={actor.avatar}
        name={actor.name}
        tutorialSeen={actor.tutorialSeen}
        theme={actor.theme}
        fullHeight={altoCompleto}
      />
    );
  }

  if (actor?.familyRole === "PARENT") {
    return (
      <ParentShell
        tasksBadge={<PendingBadge kind="tasks" />}
        redemptionsBadge={<PendingBadge kind="redemptions" />}
        avatar={actor.avatar}
        name={actor.name}
        tutorialSeen={actor.tutorialSeen}
        theme={actor.theme}
        fullHeight={altoCompleto}
      />
    );
  }

  return aSangre ? <Outlet /> : <EntryShell />;
}

function NotFound(): React.ReactElement {
  return (
    <EmptyState
      glyph="🧭"
      title={messages.nav.notFoundTitle}
      description={messages.nav.notFoundBody}

      action={
        <Link to="/" className={buttonClasses("primary")}>
          {messages.nav.notFoundBack}
        </Link>
      }
    />
  );
}

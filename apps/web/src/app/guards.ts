import type { SessionState } from "@monedin/contracts";
import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import * as api from "../api/auth.js";
import { screenFor } from "../features/auth/use-session.js";

const WELCOME = "/welcome";
const PROFILES = "/profiles";
const HOME = "/";

const EDIT_HOME = { PARENT: "/account", CHILD: "/me/settings" } as const;

async function sessionOf(queryClient: QueryClient): Promise<SessionState> {
  return queryClient.ensureQueryData({
    queryKey: api.sessionQueryKey,
    queryFn: api.fetchSession,
    staleTime: 0,
  });
}

export async function requireAccount(queryClient: QueryClient): Promise<SessionState> {
  const session = await sessionOf(queryClient);

  if (screenFor(session) === "signIn") {
    throw redirect({ to: WELCOME });
  }

  return session;
}

export async function requireProfileChoice(
  queryClient: QueryClient,

  manage = false,
): Promise<SessionState> {
  const session = await sessionOf(queryClient);

  switch (screenFor(session)) {
    case "signIn":
      throw redirect({ to: WELCOME });
    case "app": {
      const role = session.actor?.familyRole;
      const editar = manage && role !== undefined ? EDIT_HOME[role] : undefined;

      throw redirect({ to: editar ?? HOME });
    }
    case "profiles":
      return session;
  }
}

export async function requireActor(queryClient: QueryClient): Promise<SessionState> {
  const session = await sessionOf(queryClient);

  switch (screenFor(session)) {
    case "signIn":
      throw redirect({ to: WELCOME });
    case "profiles":
      throw redirect({ to: PROFILES });
    case "app":
      return session;
  }
}

export async function requireParent(queryClient: QueryClient): Promise<SessionState> {
  const session = await requireActor(queryClient);

  if (session.actor?.familyRole !== "PARENT") {
    throw redirect({ to: HOME });
  }

  return session;
}

export async function requireChild(queryClient: QueryClient): Promise<SessionState> {
  const session = await requireActor(queryClient);

  if (session.actor?.familyRole !== "CHILD") {
    throw redirect({ to: HOME });
  }

  return session;
}

export async function requireSignedOut(queryClient: QueryClient): Promise<void> {
  const session = await sessionOf(queryClient);

  switch (screenFor(session)) {
    case "app":
      throw redirect({ to: HOME });
    case "profiles":
      throw redirect({ to: PROFILES });
    case "signIn":
      return;
  }
}

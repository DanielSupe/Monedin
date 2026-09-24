import {
  API_PREFIX,
  DEFAULT_AVATAR_KEY,
  type SelectableProfile,
  type SessionState,
} from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import { routeTree } from "../../src/routeTree.gen";

export const SIN_SESION: SessionState = { actor: null, hasAccount: false };
export const SOLO_CUENTA: SessionState = { actor: null, hasAccount: true };

export function comoPadre(name = "Lucía", tutorialSeen = true): SessionState {
  return {
    hasAccount: true,
    actor: {
      familyRole: "PARENT",
      id: "padre-1",
      name,
      email: "familia@ejemplo.dev",

      avatar: DEFAULT_AVATAR_KEY,
      tutorialSeen,

      theme: "SYSTEM",
    },
  };
}

export function comoNino(name = "Mateo", tutorialSeen = true): SessionState {
  return {
    hasAccount: true,
    actor: {
      familyRole: "CHILD",
      id: "hijo-1",
      name,
      avatar: "zorro",
      coins: 120,
      tutorialSeen,
      theme: "SYSTEM",
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export type Respuestas = Record<string, unknown>;

export function pagina(items: unknown[]): unknown {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

export function servirSesion(
  session: SessionState,
  profiles: SelectableProfile[] = [],
  extra: Respuestas = {},
): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.startsWith(`${API_PREFIX}/auth/session`)) {
        return Promise.resolve(jsonResponse(session));
      }
      if (url.startsWith(`${API_PREFIX}/auth/profiles`)) {
        return Promise.resolve(jsonResponse({ profiles }));
      }

      for (const [ruta, cuerpo] of Object.entries(extra)) {
        if (url.startsWith(`${API_PREFIX}${ruta}`)) {
          return Promise.resolve(jsonResponse(cuerpo));
        }
      }

      return Promise.resolve(
        jsonResponse({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 }),
      );
    }),
  );
}

export interface AppMontada {
  router: ReturnType<typeof crearRouter>;

  direccion: () => string;
}

function crearRouter(inicial: string, queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [inicial] }),
  });
}

export async function montarApp(
  inicial: string,
  session: SessionState,
  profiles: SelectableProfile[] = [],
  extra: Respuestas = {},
): Promise<AppMontada> {
  servirSesion(session, profiles, extra);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const router = crearRouter(inicial, queryClient);
  await router.load();

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return {
    router,
    direccion: () => router.state.location.pathname,
  };
}

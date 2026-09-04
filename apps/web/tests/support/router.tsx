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

/**
 * Montar la aplicación en una dirección concreta, con la sesión que se diga.
 *
 * Es lo que permite probar las guardas: lo que hay que comprobar es a DÓNDE
 * acaba yendo alguien, y eso solo se ve con un router de verdad. Un doble del
 * router diría que sí a todo, igual que un doble del almacén en la API.
 */

/** Las tres formas de sesión que distingue `screenFor()`. */
export const SIN_SESION: SessionState = { actor: null, hasAccount: false };
export const SOLO_CUENTA: SessionState = { actor: null, hasAccount: true };

/**
 * Un padre dentro de su perfil.
 *
 * `tutorialSeen` va en CIERTO por defecto, y no es un detalle: con falso, cada
 * test que monta el inicio se encontraría el recorrido de bienvenida encima de
 * lo que iba a comprobar. El caso común de un test es alguien establecido; los
 * del recorrido piden el contrario a propósito.
 */
export function comoPadre(name = "Lucía", tutorialSeen = true): SessionState {
  return {
    hasAccount: true,
    actor: {
      familyRole: "PARENT",
      id: "padre-1",
      name,
      email: "familia@ejemplo.dev",
      // Nunca nulo: la API lo resuelve al del catálogo por defecto.
      avatar: DEFAULT_AVATAR_KEY,
      tutorialSeen,
    },
  };
}

/** Un niño dentro de su perfil. `tutorialSeen` en cierto por lo mismo. */
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
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Responde la sesión y deja cualquier otra petición en una lista vacía.
 *
 * Las pantallas piden sus datos al montarse y aquí no se están probando: lo que
 * importa es la navegación. Una lista vacía las deja pintar su estado vacío en
 * vez de reventar.
 */
export function servirSesion(session: SessionState, profiles: SelectableProfile[] = []): void {
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

      return Promise.resolve(
        jsonResponse({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 }),
      );
    }),
  );
}

export interface AppMontada {
  router: ReturnType<typeof crearRouter>;
  /** La dirección en la que se ha quedado, ya resueltas las redirecciones. */
  direccion: () => string;
}

function crearRouter(inicial: string, queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [inicial] }),
  });
}

/**
 * Monta la aplicación en `inicial` y espera a que el router termine, incluidas
 * las redirecciones que decidan las guardas.
 */
export async function montarApp(
  inicial: string,
  session: SessionState,
  profiles: SelectableProfile[] = [],
): Promise<AppMontada> {
  servirSesion(session, profiles);

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

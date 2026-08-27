import type { SessionState } from "@monedin/contracts";
import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import * as api from "../api/auth.js";
import { screenFor } from "../features/auth/use-session.js";

/**
 * Guardas de ruta.
 *
 * NO son la guarda de verdad. La de verdad está en el servidor, que responde
 * 401 o 403 a quien no debe pase lo que pase aquí. Esto solo evita enseñar una
 * interfaz que no va a funcionar, y evita dejar a alguien parado en una
 * dirección que no es suya.
 *
 * Corren en `beforeLoad`, antes de pintar nada, y por eso redirigen en vez de
 * elegir qué componente mostrar. Un efecto que navegara después de pintar daría
 * un parpadeo de la pantalla equivocada. Ver decisión 1 del design.
 */

/**
 * Dónde vive cada uno de los tres estados que distingue `screenFor()`.
 *
 * Sin sesión se va a la PUERTA PÚBLICA, no al formulario de acceso. Es una sola
 * regla para todos los destinos, sin excepciones por ruta: quien llega sin
 * sesión puede no conocer el producto, y un formulario no se lo explica. Desde
 * la landing se llega a `/sign-in`, que sigue existiendo y siendo alcanzable.
 *
 * Se consideró que solo la raíz llevara a la landing y que los enlaces profundos
 * siguieran yendo al formulario. Se descartó: una regla con una excepción hay
 * que recordarla, y el coste de la excepción —que quien perdió la sesión vea una
 * página que ya conoce— se paga con un toque, porque «Entrar» es acción de
 * primer nivel ahí. Ver decisión 1 del design de `add-landing-page`.
 */
const WELCOME = "/welcome";
const PROFILES = "/profiles";
const HOME = "/";

/**
 * Dónde edita cada rol lo suyo.
 *
 * Las dos pantallas ya existían: `/account` es la foto y el PIN del padre, y
 * `/me/settings` el avatar y el PIN de un hijo. Este mapa es lo único que hacía
 * falta para que administrar un perfil desde la rejilla aterrice dentro de él.
 */
const EDIT_HOME = { PARENT: "/account", CHILD: "/me/settings" } as const;

/**
 * La sesión, esperándola si aún no está.
 *
 * `ensureQueryData` reutiliza la caché: solo la primera navegación de la sesión
 * espera de verdad. Usa la MISMA clave y el mismo `staleTime` que `useSession`;
 * si divergieran, una guarda podría decidir con una sesión vieja.
 */
async function sessionOf(queryClient: QueryClient): Promise<SessionState> {
  return queryClient.ensureQueryData({
    queryKey: api.sessionQueryKey,
    queryFn: api.fetchSession,
    staleTime: 0,
  });
}

/**
 * Exige una cuenta acreditada, sin exigir perfil.
 *
 * Es el nivel de la rejilla: la cookie de cuenta certifica que el dispositivo
 * pertenece a una familia, y todavía no hay actor. Mismo criterio que las cinco
 * rutas de solo cuenta de la API.
 */
export async function requireAccount(queryClient: QueryClient): Promise<SessionState> {
  const session = await sessionOf(queryClient);

  if (screenFor(session) === "signIn") {
    throw redirect({ to: WELCOME });
  }

  return session;
}

/**
 * Las pantallas de elegir perfil: cuenta acreditada y **sin** actor todavía.
 *
 * El «sin actor» importa. Entrar a un perfil es lo que crea el actor, así que
 * quedarse en la rejilla después de entrar dejaría a la familia mirando una
 * pregunta que ya respondió. Volver a la rejilla se hace saliendo del perfil,
 * que es lo que vuelve a poner el actor a nulo.
 */
export async function requireProfileChoice(
  queryClient: QueryClient,
  /**
   * Se venía a ADMINISTRAR un perfil, no solo a entrar en él.
   *
   * Quien navega después de acertar el PIN es esta guarda y no el componente:
   * `useEnterProfile` invalida la sesión y el router, la raíz cambia de marco y
   * desmonta a quien llamó a `mutate`. Por eso la intención tiene que llegar
   * hasta aquí en la dirección. Ver la decisión 2 del design.
   */
  manage = false,
): Promise<SessionState> {
  const session = await sessionOf(queryClient);

  switch (screenFor(session)) {
    case "signIn":
      throw redirect({ to: WELCOME });
    case "app": {
      // El rol sale de la SESIÓN, nunca de lo que pida el cliente: si el
      // destino lo eligiera la dirección, se podría pedir aterrizar en la
      // pantalla del otro rol. Sin actor no hay caso «app», pero el tipo lo
      // admite, y sin destino se cae al inicio de siempre.
      const role = session.actor?.familyRole;
      const editar = manage && role !== undefined ? EDIT_HOME[role] : undefined;

      throw redirect({ to: editar ?? HOME });
    }
    case "profiles":
      return session;
  }
}

/** Exige un perfil activo, sea de padre o de hijo. */
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

/**
 * Exige que quien opera sea un padre.
 *
 * Un niño acaba en su propio inicio, SIN mensaje de error: a los siete años,
 * «no tienes permiso» se lee como «hiciste algo mal», y lo más probable es que
 * haya tocado un enlace viejo. Ver decisión 3 del design.
 */
export async function requireParent(queryClient: QueryClient): Promise<SessionState> {
  const session = await requireActor(queryClient);

  if (session.actor?.familyRole !== "PARENT") {
    throw redirect({ to: HOME });
  }

  return session;
}

/** Exige que quien opera sea un niño. Un padre acaba también en su inicio. */
export async function requireChild(queryClient: QueryClient): Promise<SessionState> {
  const session = await requireActor(queryClient);

  if (session.actor?.familyRole !== "CHILD") {
    throw redirect({ to: HOME });
  }

  return session;
}

/**
 * Lo contrario de las anteriores: la pantalla de acceso no se le enseña a quien
 * ya tiene cuenta.
 *
 * Cada estado va a donde le toca, y por eso no basta con «si hay actor, fuera»:
 * quien tiene la cuenta acreditada pero no ha elegido perfil pertenece a la
 * rejilla, no al formulario de acceso.
 */
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

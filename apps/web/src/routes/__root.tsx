import type { QueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { ChildShell } from "../app/ChildShell.js";
import { ParentShell } from "../app/ParentShell.js";
import { useSession } from "../features/auth/use-session.js";
import { messages } from "../lib/messages.js";
import { EmptyState, buttonClasses } from "../ui/index.js";

/**
 * Lo que toda ruta recibe en su contexto.
 *
 * El cliente de consultas está aquí para que las guardas puedan resolver la
 * sesión en `beforeLoad`, antes de pintar nada. Ver decisión 1 del design de
 * `add-app-shell`.
 */
export interface RouterContext {
  queryClient: QueryClient;
}

/**
 * Lo que una ruta puede declarar sobre cómo quiere que la enmarquen.
 *
 * `fullBleed` lo pide la puerta pública: es lo único que se rinde a todo lo
 * ancho. Las pantallas previas a tener un rol —acceso y rejilla— quieren el
 * ancho de lectura, que es lo de por defecto.
 *
 * Se declara en la ruta y no con un `if` sobre la dirección en este archivo:
 * una dirección escrita a mano aquí se desincroniza el día que alguien renombre
 * la ruta, y el typecheck no lo vería.
 */
declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    fullBleed?: boolean;
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: AppFrame,
  notFoundComponent: NotFound,
});

/**
 * Elige el marco según quién está operando.
 *
 * Vive en la RAÍZ a propósito: es lo único que no se desmonta al navegar, y la
 * spec exige que el marco sobreviva. Si colgara de cada destino, la barra del
 * niño se reconstruiría en cada toque.
 *
 * Las pantallas previas a tener un rol —el acceso y la rejilla— no llevan
 * marco: todavía no se sabe de quién sería.
 */
function AppFrame(): React.ReactElement {
  const { session } = useSession();
  const actor = session?.actor;
  const aSangre = useRouterState({
    select: (estado) => estado.matches.some((match) => match.staticData.fullBleed === true),
  });

  if (actor?.familyRole === "CHILD") {
    return <ChildShell avatar={actor.avatar} />;
  }

  if (actor?.familyRole === "PARENT") {
    return <ParentShell avatar={actor.avatar} />;
  }

  return aSangre ? (
    <Outlet />
  ) : (
    <main className="mx-auto max-w-(--container-reading) px-4 py-8">
      <Outlet />
    </main>
  );
}

/**
 * Una dirección que no corresponde a ningún destino.
 *
 * Siempre con salida: dejar a alguien en un callejón sin puerta es peor que el
 * propio error, y en una tablet no hay barra de direcciones a mano para
 * corregirlo.
 */
function NotFound(): React.ReactElement {
  return (
    <EmptyState
      glyph="🧭"
      title={messages.nav.notFoundTitle}
      description={messages.nav.notFoundBody}
      /*
        Un ENLACE vestido de botón. Navegar es trabajo de un enlace: se abre en
        otra pestaña y se anuncia como lo que es. Antes era un `Link` envolviendo
        un `Button`, que anida dos elementos interactivos.
      */
      action={
        <Link to="/" className={buttonClasses("primary")}>
          {messages.nav.notFoundBack}
        </Link>
      }
    />
  );
}

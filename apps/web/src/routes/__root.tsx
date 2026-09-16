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
 * `fullHeight` lo pide el chat, y por una razón distinta: es la única pantalla
 * que DESPLAZA POR DENTRO. Su hilo crece y su campo de escribir se queda abajo,
 * como en cualquier mensajería; para eso su alto tiene que estar acotado por la
 * ventana en vez de crecer con el contenido, que es lo que hace el resto del
 * producto. Con el documento desplazando, el campo se iría hacia abajo con los
 * mensajes y habría que perseguirlo.
 *
 * Se declara en la ruta y no con un `if` sobre la dirección en este archivo:
 * una dirección escrita a mano aquí se desincroniza el día que alguien renombre
 * la ruta, y el typecheck no lo vería.
 */
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

/**
 * Elige el marco según quién está operando.
 *
 * Vive en la RAÍZ a propósito: es lo único que no se desmonta al navegar, y la
 * spec exige que el marco sobreviva. Si colgara de cada destino, la barra del
 * niño se reconstruiría en cada toque.
 *
 * Las pantallas previas a tener un rol llevan el suyo, `EntryShell`: no se
 * sabe de quién sería el marco, pero sí que hay que decir dónde está uno. Antes
 * caían en un contenedor de lectura sin marca.
 */
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

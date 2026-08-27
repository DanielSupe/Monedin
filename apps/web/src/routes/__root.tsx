import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useNavigate } from "@tanstack/react-router";
import { ChildShell } from "../app/ChildShell.js";
import { ParentShell } from "../app/ParentShell.js";
import { useSession } from "../features/auth/use-session.js";
import { messages } from "../lib/messages.js";
import { Button, EmptyState } from "../ui/index.js";

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

  if (actor?.familyRole === "CHILD") {
    return <ChildShell avatar={actor.avatar} />;
  }

  if (actor?.familyRole === "PARENT") {
    return <ParentShell avatar={actor.avatar} />;
  }

  return (
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
  const navigate = useNavigate();

  return (
    <EmptyState
      glyph="🧭"
      title={messages.nav.notFoundTitle}
      description={messages.nav.notFoundBody}
      /*
        Un botón que navega, y NO un `Link` envolviendo un `Button`: eso anida
        dos elementos interactivos, y un lector de pantalla anuncia un enlace
        que contiene un botón. Lo cazó el repaso manual.
      */
      action={
        <Button variant="primary" onClick={() => void navigate({ to: "/" })}>
          {messages.nav.notFoundBack}
        </Button>
      }
    />
  );
}

import { Link, Outlet } from "@tanstack/react-router";
import { messages } from "../lib/messages.js";
import { Avatar, Logo } from "../ui/index.js";

/**
 * El marco del padre: cabecera con navegación y avatar.
 *
 * Declara `data-scale="parent"`, que reasigna la misma escala a densidad alta y
 * escaneo rápido. Es la otra mitad de la doble escala: las piezas son las
 * mismas, el contenedor es lo único que cambia.
 *
 * Los destinos llevan sus parámetros de búsqueda por defecto, para que pulsar
 * «Tareas» desde cualquier sitio abra siempre el listado sin filtro y en la
 * primera página, y no en el estado en que quedó la última vez.
 */
export function ParentShell({ avatar }: { avatar: string | null }): React.ReactElement {
  return (
    <div data-scale="parent" className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface-raised px-4 py-2">
        <Link to="/" className="no-underline">
          <Logo size="medium" />
        </Link>

        <nav
          aria-label={messages.nav.parentNavLabel}
          className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1"
        >
          <Link
            to="/tasks"
            search={{ page: 1, status: "ALL" }}
            className="text-small font-semibold text-ink-muted no-underline data-[status=active]:text-primary"
          >
            {messages.nav.parentTasks}
          </Link>
          <Link
            to="/rewards"
            search={{ page: 1, status: "ACTIVE" }}
            className="text-small font-semibold text-ink-muted no-underline data-[status=active]:text-primary"
          >
            {messages.nav.parentRewards}
          </Link>
          <Link
            to="/redemptions"
            search={{ page: 1, status: "ALL" }}
            className="text-small font-semibold text-ink-muted no-underline data-[status=active]:text-primary"
          >
            {messages.nav.parentRedemptions}
          </Link>
          <Link
            to="/children"
            search={{ page: 1 }}
            className="text-small font-semibold text-ink-muted no-underline data-[status=active]:text-primary"
          >
            {messages.nav.parentChildren}
          </Link>
        </nav>

        <Link to="/account" aria-label={messages.nav.parentAccount}>
          <Avatar value={avatar} size="small" />
        </Link>
      </header>

      {/*
        `min-w-0` y `overflow-x-auto` porque las pantallas sin vestir desbordan:
        sus listas usan grid, y un hijo ancho —el selector de archivo nativo—
        estira la columna por el `min-width: auto` de CSS. La causa vive en esas
        pantallas y la arregla su change de rediseño; lo que NO puede pasar
        mientras tanto es que el documento entero se mueva de lado, y eso sí es
        cosa del marco.
      */}
      <main className="min-w-0 flex-1 overflow-x-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}

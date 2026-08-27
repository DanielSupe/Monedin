import { Link, Outlet } from "@tanstack/react-router";
import { messages } from "../lib/messages.js";
import { Avatar, Logo } from "../ui/index.js";

/**
 * El marco del niño: barra inferior de cuatro destinos.
 *
 * Declara `data-scale="child"`, que es lo que hace que las mismas piezas rindan
 * con cifras grandes y objetivos de toque de 44px sin duplicar ninguna. Ese
 * atributo lleva esperando desde `add-design-system`, que dejó la escala lista
 * y sin nada que la enchufara.
 *
 * La barra abajo y no arriba porque el pulgar está abajo. El saldo NO vive aquí
 * todavía: tenerlo siempre a la vista refuerza el ciclo que el producto enseña,
 * pero eso lo decide `redesign-child-home`.
 */
const DESTINOS = [
  { to: "/", texto: messages.nav.childHome },
  { to: "/me/tasks", texto: messages.nav.childTasks },
  { to: "/me/rewards", texto: messages.nav.childRewards },
  { to: "/me/redemptions", texto: messages.nav.childRedemptions },
] as const;

export function ChildShell({ avatar }: { avatar: string | null }): React.ReactElement {
  return (
    <div data-scale="child" className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
        <Logo size="medium" />
        {/* Los ajustes cuelgan del avatar y no ocupan un destino de la barra:
            cuatro cosas ya son bastantes para un niño de seis años. */}
        <Link to="/me/settings" aria-label={messages.children.myProfileTitle}>
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

      <nav
        aria-label={messages.nav.childNavLabel}
        className="sticky bottom-0 flex border-t border-border bg-surface-raised"
      >
        {DESTINOS.map((destino) => (
          <Link
            key={destino.to}
            to={destino.to}
            activeOptions={{ exact: destino.to === "/" }}
            className="tap-target text-small flex flex-1 items-center justify-center py-2 font-semibold text-ink-muted no-underline data-[status=active]:text-primary"
          >
            {destino.texto}
          </Link>
        ))}
      </nav>
    </div>
  );
}

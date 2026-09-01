import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";
import { messages } from "../lib/messages.js";
import { Avatar } from "../ui/index.js";
import { cx } from "../ui/cx.js";

/**
 * El botón que abre el cajón.
 *
 * Reenvía props y ref porque va dentro del `Trigger` de Radix con `asChild`: es
 * Radix quien le cuelga el `onClick`, el `aria-expanded` y el ref con el que
 * luego le devuelve el foco.
 *
 * Lleva `aria-label` y no solo tres rayas: un botón que dibuja un símbolo y nada
 * más no dice qué hace. Es la misma regla que ya obliga a `Button` a exigir
 * nombre cuando es `iconOnly`.
 */
export const MenuButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function MenuButton(props, ref) {
    return (
      <button
        {...props}
        ref={ref}
        type="button"
        aria-label={messages.nav.menu}
        className="tap-target rounded-control flex items-center justify-center border border-border bg-surface-raised px-2 text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-6" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    );
  },
);

/**
 * El aspecto de un destino del lateral, para un ENLACE.
 *
 * Tercera vez que el proyecto usa este patrón, después de `buttonClasses` y
 * `tabLinkClasses`, y por la misma razón: el destino es una dirección, así que
 * el control es un enlace y el aspecto tiene que vivir en un solo sitio.
 *
 * NO recibe si está activo, y esa es la corrección importante de este archivo.
 * El `Link` del router ya sabe cuál lo está: pone `data-status="active"` y
 * `aria-current="page"` él solo, según su `activeOptions`. Calcularlo aparte
 * daba DOS fuentes para el mismo hecho, y la del componente podía separarse de
 * la del router sin que nada fallara. Se marca con el atributo que el propio
 * enlace pone, igual que hacían las dos barras que este cajón sustituye.
 *
 * El color no es lo que anuncia el destino vigente: eso lo hace el
 * `aria-current` del enlace. Un destino que solo se distingue por el color no
 * existe para quien no distingue esos colores.
 */
export function sidebarItemClasses(): string {
  return cx(
    "tap-target rounded-control text-body flex w-full items-center justify-between gap-3 px-3 font-semibold text-ink no-underline transition-colors duration-quick",
    "hover:bg-surface-sunken",
    "data-[status=active]:bg-primary-soft data-[status=active]:text-primary",
  );
}

/**
 * El contenido del cajón de navegación.
 *
 * La lista arriba y el perfil ABAJO: el perfil no es un sitio de la aplicación
 * al mismo nivel que las tareas o los premios, y ponerlo entre ellos lo hace
 * competir con lo que se usa a diario. Hasta `add-sidebar-nav` colgaba del
 * avatar de la cabecera, donde solo lo encontraba quien ya sabía que estaba ahí.
 *
 * Los enlaces los pone cada marco, no este archivo: son los que cambian por rol,
 * y sus parámetros de búsqueda están tipados por destino.
 */
export function Sidebar({
  children,
  profile,
}: {
  children: ReactNode;
  /** El pie: el enlace al perfil de quien está operando. */
  profile: ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav
        aria-label={messages.nav.drawerLabel}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3"
      >
        {children}
      </nav>

      <div className="border-t border-border p-3">{profile}</div>
    </div>
  );
}

/**
 * El pie del cajón: avatar y nombre, como enlace al perfil propio.
 *
 * Es un solo elemento interactivo, como las teselas de la rejilla: la foto y el
 * nombre son la misma cosa, y partirlos en dos daría dos paradas de tabulación
 * al mismo sitio.
 */
export function SidebarProfile({
  name,
  avatar,
  children,
}: {
  name: string;
  avatar: string | null;
  children?: ReactNode;
}): React.ReactElement {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar value={avatar} size="small" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body font-semibold">{name}</span>
        {children !== undefined && (
          <span className="text-small text-ink-muted">{children}</span>
        )}
      </span>
    </span>
  );
}

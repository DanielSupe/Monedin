import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";
import { messages } from "../lib/messages.js";
import { Avatar } from "../ui/index.js";
import { cx } from "../ui/cx.js";

/**
 * El botón que abre el cajón.
 *
 * Solo existe en la forma ESTRECHA: si la navegación está delante, un botón para
 * abrirla no tiene qué abrir.
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

/** La flecha del botón de contraer. Decorativa: el nombre lo pone su `aria-label`. */
function Chevron({ pointing }: { pointing: "left" | "right" }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-5" aria-hidden="true">
      <path
        d={pointing === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
 * Tampoco recibe si está contraído: eso lo dice el CONTENEDOR con
 * `data-collapsed`, y cada destino reacciona por CSS. Así el marco no tiene que
 * pasarle el mismo booleano a diez enlaces.
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
    // Contraído, el texto sale del flujo con `sr-only` y solo queda el icono.
    "group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-0",
  );
}

/**
 * El nombre de un destino.
 *
 * Al contraer se oculta A LA VISTA y NO se borra: estos iconos son decorativos a
 * propósito —lo que nombra al destino es su texto—, así que quitarlo dejaría los
 * cinco destinos sin nombre de golpe para quien usa un lector de pantalla.
 */
export function SidebarLabel({ children }: { children: ReactNode }): React.ReactElement {
  return <span className="group-data-[collapsed=true]:sr-only">{children}</span>;
}

/**
 * El contenido del lateral, en sus dos formas.
 *
 * La lista arriba y el perfil ABAJO: el perfil no es un sitio de la aplicación
 * al mismo nivel que las tareas o los premios, y ponerlo entre ellos lo hace
 * competir con lo que se usa a diario.
 *
 * `onToggleCollapse` solo llega en la forma ANCHA. En la estrecha el lateral es
 * un cajón que ocupa lo que necesita y se cierra al llegar, así que contraerlo
 * no significaría nada.
 *
 * Los enlaces los pone cada marco, no este archivo: son los que cambian por rol,
 * y sus parámetros de búsqueda están tipados por destino.
 */
export function Sidebar({
  children,
  profile,
  collapsed = false,
  onToggleCollapse,
}: {
  children: ReactNode;
  /** El pie: el enlace al perfil de quien está operando. */
  profile: ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}): React.ReactElement {
  return (
    /*
      `data-collapsed` y `group` van en el CONTENEDOR y no en el `<nav>`, que es
      donde estaban y por donde entró el defecto: el pie —el perfil y este
      botón— queda fuera del `<nav>`, así que su texto no se enteraba de que
      había que ocultarlo y desbordaba la columna contraída.
    */
    <div
      data-collapsed={collapsed ? "true" : "false"}
      className="group flex min-h-0 flex-1 flex-col"
    >
      <nav
        aria-label={messages.nav.drawerLabel}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3"
      >
        {children}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border p-3">
        {profile}

        {onToggleCollapse !== undefined && (
          /*
            SOLO la flecha, sin texto visible.
            
            Con texto, la etiqueta desbordaba la columna contraída: es el ancho
            de un icono, y «Expandir» no cabe. Ocultarlo con `sr-only` habría
            servido, pero un control cuya única razón de ser es una dirección no
            necesita palabra — la flecha ya dice a dónde va, y así el pie mide lo
            mismo en los dos modos.

            El nombre NO se pierde: va en `aria-label`, y cambia con el estado
            porque lo que el botón hace cambia. Es la misma regla que obliga a
            `Button` a exigir nombre cuando es `iconOnly`.
          */
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? messages.nav.expandSidebar : messages.nav.collapseSidebar}
            className="tap-target rounded-control flex items-center justify-center self-end border-transparent bg-transparent px-2 text-ink-muted group-data-[collapsed=true]:self-center hover:bg-surface-sunken"
          >
            <Chevron pointing={collapsed ? "right" : "left"} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * El pie del cajón: avatar y nombre, como enlace al perfil propio.
 *
 * Es un solo elemento interactivo, como las teselas de la rejilla: la foto y el
 * nombre son la misma cosa, y partirlos en dos daría dos paradas de tabulación
 * al mismo sitio.
 *
 * Convive a propósito con el avatar de la cabecera, que lleva al mismo sitio: es
 * la ÚNICA excepción declarada a «ningún destino dos veces». El avatar responde
 * además a quién está usando el dispositivo —pregunta real en una tablet que
 * comparte toda la familia—, y esta fila existe porque un destino que solo se
 * alcanza pulsando una foto sin texto no se encuentra.
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
      <span className="flex min-w-0 flex-1 flex-col group-data-[collapsed=true]:sr-only">
        <span className="truncate text-body font-semibold">{name}</span>
        {children !== undefined && (
          <span className="text-small text-ink-muted">{children}</span>
        )}
      </span>
    </span>
  );
}

import * as RadixTabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  /** Qué agrupa. Se anuncia a quien no ve la disposición. */
  label: string;
}

/** El aspecto de un disparador, compartido por la pestaña y por el enlace. */
const TAB_BASE =
  "tap-target text-body border-transparent bg-transparent px-3 font-semibold text-ink-muted transition-colors duration-quick";

// `border-b-primary` y no `border-primary`: la capa base da borde a todo
// `button`, así que teñir los cuatro lados dibuja una caja en vez del subrayado
// que distingue la pestaña activa.
const TAB_ACTIVO = "border-b-2 border-b-primary text-primary";

/**
 * El aspecto de una pestaña, para un ENLACE.
 *
 * Mismo caso que `buttonClasses`, y por la misma razón: cuando el destino es una
 * dirección, el control es un enlace, y el aspecto tiene que vivir en un solo
 * sitio para que las dos formas no se separen.
 *
 * Lo usan los filtros por estado del padre, que **no** son estas `Tabs`: el
 * filtro viaja en la dirección, así que cada opción es un enlace con
 * `aria-current`, no un botón que cambia un estado. Ver la decisión 3 del design
 * de `redesign-parent-inbox`.
 */
export function tabLinkClasses(active: boolean): string {
  return [
    TAB_BASE,
    "inline-flex items-center no-underline",
    active ? TAB_ACTIVO : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Pestañas, sobre Radix por el teclado.
 *
 * Flechas para moverse, Inicio y Fin para los extremos, y el panel asociado a su
 * pestaña. Escribir eso a mano sale mal justo en el caso que importa: alguien
 * que no usa el ratón.
 *
 * Es para varios PANELES de contenido que se alternan sin cambiar de dirección.
 * Su cabecera decía que la estrenarían los filtros por estado del padre; al ir a
 * usarla en `redesign-parent-inbox` no encajaba, y no por un detalle: `Tabs`
 * posee su contenido y cambia por callback, mientras que el filtro es una sola
 * lista que se vuelve a pedir con otro parámetro de la dirección. Para eso está
 * `tabLinkClasses`, aquí arriba.
 */
export function Tabs({ items, value, onValueChange, label }: TabsProps): React.ReactElement {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange}>
      <RadixTabs.List
        aria-label={label}
        className="flex gap-1 border-b border-border"
      >
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className={`${TAB_BASE} data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:text-primary`}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="pt-3">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

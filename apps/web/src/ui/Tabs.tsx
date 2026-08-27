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

/**
 * Pestañas, sobre Radix por el teclado.
 *
 * Flechas para moverse, Inicio y Fin para los extremos, y el panel asociado a su
 * pestaña. Escribir eso a mano sale mal justo en el caso que importa: alguien
 * que no usa el ratón.
 *
 * Las estrenarán los filtros por estado del padre —pendientes, completadas,
 * aprobadas—, que hoy son un desplegable.
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
            // `border-b-primary` y no `border-primary`: la capa base da borde a
            // todo `button`, así que teñir los cuatro lados dibuja una caja en
            // vez del subrayado que distingue la pestaña activa.
            className="tap-target text-body border-transparent bg-transparent px-3 font-semibold text-ink-muted transition-colors duration-quick data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:text-primary"
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

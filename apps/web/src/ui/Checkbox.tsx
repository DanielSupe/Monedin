import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { useId, type ReactNode } from "react";
import { cx } from "./cx.js";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Lo que se marca. Va DENTRO de la etiqueta, así que se pulsa entero. */
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Una casilla, con su etiqueta pegada.
 *
 * La estructura viene de shadcn/ui —Radix `Root` más `Indicator`— y de ahí sale
 * lo único que de verdad se quería: el cableado accesible. Un `role="checkbox"`
 * de verdad, la barra espaciadora, el foco, el estado indeterminado si algún día
 * hace falta, y `aria-checked` sin que nadie se acuerde de ponerlo.
 *
 * El ASPECTO es entero de aquí. Lo traído venía con `dark:` —que este proyecto
 * prohíbe, porque el tema cambia el valor de los tokens y no la clase—, con
 * `cn()` —que fusiona utilidades y el `cx` de aquí no—, y con un radio y una
 * sombra escritos a mano. Quedarse su CSS habría sido traer cuatro infracciones
 * a cambio de nada.
 *
 * La etiqueta envuelve al control, así que el área tocable es la fila entera y
 * no un cuadrado de 20px. En una tablet que usa un padre con el pulgar, eso es
 * la diferencia entre marcar a la primera o a la tercera.
 *
 * Y EL NOMBRE SE ATA A MANO, con `aria-labelledby`. Envolver el control en un
 * `<label>` basta con un `<input>` nativo y NO con esto: lo que Radix dibuja es
 * un `<button role="checkbox">`, y el nombre de un botón sale de su CONTENIDO
 * antes que de su etiqueta — contenido que aquí es un visto que ni siquiera
 * existe mientras la casilla está sin marcar. La pieza se escribió en
 * `add-design-pieces` sin montarla en ninguna pantalla, así que la casilla no
 * tenía nombre y nada lo decía. Lo cazó el primer test que la buscó por él.
 */
export function Checkbox({
  checked,
  onCheckedChange,
  children,
  disabled = false,
  className,
}: CheckboxProps): React.ReactElement {
  const nombre = useId();

  return (
    <label
      className={cx(
        "rounded-control tap-target flex cursor-pointer items-center gap-3 border-2 px-3 py-2 transition duration-quick",
        checked
          ? "border-primary bg-primary-soft"
          : "border-border bg-surface-raised hover:bg-surface-sunken",
        disabled && "cursor-not-allowed opacity-55",
        className,
      )}
    >
      <RadixCheckbox.Root
        checked={checked}
        onCheckedChange={(estado) => onCheckedChange(estado === true)}
        disabled={disabled}
        aria-labelledby={nombre}
        className={cx(
          "rounded-control flex size-6 shrink-0 items-center justify-center border-2 transition duration-quick",
          checked ? "border-primary bg-primary" : "border-border-strong bg-surface-raised",
        )}
      >
        <RadixCheckbox.Indicator className="text-ink-inverted">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>

      <span id={nombre} className="text-body min-w-0 font-semibold">
        {children}
      </span>
    </label>
  );
}

import type { ReactNode } from "react";
import { cx } from "./cx.js";

/**
 * De qué habla la tesela, con los mismos nombres que el resto del sistema.
 *
 * `waiting` es el neutro a propósito, y es la decisión que más limpia la
 * pantalla: esperar no es un estado con voz, es la AUSENCIA de acción. Cuando la
 * pelota está en el tejado del otro no hay nada que hacer, y el color no debe
 * fingir que sí.
 */
export type IconTileTone = "action" | "saving" | "coin" | "waiting";

const TONES: Record<IconTileTone, string> = {
  action: "bg-primary-soft text-primary-hover",
  saving: "bg-done-soft text-done",
  coin: "bg-coin-soft text-coin-ink",
  waiting: "bg-surface-sunken text-ink-muted",
};

export interface IconTileProps {
  tone?: IconTileTone;
  /** El icono. Decorativo: lo que nombra la fila es su texto. */
  children: ReactNode;
  className?: string;
}

/**
 * El cuadrado redondeado con un icono dentro.
 *
 * Sale en cada fila de tarea, en cada destino de la navegación, en cada aviso y
 * en cada fila de un historial. No es una pieza vistosa: es la que impide que
 * cada listado invente su propio cuadrado.
 *
 * NO declara su tamaño: lo hereda de la escala, con el objetivo de toque del
 * sistema. Un padre la ve a 40px sobre una lista densa y un niño a 44, y esa
 * diferencia ya está declarada una vez, en el contenedor.
 *
 * El icono va OCULTO a las tecnologías de asistencia porque lo que nombra la
 * fila es su texto. Un icono anunciado junto a su etiqueta dice la misma cosa
 * dos veces, y es la razón por la que los de la navegación ya son decorativos.
 */
export function IconTile({
  tone = "waiting",
  children,
  className,
}: IconTileProps): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "rounded-control tap-target flex shrink-0 items-center justify-center",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

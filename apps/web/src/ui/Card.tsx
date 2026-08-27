import type { HTMLAttributes } from "react";
import { cx } from "./cx.js";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Despega la tarjeta del fondo. Para lo que se mira, no para lo que se lista. */
  raised?: boolean;
}

/**
 * La superficie de contenido del sistema.
 *
 * Su radio sale de la escala, así que la misma tarjeta es sobria para un padre
 * y redondeada para un niño sin recibir una sola prop distinta.
 */
export function Card({ raised = false, className, ...rest }: CardProps): React.ReactElement {
  return (
    <div
      {...rest}
      className={cx(
        "rounded-card border border-border bg-surface-raised p-4",
        raised ? "shadow-raised" : "shadow-card",
        className,
      )}
    />
  );
}

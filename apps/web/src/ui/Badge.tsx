import type { HTMLAttributes } from "react";
import { cx } from "./cx.js";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-ink-muted",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

/**
 * Etiqueta de estado. La usarán los estados de una tarea y de un canje.
 *
 * El tono acompaña al texto, nunca lo sustituye: un estado que solo se
 * distingue por el color no existe para quien no distingue esos colores.
 */
export function Badge({ tone = "neutral", className, ...rest }: BadgeProps): React.ReactElement {
  return (
    <span
      {...rest}
      className={cx(
        "text-small inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
        TONES[tone],
        className,
      )}
    />
  );
}

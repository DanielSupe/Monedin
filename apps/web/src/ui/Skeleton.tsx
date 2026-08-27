import { messages } from "../lib/messages.js";
import { cx } from "./cx.js";

export interface SkeletonProps {
  /** Cuántas líneas fantasma pintar. */
  lines?: number;
  className?: string;
}

/**
 * El hueco de algo que todavía no llegó.
 *
 * Se anuncia una sola vez como «Cargando…» en lugar de dejar que un lector de
 * pantalla recite cuatro rectángulos vacíos.
 *
 * La animación es una transición de opacidad declarada con tokens, así que la
 * preferencia de movimiento reducido ya la anula desde `tokens.css` sin que esta
 * pieza tenga que comprobarlo.
 */
export function Skeleton({ lines = 3, className }: SkeletonProps): React.ReactElement {
  return (
    <div
      role="status"
      aria-label={messages.ui.loading}
      className={cx("flex flex-col gap-2", className)}
    >
      {Array.from({ length: lines }, (_, indice) => (
        <div
          key={indice}
          aria-hidden="true"
          className="rounded-control h-4 animate-pulse bg-surface-sunken"
        />
      ))}
    </div>
  );
}

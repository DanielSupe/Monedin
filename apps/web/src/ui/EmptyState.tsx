import type { ReactNode } from "react";
import { cx } from "./cx.js";

export interface EmptyStateProps {
  /** El glifo que acompaña. Decorativo: nunca lleva el significado. */
  glyph?: string;
  title: string;
  description?: string;
  /** Qué se puede hacer desde aquí. Una lista vacía casi siempre tiene salida. */
  action?: ReactNode;
  className?: string;
}

/**
 * Una lista sin elementos.
 *
 * Existe como pieza para que ninguna pantalla resuelva el vacío no pintando
 * nada. En Monedín el vacío es además frecuente y significa cosas distintas: un
 * niño sin tareas, un escaparate sin premios ofrecidos, una bandeja sin nada
 * que aprobar. Las tres merecen una frase, no un hueco.
 *
 * Las ilustraciones que sustituirán al glifo llegan en `polish-brand-and-a11y`.
 */
export function EmptyState({
  glyph,
  title,
  description,
  action,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className={cx("flex flex-col items-center gap-2 px-4 py-10 text-center", className)}>
      {glyph !== undefined && (
        <span aria-hidden="true" className="text-hero">
          {glyph}
        </span>
      )}
      <p className="text-title font-bold text-ink">{title}</p>
      {description !== undefined && <p className="text-body text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}

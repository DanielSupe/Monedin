import type { ReactNode } from "react";
import { cx } from "./cx.js";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONES: Record<AlertTone, string> = {
  info: "border-info bg-info-soft text-info",
  success: "border-success bg-success-soft text-success",
  warning: "border-warning bg-warning-soft text-warning",
  danger: "border-danger bg-danger-soft text-danger",
};

/**
 * Un aviso de error o advertencia interrumpe; uno de éxito o información no.
 * Esa es la diferencia entre las dos funciones, y por eso no se elige a mano:
 * se deduce del tono, que es lo que la pantalla ya sabe.
 */
const ROLES: Record<AlertTone, "alert" | "status"> = {
  info: "status",
  success: "status",
  warning: "alert",
  danger: "alert",
};

export interface AlertProps {
  tone?: AlertTone;
  /** Encabezado corto. Lo que pasó, en pocas palabras. */
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * El aviso del sistema, con cuatro tonos.
 *
 * Existe porque la API distingue sus errores con un código estable y la interfaz
 * los aplanaba todos en un párrafo rojo. Un 422 —te equivocaste— y un 409
 * —alguien se te adelantó— no son la misma noticia y no se cuentan igual.
 *
 * El CONFLICTO es `warning`, no `danger`: nadie hizo nada mal. El padre aprobó
 * dos veces, o el hermano llegó antes. Pintarlo de rojo le echa la culpa a quien
 * está mirando.
 */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: AlertProps): React.ReactElement {
  return (
    <div
      role={ROLES[tone]}
      className={cx("rounded-card text-body border-l-4 p-3", TONES[tone], className)}
    >
      {title !== undefined && <p className="font-bold">{title}</p>}
      <div className="text-ink">{children}</div>
    </div>
  );
}

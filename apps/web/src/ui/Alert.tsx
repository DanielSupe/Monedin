import type { ReactNode } from "react";
import { cx } from "./cx.js";

export type AlertTone = "info" | "done" | "conflict" | "danger";

const TONES: Record<AlertTone, string> = {
  info: "border-info bg-info-soft text-info",
  done: "border-done bg-done-soft text-done",
  conflict: "border-conflict bg-conflict-soft text-conflict",
  danger: "border-danger bg-danger-soft text-danger",
};

/**
 * Un aviso de error o advertencia interrumpe; uno de éxito o información no.
 * Esa es la diferencia entre las dos funciones, y por eso no se elige a mano:
 * se deduce del tono, que es lo que la pantalla ya sabe.
 */
const ROLES: Record<AlertTone, "alert" | "status"> = {
  info: "status",
  done: "status",
  conflict: "alert",
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
 * El CONFLICTO tiene tono propio y NO es `danger`: nadie hizo nada mal. El
 * padre aprobó dos veces, o el hermano llegó antes. Pintarlo de rojo le echa la
 * culpa a quien está mirando.
 *
 * `info` NO se renombró, y es la mitad que importa de la regla: nunca nombró
 * un color, nombró un papel, y sigue siendo exacto aunque ahora sea arena.
 *
 * Los tonos se nombran por su PAPEL y no por su color, que es lo que permitió
 * repintarlos enteros sin tocar un solo punto de uso: `success` describía un
 * verde que ya no existe, `done` describe una tarea aprobada y sigue valiendo.
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
      /*
        Un aviso trae su propio fondo claro, así que ES una superficie clara
        esté donde esté. Sin decirlo, dentro de una superficie de color su
        cuerpo hereda la tinta de esa superficie y sale claro sobre claro.
      */
      data-surface="default"
      className={cx("rounded-card text-body border-l-4 p-3", TONES[tone], className)}
    >
      {title !== undefined && <p className="font-bold">{title}</p>}
      <div className="text-ink">{children}</div>
    </div>
  );
}

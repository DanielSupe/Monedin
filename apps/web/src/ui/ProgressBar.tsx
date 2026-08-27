import { messages } from "../lib/messages.js";
import { cx } from "./cx.js";

export interface ProgressBarProps {
  value: number;
  max: number;
  /** Qué mide la barra. Se anuncia; si no viene, se usa un genérico. */
  label?: string;
  className?: string;
}

/**
 * Barra de progreso.
 *
 * La estrenará el «te faltan 30 monedas» del escaparate del niño, que es la
 * mitad del ciclo que el producto existe para enseñar: ver cuánto le falta para
 * su meta es lo que convierte un saldo en una decisión de ahorro.
 *
 * Recorta el valor a los extremos en vez de confiar en quien la usa: un premio
 * más barato que el saldo daría más del 100% y la barra se saldría de su caja.
 */
export function ProgressBar({ value, max, label, className }: ProgressBarProps): React.ReactElement {
  const tope = max > 0 ? max : 1;
  const acotado = Math.min(Math.max(value, 0), tope);
  const porcentaje = Math.round((acotado / tope) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={acotado}
      aria-valuemin={0}
      aria-valuemax={tope}
      aria-label={label ?? messages.ui.progressLabel}
      className={cx("h-2 w-full overflow-hidden rounded-full bg-surface-sunken", className)}
    >
      {/*
        ÚNICO estilo en línea del sistema, y la razón por la que
        `allowInlineStyles()` existe: el ancho depende del saldo de un niño y de
        lo que cuesta un premio, así que no hay token que pueda expresarlo. La
        excepción queda declarada en `apps/web/eslint.config.js` y nombra este
        archivo, que es distinto de que nadie se entere.
      */}
      <div
        className="h-full rounded-full bg-coin transition-size duration-slow"
        style={{ inlineSize: `${porcentaje}%` }}
      />
    </div>
  );
}

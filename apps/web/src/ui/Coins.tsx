import { messages } from "../lib/messages.js";
import { cx } from "./cx.js";

const format = new Intl.NumberFormat(messages.app.locale);

export interface CoinsProps {
  /**
   * La cantidad, SIEMPRE como número.
   *
   * Nunca un texto ya formateado: si cada pantalla formatea a su manera, el
   * mismo saldo se escribe de dos formas distintas en dos sitios de la app.
   */
  amount: number;
  /** `hero` es el saldo del niño, el elemento más grande de la aplicación. */
  size?: "normal" | "hero";
  className?: string;
}

/**
 * La moneda de Monedín con su cifra.
 *
 * Existe desde el primer día porque la moneda aparece en las cuatro áreas del
 * producto, y hoy cada pantalla escribe `🪙 {n}` a mano. El glifo es decorativo
 * y va oculto a los lectores; lo que se anuncia es «25 monedas», que es lo que
 * significa.
 *
 * Las cifras tabulares van AQUÍ y no en `body`: que todos los dígitos midan lo
 * mismo es correcto en una columna de saldos —`120` y `1.250` alinean— e
 * incorrecto en un texto corrido, donde deja huecos raros. Esta es la pieza que
 * dibuja cantidades, así que le toca a ella.
 *
 * Hoy no cambia nada de lo que se ve: Nunito ya trae cifras de ancho fijo, y el
 * respaldo de Windows también. Lo que hace la declaración es dejar de depender
 * de eso. SF Pro Rounded —el respaldo en Apple— tiene cifras proporcionales, y
 * una familia futura puede tenerlas igual.
 */
export function Coins({ amount, size = "normal", className }: CoinsProps): React.ReactElement {
  const unidad = Math.abs(amount) === 1 ? messages.ui.coinsUnitSingular : messages.ui.coinsUnit;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 font-extrabold text-coin-ink tabular-nums",
        size === "hero" ? "text-hero" : "text-body",
        className,
      )}
    >
      <span aria-hidden="true">🪙</span>
      <span aria-label={`${format.format(amount)} ${unidad}`}>{format.format(amount)}</span>
    </span>
  );
}

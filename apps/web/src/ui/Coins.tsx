import { messages } from "../lib/messages.js";
import { CoinMark } from "./coin-mark.js";
import { cx } from "./cx.js";

const format = new Intl.NumberFormat(messages.app.locale);

/** La cifra y su moneda crecen juntas: una moneda que no acompaña se despega. */
const TALLAS = {
  normal: { texto: "text-body", moneda: "size-4" },
  large: { texto: "text-title", moneda: "size-7" },
  hero: { texto: "text-hero", moneda: "size-12" },
} as const;

export interface CoinsProps {
  /**
   * La cantidad, SIEMPRE como número.
   *
   * Nunca un texto ya formateado: si cada pantalla formatea a su manera, el
   * mismo saldo se escribe de dos formas distintas en dos sitios de la app.
   */
  amount: number;
  /**
   * `normal` es el precio de una fila; `large`, el saldo en la cabecera del
   * inicio del niño; `hero`, media pantalla.
   *
   * `large` llegó en `match-child-home-header`, cuando el saldo pasó de
   * tarjeta centrada a píldora: entre una y otra no había nada. Se nombra por
   * su TAMAÑO y no por su caso de uso — nombrar una opción por su primer punto
   * de uso es cómo se acaba escribiendo `forAvatar: true` para algo que no es
   * un avatar.
   */
  size?: "normal" | "large" | "hero";
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
export function Coins({
  amount,
  size = "normal",
  className,
}: CoinsProps): React.ReactElement {
  const unidad =
    Math.abs(amount) === 1
      ? messages.ui.coinsUnitSingular
      : messages.ui.coinsUnit;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 font-extrabold text-coin-ink tabular-nums",
        TALLAS[size].texto,
        className,
      )}
    >
      {/*
        LA MONEDA LA DIBUJA EL PROYECTO, NO EL DISPOSITIVO.

        Era un emoji, y un emoji lo dibuja la fuente del sistema: en Windows sale
        con una columna grabada, en Apple es otra moneda y en Android otra. Es el
        mismo argumento que `Logo` lleva escrito desde el primer día y que
        `add-brand-typography` ya pagó con la tipografía — aquí pesa más, porque
        la moneda es el objeto que más se repite del producto.
      */}
      <CoinMark className={TALLAS[size].moneda} />
      <span aria-label={`${format.format(amount)} ${unidad}`}>
        {format.format(amount)}
      </span>
    </span>
  );
}

import { cx } from "./cx.js";

/**
 * La moneda de Monedín, dibujada.
 *
 * NO SE EXPORTA DESDE `index.ts`, y es a propósito: no es una pieza que una
 * pantalla coloque, es el símbolo que `Logo` y `Coins` comparten. Exportarla
 * invitaría a dibujar monedas sueltas por ahí, que es justo lo que `Coins`
 * existe para impedir.
 *
 * EXISTE PORQUE `Coins` USABA UN EMOJI. El argumento estaba escrito en `Logo`
 * desde el primer día —«un `<text>` en un SVG depende de la tipografía que haya
 * en el dispositivo, y la marca no puede cambiar de forma según el móvil de cada
 * familia»— y `Coins` lo incumplía con un 🪙: en Windows sale una moneda con una
 * columna grabada, en Apple otra distinta, en Android otra. Es el mismo problema
 * que `add-brand-typography` resolvió con la tipografía, en el objeto MÁS
 * repetido del producto: sale en cada saldo, cada precio y cada movimiento.
 *
 * El trazo va en `--color-on-coin`, que es la tinta que va ENCIMA del ámbar y no
 * cambia con el tema. Con `--color-coin-ink` —la tinta de las cifras, que sí
 * cambia— la M se aclararía en oscuro y desaparecería sobre su propia moneda.
 */
export function CoinMark({
  withRing = false,
  className,
}: {
  /** El aro interior. Lo lleva la marca grande, no la moneda de una cifra. */
  withRing?: boolean;
  className?: string;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cx("shrink-0", className)}
    >
      <circle cx="16" cy="16" r="15" className="fill-coin" />

      {withRing && (
        <circle cx="16" cy="16" r="11.5" className="fill-none stroke-on-coin" strokeWidth="1.5" />
      )}

      {/*
        La M de Monedín, dibujada como trazo y no como texto: un `<text>` en un
        SVG depende de la tipografía que haya en el dispositivo, y la marca no
        puede cambiar de forma según el móvil de cada familia.
      */}
      <path
        d="M11 21V11l5 6 5-6v10"
        className="fill-none stroke-on-coin"
        strokeWidth={withRing ? 2.5 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

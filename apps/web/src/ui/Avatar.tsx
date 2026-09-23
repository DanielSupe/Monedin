import { cx } from "./cx.js";
import { avatarDrawing, isAvatarUrl } from "./avatars.js";

export type AvatarSize = "small" | "medium" | "large" | "xlarge";

/**
 * La forma es una OPCIÓN de la pieza, no una clase que se pasa desde fuera.
 *
 * `cx` no fusiona utilidades de Tailwind —lo dice su propio comentario—, así
 * que un `rounded-2xl` en `className` junto al radio de la pieza lo resuelve el
 * orden del CSS generado y no el del código. Es un fallo que no se ve leyendo y
 * que no tiene por qué ser estable entre compilaciones. Ver la decisión 1 del
 * design de `polish-profile-tiles`.
 */
export type AvatarShape = "circle" | "rounded";

const SHAPES: Record<AvatarShape, string> = {
  circle: "rounded-pill",
  rounded: "rounded-card",
};

/**
 * Las medidas del sistema. Ninguna pantalla pide píxeles.
 *
 * `xlarge` la trajo `add-entry-frame` para la rejilla de perfiles, subió a 9 rem
 * en `polish-profile-tiles` y baja a 7 en `widen-profile-tiles`. La parte que no
 * cambia es POR DÓNDE se toca: si a una pantalla la talla le queda pequeña o
 * grande, se le añade o se le corrige a la pieza y NO se escribe una medida
 * suelta donde se usa. Es lo que dejó escrito el design de `redesign-profile-grid`.
 *
 * Lo que cambia es el número, y conviene saber por qué subió: se buscaba una cara
 * grande «para el dedo de un niño de seis años». Pero el objetivo de toque es la
 * TESELA entera, no el círculo, y a 9 rem la cara medía exactamente lo que su
 * tesela — llegaba al borde, lo pisaba por dentro y sacaba fuera la corona del
 * adulto. Agrandar el dibujo hasta el borde no compraba nada de lo que buscaba y
 * costaba el aire de la tarjeta.
 */
/*
 * Sin tamaño de texto: desde que el avatar es un dibujo y no un glifo, lo que
 * decide su tamaño es la caja, y el SVG la llena. Con emojis la medida tenía que
 * ir en `font-size`, que es lo que hacía que cada sistema lo pintara distinto.
 */
const SIZES: Record<AvatarSize, string> = {
  small: "size-8",
  medium: "size-12",
  large: "size-24",
  xlarge: "size-28",
};

export interface AvatarProps {
  value: string | null | undefined;
  size?: AvatarSize;
  /** Redonda por defecto: ninguna pantalla existente cambia sin pedirlo. */
  shape?: AvatarShape;
  alt?: string;
  className?: string;
}

/**
 * El avatar de un perfil, sea del catálogo o una foto propia.
 *
 * Un único sitio donde se decide entre las dos formas. Sin esto, cada pantalla
 * que pidiera un dibujo tendría que acordarse de mirar si el valor es una URL, y
 * la que se olvidara pintaría una nutria sobre la foto de alguien.
 *
 * Se mudó aquí desde `features/auth/` en `add-design-system`: lo usan cuatro
 * áreas y ninguna tiene que ver con la autenticación. Su lógica de dos formas
 * NO cambió; lo que cambió es de dónde salen su tamaño y su radio.
 */
export function Avatar({
  value,
  size = "medium",
  shape = "circle",
  alt = "",
  className,
}: AvatarProps): React.ReactElement {
  if (isAvatarUrl(value)) {
    return (
      <img
        src={value ?? ""}
        alt={alt}
        // Cuadrado y recortado al centro: el recorte del selector ya lo dejó
        // así, pero una foto vieja o de otra procedencia no descuadra la fila.
        className={cx("shrink-0 object-cover", SHAPES[shape], SIZES[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden={alt === "" ? true : undefined}
      aria-label={alt === "" ? undefined : alt}
      role={alt === "" ? undefined : "img"}
      className={cx(
        "inline-flex shrink-0 items-center justify-center bg-surface-sunken leading-none",
        SHAPES[shape],
        SIZES[size],
        className,
      )}
    >
      {avatarDrawing(value)}
    </span>
  );
}

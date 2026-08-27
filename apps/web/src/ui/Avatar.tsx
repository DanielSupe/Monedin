import { cx } from "./cx.js";
import { avatarGlyph, isAvatarUrl } from "./avatars.js";

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
  circle: "rounded-full",
  rounded: "rounded-card",
};

/**
 * Las medidas del sistema. Ninguna pantalla pide píxeles.
 *
 * `xlarge` la trajo `add-entry-frame` para la rejilla de perfiles y subió a
 * 9 rem en `polish-profile-tiles`. Es la rejilla, que se toca
 * con el dedo de un niño de seis años. Es la respuesta que el design de
 * `redesign-profile-grid` dejó escrita: si a `large` la tesela queda pequeña,
 * la talla se le añade a la pieza y NO se escribe una medida suelta en la
 * pantalla que la usa.
 */
const SIZES: Record<AvatarSize, string> = {
  small: "size-8 text-body",
  medium: "size-12 text-title",
  large: "size-24 text-hero",
  xlarge: "size-36 text-hero",
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
 * que llama a `avatarGlyph()` tendría que acordarse de mirar si el valor es una
 * URL, y la que se olvidara pintaría una nutria sobre la foto de alguien.
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
      {avatarGlyph(value)}
    </span>
  );
}

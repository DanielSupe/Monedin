import { cx } from "./cx.js";
import { avatarGlyph, isAvatarUrl } from "./avatars.js";

export type AvatarSize = "small" | "medium" | "large";

/** Las tres medidas del sistema. Ninguna pantalla pide píxeles. */
const SIZES: Record<AvatarSize, string> = {
  small: "size-8 text-body",
  medium: "size-12 text-title",
  large: "size-24 text-hero",
};

export interface AvatarProps {
  value: string | null | undefined;
  size?: AvatarSize;
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
        className={cx("shrink-0 rounded-full object-cover", SIZES[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden={alt === "" ? true : undefined}
      aria-label={alt === "" ? undefined : alt}
      role={alt === "" ? undefined : "img"}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-surface-sunken leading-none",
        SIZES[size],
        className,
      )}
    >
      {avatarGlyph(value)}
    </span>
  );
}

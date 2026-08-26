import { avatarGlyph, isAvatarUrl } from "./avatars.js";

/**
 * El avatar de un perfil, sea del catálogo o una foto propia.
 *
 * Un único sitio donde se decide entre las dos formas. Sin esto, cada pantalla
 * que hoy llama a `avatarGlyph()` tendría que acordarse de mirar si el valor es
 * una URL, y la que se olvidara pintaría una nutria sobre la foto de alguien.
 */
export function Avatar({
  value,
  size = 32,
  alt = "",
}: {
  value: string | null | undefined;
  size?: number;
  alt?: string;
}): React.ReactElement {
  if (isAvatarUrl(value)) {
    return (
      <img
        src={value ?? ""}
        alt={alt}
        width={size}
        height={size}
        // Cuadrado y recortado al centro: el recorte del selector ya lo dejó
        // así, pero una foto vieja o de otra procedencia no descuadra la fila.
        style={{ objectFit: "cover", borderRadius: "50%", display: "inline-block" }}
      />
    );
  }

  return (
    <span aria-hidden={alt === ""} style={{ fontSize: size * 0.9, lineHeight: 1 }}>
      {avatarGlyph(value)}
    </span>
  );
}

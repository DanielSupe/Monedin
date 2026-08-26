import type { ImageContentType } from "@monedin/contracts";

/**
 * De qué tipo de contenido sale qué extensión de archivo.
 *
 * Mapeo puro, sin negocio: lo usan los cuatro módulos al construir su clave,
 * para que un objeto guardado se pueda reconocer por su nombre sin abrirlo.
 *
 * La extensión es cosmética —quien manda es el `Content-Type` con el que se
 * firmó— pero importa cuando alguien mira el bucket a mano buscando por qué una
 * imagen no se ve.
 */
const EXTENSIONS: Record<ImageContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extensionForContentType(contentType: ImageContentType): string {
  return EXTENSIONS[contentType];
}

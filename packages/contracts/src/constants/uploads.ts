/**
 * Constantes de la subida de imagenes, compartidas por la API y el front.
 *
 * La API las usa para firmar solo lo que admite y para validar la entrada; el
 * front, para filtrar el selector de archivos y para saber a que tamano
 * comprimir antes de subir. Una sola lista para las dos cosas, por la misma
 * razon que el catalogo de avatares: dos listas se despegan.
 */

/**
 * Tipos de imagen que se admiten.
 *
 * JPEG y PNG porque es lo que produce cualquier camara o captura, y WEBP
 * porque es a lo que comprime el navegador. NO hay GIF ni SVG: el primero
 * invita a subir animaciones pesadas donde se espera una foto, y el segundo es
 * un documento ejecutable disfrazado de imagen.
 */
export const ALLOWED_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageContentType = (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

/**
 * Tope de longitud de una clave de almacen.
 *
 * No es un limite de negocio: es una cota para que una entrada absurda no
 * llegue a construir una peticion contra el almacen. Las claves reales que
 * genera el servidor rondan los 60 caracteres.
 */
export const MAX_UPLOAD_KEY_LENGTH = 512;

/**
 * A cuanto comprime el front antes de subir.
 *
 * No es una validacion del servidor —el navegador ya entrega algo por debajo—,
 * es el objetivo de la compresion. Un megabyte sobra para una foto que se ve en
 * un movil, y es lo que hace que subir desde una conexion mala no sea una
 * espera larga.
 */
export const MAX_IMAGE_SIZE_MB = 1;

/**
 * Lado maximo de un avatar ya recortado, en pixeles.
 *
 * Un avatar se pinta pequeno y en una rejilla, asi que guardar el original de
 * doce megapixeles de la camara no aporta nada a lo que se ve y lo paga cada
 * lectura.
 */
export const AVATAR_MAX_DIMENSION = 512;

/** Lado maximo de una foto de premio o de una evidencia, en pixeles. */
export const PHOTO_MAX_DIMENSION = 1280;

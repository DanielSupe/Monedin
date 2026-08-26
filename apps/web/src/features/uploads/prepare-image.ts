import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  AVATAR_MAX_DIMENSION,
  MAX_IMAGE_SIZE_MB,
  PHOTO_MAX_DIMENSION,
  type ImageContentType,
} from "@monedin/contracts";
import imageCompression from "browser-image-compression";

/**
 * Deja una foto lista para subir: del tamaño en que se va a ver, y no del que
 * salió de la cámara.
 *
 * Una foto de un móvil actual son varios megabytes que nadie va a mirar a esa
 * resolución: comprimir antes de subir ahorra la espera de quien sube, el
 * espacio de quien guarda y los datos de quien lo mira después.
 *
 * El recorte cuadrado NO se hace aquí: necesita que una persona decida el
 * encuadre, así que vive en el componente. Esta función recibe lo que salga de
 * ahí —recortado o no— y solo lo reduce.
 */

/** Si el archivo elegido es siquiera una imagen de las que se admiten. */
export function isAllowedImage(file: File): file is File & { type: ImageContentType } {
  return (ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(file.type);
}

export async function prepareImage(
  source: Blob,
  options: { forAvatar?: boolean } = {},
): Promise<Blob> {
  const maxWidthOrHeight = options.forAvatar === true ? AVATAR_MAX_DIMENSION : PHOTO_MAX_DIMENSION;

  // `useWebWorker` mantiene la interfaz respondiendo mientras comprime, que en
  // un móvil con una foto grande son varios segundos.
  return imageCompression(source as File, {
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight,
    useWebWorker: true,
  });
}

/**
 * Recorta un área de una imagen a un canvas y devuelve el resultado.
 *
 * Recibe el área en píxeles que da `react-easy-crop` y no porcentajes, porque
 * es lo que se puede dibujar directamente sin volver a calcular nada.
 */
export async function cropToBlob(
  imageSrc: string,
  area: { x: number; y: number; width: number; height: number },
  contentType: ImageContentType,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("No se pudo preparar el recorte.");
  }

  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          reject(new Error("No se pudo preparar el recorte."));
          return;
        }
        resolve(blob);
      },
      contentType,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("No se pudo leer la imagen.")));
    image.src = src;
  });
}

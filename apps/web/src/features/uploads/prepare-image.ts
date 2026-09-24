import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_SIZE_MB,
  type ImageContentType,
} from "@monedin/contracts";
import imageCompression from "browser-image-compression";

export function isAllowedImage(file: File): file is File & { type: ImageContentType } {
  return (ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(file.type);
}

export async function prepareImage(source: Blob, maxWidthOrHeight: number): Promise<Blob> {
  return imageCompression(source as File, {
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight,
    useWebWorker: true,
  });
}

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

import { messages } from "./messages.js";

/**
 * Sube un archivo directamente al almacén, contra una URL ya firmada.
 *
 * NO pasa por `apiFetch`, y no es una omisión: aquella función antepone
 * `API_PREFIX` a la ruta, fuerza `Content-Type: application/json` y valida la
 * respuesta con un esquema de Zod. Las tres cosas rompen esto —la dirección es
 * absoluta y de otro origen, el cuerpo es binario, y una subida correcta
 * responde sin cuerpo—.
 *
 * El `Content-Type` tiene que ser EXACTAMENTE el que se pidió al firmar: va
 * dentro de la firma, así que cualquier otro lo rechaza el almacén.
 */
export class UploadError extends Error {
  constructor(message: string = messages.uploads.failed) {
    super(message);
    this.name = "UploadError";
  }
}

export async function putToUploadUrl(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": contentType },
    });
  } catch {
    // Un fallo de red aquí no es un error de la API: no hay cuerpo de error
    // estándar que interpretar, así que no se traduce como tal.
    throw new UploadError(messages.uploads.network);
  }

  if (!response.ok) {
    throw new UploadError();
  }
}

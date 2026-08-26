import { z } from "zod";
import { ALLOWED_IMAGE_CONTENT_TYPES, MAX_UPLOAD_KEY_LENGTH } from "../constants/uploads.js";

/**
 * Contratos de la subida de imágenes, compartidos por la API y el front.
 *
 * El binario NUNCA pasa por la API: se pide una URL firmada, se sube directo al
 * almacén y después se confirma la clave contra el endpoint de dominio que
 * guarda la referencia. Estos esquemas cubren los dos extremos de ese
 * intercambio —lo que se pide y lo que se devuelve—, no el archivo en sí.
 *
 * Ver la decisión 1 del design de `add-file-storage`.
 */

/** El tipo de imagen que se va a subir. Lo que no esté aquí no se firma. */
export const imageContentTypeSchema = z.enum(ALLOWED_IMAGE_CONTENT_TYPES, {
  errorMap: () => ({ message: "Ese tipo de imagen no se admite." }),
});

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/**
 * Pedir una URL de subida. Solo el tipo de contenido.
 *
 * NO acepta la clave ni el tamaño: la clave la decide el servidor —es lo que
 * impide que alguien apunte a la carpeta de otro— y el tamaño real lo impone la
 * compresión del navegador y el propio almacén. Al ser `.strict()`, mandar
 * cualquiera de las dos cosas es 422.
 */
export const createUploadUrlSchema = z
  .object({
    contentType: imageContentTypeSchema,
  })
  .strict();

export type CreateUploadUrlInput = z.infer<typeof createUploadUrlSchema>;

/**
 * La clave con la que quedó guardado un objeto, tal como la devuelve quien
 * confirma una subida.
 *
 * Valida la FORMA, nunca la propiedad: que una clave pertenezca a quien dice
 * pertenecer lo comprueba el servicio del módulo dueño, comparándola con el
 * prefijo del actor, y no un esquema compartido que no sabe quién llama. Ver la
 * decisión 3 del design.
 */
export const uploadKeySchema = z
  .string()
  .min(1, "Falta la referencia de la imagen.")
  .max(MAX_UPLOAD_KEY_LENGTH, "Esa referencia de imagen no es válida.");

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

/**
 * Lo que hace falta para subir: dónde subir, con qué clave quedará guardado, y
 * hasta cuándo sirve esa URL.
 *
 * `key` viaja de vuelta al cliente para que la devuelva al confirmar. No es un
 * secreto —lleva dentro el identificador del recurso, que quien pide ya
 * conoce—, y que el cliente no pueda inventarla es lo que comprueba el
 * servidor, no lo que el cliente ignore.
 */
export const uploadUrlSchema = z.object({
  uploadUrl: z.string().url(),
  key: z.string(),
  expiresAt: z.string().datetime(),
});

export type UploadUrl = z.infer<typeof uploadUrlSchema>;

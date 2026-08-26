import { DEFAULT_AVATAR_KEY, type AvatarValue, isAvatarKey } from "@monedin/contracts";
import type { StorageProvider } from "../storage/index.js";

/**
 * Convierte lo que hay guardado en la columna en lo que sale por la respuesta.
 *
 * ÚNICO sitio del proyecto que sabe distinguir una clave del catálogo de una
 * clave del almacén. Lo usan `children`, `auth`, `tasks` y `rewards` al
 * serializar; sin esto, la misma rama de tres líneas se escribiría cuatro veces
 * y se despegaría a la primera reescritura. Ver la decisión 5 del design de
 * `add-file-storage`.
 *
 * Las tres ramas, y por qué:
 *
 *   - Una clave del catálogo sale tal cual: el front la pinta como ilustración.
 *   - Sin nada guardado sale la de por defecto, para que el front nunca tenga
 *     que tratar el caso vacío en cada pantalla.
 *   - Cualquier otra cosa es una clave del almacén, y se firma. El front NUNCA
 *     ve una clave cruda: o una clave corta que sabe pintar, o una dirección.
 */
export async function resolveAvatarForResponse(
  storage: StorageProvider,
  value: string | null,
): Promise<AvatarValue> {
  if (isAvatarKey(value)) return value;
  if (value === null || value === "") return DEFAULT_AVATAR_KEY;

  return storage.createReadUrl(value);
}

/**
 * Lo mismo para una imagen que no tiene catálogo detrás —la foto de un premio,
 * la evidencia de una tarea—: o no hay nada, o hay una clave que firmar.
 *
 * Se separa de la de arriba en vez de darle un parámetro porque el tipo de
 * salida es distinto: aquí `null` es una respuesta legítima y frecuente, y allí
 * no puede serlo.
 */
export async function resolveImageForResponse(
  storage: StorageProvider,
  value: string | null,
): Promise<string | null> {
  if (value === null || value === "") return null;

  return storage.createReadUrl(value);
}

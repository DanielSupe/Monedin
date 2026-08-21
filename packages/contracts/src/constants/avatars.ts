/**
 * Catalogo de avatares.
 *
 * UNICA lista, compartida por API y front: la API valida contra ella y el front
 * la recorre para pintar el selector y resolver cada clave a su ilustracion.
 * Anadir o retirar una ilustracion se hace aqui y se refleja en las dos apps.
 *
 * La columna de la base guarda LA CLAVE, no una URL ni una ruta. Cuando llegue
 * `add-file-storage`, un avatar propio sera otra forma del mismo campo y los
 * perfiles existentes no habra que migrarlos. Ver la decision 5 del design de
 * `add-profile-selection`.
 */
export const AVATAR_KEYS = [
  "nutria",
  "zorro",
  "pulpo",
  "erizo",
  "mapache",
  "tucan",
  "ballena",
  "koala",
  "camaleon",
  "lechuza",
  "panda",
  "ajolote",
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

/** El que se usa cuando un perfil no tiene avatar elegido. */
export const DEFAULT_AVATAR_KEY: AvatarKey = "nutria";

export function isAvatarKey(value: unknown): value is AvatarKey {
  return typeof value === "string" && (AVATAR_KEYS as readonly string[]).includes(value);
}

/** El avatar de un perfil, con el de por defecto si no tiene ninguno. */
export function resolveAvatarKey(value: string | null | undefined): AvatarKey {
  return isAvatarKey(value) ? value : DEFAULT_AVATAR_KEY;
}

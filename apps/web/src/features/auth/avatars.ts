import { AVATAR_KEYS, type AvatarKey, resolveAvatarKey } from "@monedin/contracts";

/**
 * Ilustraciones del catálogo.
 *
 * Las claves salen de `@monedin/contracts`, que es la única lista: la API valida
 * contra ella y aquí solo se resuelve cada clave a algo que pintar. Añadir una
 * ilustración se hace allí y este mapa la acompaña.
 *
 * Hoy son emojis. Cuando haya ilustraciones de verdad, cambia este archivo y
 * nada más: ni la base de datos ni la validación saben cómo se pinta un avatar.
 */
const GLYPHS: Record<AvatarKey, string> = {
  nutria: "🦦",
  zorro: "🦊",
  pulpo: "🐙",
  erizo: "🦔",
  mapache: "🦝",
  tucan: "🦜",
  ballena: "🐋",
  koala: "🐨",
  camaleon: "🦎",
  lechuza: "🦉",
  panda: "🐼",
  ajolote: "🐠",
};

export function avatarGlyph(key: string | null | undefined): string {
  return GLYPHS[resolveAvatarKey(key)];
}

/** Todas las opciones, para el selector al crear o editar un perfil. */
export const AVATAR_OPTIONS = AVATAR_KEYS.map((key) => ({ key, glyph: GLYPHS[key] }));

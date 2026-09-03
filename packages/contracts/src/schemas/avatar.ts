import { z } from "zod";
import { AVATAR_KEYS } from "../constants/avatars.js";

/**
 * Validación del catálogo de avatares.
 *
 * Vive aparte de `constants/avatars.ts` para que el catálogo siga siendo una
 * lista sin dependencias, y aparte de `children.ts` porque la imagen del padre y
 * la de un premio lo usarán también.
 *
 * Esto NO es un adorno: la columna `avatar` es texto libre a nivel de motor, así
 * que este esquema es la única defensa contra guardar una clave que el front no
 * sabe pintar. `add-profile-selection` prometió el catálogo "como constante y
 * como esquema" y solo entregó la constante.
 */
export const avatarKeySchema = z.enum(AVATAR_KEYS, {
  errorMap: () => ({ message: "Ese avatar no está en el catálogo." }),
});

export type AvatarKeyInput = z.infer<typeof avatarKeySchema>;

/**
 * Un avatar tal como se LEE: o una clave del catálogo, o una URL ya firmada
 * lista para un `<img src>`.
 *
 * Es la otra mitad del par, y la distinción importa:
 *
 *   - `avatarKeySchema` valida lo que se ESCRIBE al elegir del catálogo, y
 *     sigue siendo un enum cerrado. Subir una foto propia es otro campo
 *     distinto (`avatarUploadKey`), no un valor más de este.
 *   - `avatarValueSchema` describe lo que se DEVUELVE, ya resuelto por el
 *     servidor. El front nunca ve la clave cruda del almacén: o una clave corta
 *     que sabe pintar como ilustración, o una dirección que sabe pintar como
 *     imagen.
 *
 * Que ninguna clave del catálogo empiece por `http` es lo que hace que las dos
 * formas se distingan sin ambigüedad. Ver las decisiones 4 y 5 del design de
 * `add-file-storage`.
 */
export const avatarValueSchema = z.union([avatarKeySchema, z.string().url()]);

export type AvatarValue = z.infer<typeof avatarValueSchema>;

/**
 * Elegir del catálogo y subir una foto son DOS formas del mismo campo, y hay
 * que usar como mucho una.
 *
 * Mandar las dos no es una entrada que se pueda resolver eligiendo una: quien
 * la manda cree que va a pasar algo concreto, y cualquiera de las dos cosas que
 * el servidor decidiera sería la contraria de lo que la mitad de quienes
 * llaman esperaban. Ver la decisión 4 del design de `add-file-storage`.
 *
 * Vive AQUÍ y no en `children.ts` desde que el padre también elige del catálogo:
 * la regla es del avatar, no de los hijos, y tenerla dos veces es como una de
 * las dos acaba diciendo algo distinto.
 */
export function hasAtMostOneAvatarForm(value: {
  avatar?: string | undefined;
  avatarUploadKey?: string | undefined;
}): boolean {
  return value.avatar === undefined || value.avatarUploadKey === undefined;
}

export const AVATAR_FORMS_MESSAGE =
  "Elige un avatar del catálogo o sube una foto, pero no las dos cosas.";

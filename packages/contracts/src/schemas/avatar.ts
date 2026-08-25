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

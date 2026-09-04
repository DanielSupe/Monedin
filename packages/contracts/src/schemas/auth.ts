import { z } from "zod";
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PIN_LENGTH,
} from "../constants/domain.js";
import {
  AVATAR_FORMS_MESSAGE,
  avatarKeySchema,
  avatarValueSchema,
  hasAtMostOneAvatarForm,
} from "./avatar.js";
import { uploadKeySchema } from "./uploads.js";

/**
 * Contratos de autenticación, compartidos por la API y el front.
 *
 * El front valida el formulario con estos mismos esquemas antes de enviar, así
 * que un campo mal puesto se señala sin viaje al servidor y con el mismo
 * criterio que aplicará la API.
 */

/** PIN: exactamente N dígitos, nada más. */
export const pinSchema = z
  .string()
  .length(PIN_LENGTH, `El PIN tiene ${PIN_LENGTH} dígitos.`)
  .regex(/^\d+$/, "El PIN solo puede tener números.");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña necesita al menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .max(PASSWORD_MAX_LENGTH, "La contraseña es demasiado larga.");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "El correo es obligatorio.")
  .email("Ese correo no parece válido.");

export const registerParentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, "El nombre es demasiado corto.")
    .max(NAME_MAX_LENGTH, "El nombre es demasiado largo."),
  email: emailSchema,
  password: passwordSchema,
  /**
   * PIN de adulto, pedido ya en el registro.
   *
   * Se pide aquí y no después para no tener que contemplar en todo el sistema
   * el estado «cuenta sin PIN»: un campo más una sola vez sale más barato. Ver
   * la decisión 4 del design de `add-profile-selection`.
   */
  pin: pinSchema,
});

export type RegisterParentInput = z.infer<typeof registerParentSchema>;

export const loginParentSchema = z.object({
  email: emailSchema,
  // A propósito NO se aplica aquí la política de longitud: rechazar por corta
  // una contraseña al ACCEDER delataría la política a quien prueba, y además
  // dejaría fuera a cuentas creadas con una política anterior.
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export type LoginParentInput = z.infer<typeof loginParentSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria."),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Cambio del PIN de adulto indicando el actual. */
export const changeAdultPinSchema = z.object({
  currentPin: pinSchema,
  newPin: pinSchema,
});

export type ChangeAdultPinInput = z.infer<typeof changeAdultPinSchema>;

/**
 * Restablecimiento del PIN de adulto con la contraseña.
 *
 * Es la vía de recuperación, y existe porque el PIN se usa a diario y la
 * contraseña casi nunca: olvidar el primero es mucho más probable.
 */
export const resetAdultPinSchema = z.object({
  password: z.string().min(1, "La contraseña es obligatoria."),
  newPin: pinSchema,
});

export type ResetAdultPinInput = z.infer<typeof resetAdultPinSchema>;

/**
 * Entrada a un perfil de la rejilla.
 *
 * `profileId` es el del hijo, o `PARENT_PROFILE_ID` para el perfil del padre.
 * Un único endpoint para los dos: desde la rejilla son perfiles iguales, y
 * tener dos caminos invitaría a proteger uno y olvidar el otro.
 */
export const PARENT_PROFILE_ID = "parent" as const;

export const enterProfileSchema = z.object({
  profileId: z.string().min(1),
  pin: pinSchema,
});

export type EnterProfileInput = z.infer<typeof enterProfileSchema>;

/**
 * El niño cambia SU PIN sabiendo el actual.
 *
 * No lleva identificador de perfil a propósito: el que se cambia es el de la
 * sesión y nunca uno que venga en la petición. Es lo que hace imposible por
 * construcción que un niño le cambie el PIN a un hermano.
 */
export const changeOwnChildPinSchema = z.object({
  currentPin: pinSchema,
  newPin: pinSchema,
});

export type ChangeOwnChildPinInput = z.infer<typeof changeOwnChildPinSchema>;

export const setChildPinSchema = z.object({
  childProfileId: z.string().min(1),
  pin: pinSchema,
});

export type SetChildPinInput = z.infer<typeof setChildPinSchema>;

/**
 * El padre cambia su avatar: una ilustración del catálogo o una foto suya.
 *
 * Aceptaba SOLO la foto, y el porqué estaba escrito aquí: no había ninguna
 * pantalla donde el padre eligiera ilustración, y añadir un campo que ninguna
 * interfaz manda es inventar contrato. También estaba escrito qué haría falta
 * cuando esa pantalla existiera —«este esquema gana el `avatar` y su regla de
 * exclusión, como ya la tienen los de `children`»—, y es exactamente esto.
 *
 * La pantalla llegó en `polish-profile-and-reward-image`: la cuenta del padre
 * usa el mismo selector que «Mi perfil» del niño, así que las dos formas del
 * campo tienen ya quien las mande.
 *
 * Las dos son EXCLUYENTES y hace falta una, con la misma regla compartida que
 * usan los esquemas de `children` — la de verdad compartida, no una copia.
 */
export const updateParentAvatarSchema = z
  .object({
    avatar: avatarKeySchema.optional(),
    avatarUploadKey: uploadKeySchema.optional(),
  })
  .strict()
  .refine((value) => value.avatar !== undefined || value.avatarUploadKey !== undefined, {
    message: "No hay nada que cambiar.",
  })
  .refine(hasAtMostOneAvatarForm, { message: AVATAR_FORMS_MESSAGE });

export type UpdateParentAvatarInput = z.infer<typeof updateParentAvatarSchema>;

/**
 * Marcar el recorrido de bienvenida como visto, o pedirlo otra vez.
 *
 * UN campo y no dos rutas: «verlo otra vez» es el mismo dato con el valor
 * contrario. Y una sola ruta para los dos roles, por lo mismo que entrar a un
 * perfil tiene una: tener dos invitaría a proteger una y olvidarse de la otra.
 * La rama por rol vive en el servicio.
 */
export const updateTutorialSchema = z.object({ seen: z.boolean() }).strict();

export type UpdateTutorialInput = z.infer<typeof updateTutorialSchema>;

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

export const parentActorSchema = z.object({
  familyRole: z.literal("PARENT"),
  id: z.string(),
  name: z.string(),
  email: z.string(),
  /**
   * Resuelto y nunca nulo, igual que en `childActorSchema`.
   *
   * Faltaba: el padre elegía su avatar en la rejilla y lo perdía al entrar a su
   * propio perfil, porque su actor no lo llevaba. Es el mismo dato en los dos
   * sitios y ahora se comporta igual en los dos. Ver la decisión 6 del design de
   * `add-file-storage`.
   */
  avatar: avatarValueSchema,
  /**
   * Si a este perfil ya se le mostró el recorrido de bienvenida.
   *
   * Viaja CON el actor y no por un camino aparte, por lo mismo que el avatar:
   * era el mismo dato en dos sitios comportándose distinto hasta que se metió
   * dentro. Un segundo camino trae su propia caché, y una caché puede separarse
   * de la del actor.
   *
   * Un booleano y no la fecha: quien pregunta decide con un sí o un no.
   */
  tutorialSeen: z.boolean(),
});

export const childActorSchema = z.object({
  familyRole: z.literal("CHILD"),
  id: z.string(),
  name: z.string(),
  // Resuelto al de por defecto, nunca nulo, igual que en `selectableProfileSchema`:
  // eran dos formas del mismo dato en el mismo paquete. Estrechar el tipo no
  // rompe a nadie, porque el front ya trataba el caso vacío.
  avatar: avatarValueSchema,
  coins: z.number().int(),
  /**
   * Si a este perfil ya se le mostró el recorrido de bienvenida.
   *
   * Viaja CON el actor y no por un camino aparte, por lo mismo que el avatar:
   * era el mismo dato en dos sitios comportándose distinto hasta que se metió
   * dentro. Un segundo camino trae su propia caché, y una caché puede separarse
   * de la del actor.
   *
   * Un booleano y no la fecha: quien pregunta decide con un sí o un no.
   */
  tutorialSeen: z.boolean(),
});

/** Un perfil tal como se ofrece en la rejilla, antes de entrar. */
export const selectableProfileSchema = z.object({
  /** El del hijo, o `PARENT_PROFILE_ID` para el del padre. */
  id: z.string(),
  familyRole: z.enum(["PARENT", "CHILD"]),
  name: z.string(),
  avatar: avatarValueSchema,
  locked: z.boolean(),
});

export const selectableProfilesSchema = z.object({
  profiles: z.array(selectableProfileSchema),
});

export type SelectableProfile = z.infer<typeof selectableProfileSchema>;
export type SelectableProfiles = z.infer<typeof selectableProfilesSchema>;

export const sessionActorSchema = z.discriminatedUnion("familyRole", [
  parentActorSchema,
  childActorSchema,
]);

export type SessionActor = z.infer<typeof sessionActorSchema>;

/**
 * Respuesta del estado de sesión. Responde 200 SIEMPRE.
 *
 * Distingue TRES situaciones, no dos, y la aplicación web las necesita para
 * saber qué pintar:
 *
 *   hasAccount false, actor null   ->  pantalla de acceso
 *   hasAccount true,  actor null   ->  rejilla de perfiles
 *   hasAccount true,  actor        ->  la aplicación, como ese perfil
 *
 * Ver la decisión 2 del design de `add-profile-selection`.
 */
export const sessionStateSchema = z.object({
  actor: sessionActorSchema.nullable(),
  /** Si el dispositivo está acreditado para una cuenta. */
  hasAccount: z.boolean(),
});

export type SessionState = z.infer<typeof sessionStateSchema>;

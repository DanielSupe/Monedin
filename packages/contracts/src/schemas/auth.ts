import { z } from "zod";
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PIN_LENGTH,
} from "../constants/domain.js";

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

export const enterChildProfileSchema = z.object({
  childProfileId: z.string().min(1),
  pin: pinSchema,
});

export type EnterChildProfileInput = z.infer<typeof enterChildProfileSchema>;

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

export const setChildPinSchema = z.object({
  childProfileId: z.string().min(1),
  pin: pinSchema,
});

export type SetChildPinInput = z.infer<typeof setChildPinSchema>;

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

export const parentActorSchema = z.object({
  familyRole: z.literal("PARENT"),
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export const childActorSchema = z.object({
  familyRole: z.literal("CHILD"),
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable(),
  coins: z.number().int(),
});

/** Un perfil tal como se ofrece en la rejilla, antes de entrar. */
export const selectableProfileSchema = z.object({
  /** El del hijo, o `PARENT_PROFILE_ID` para el del padre. */
  id: z.string(),
  familyRole: z.enum(["PARENT", "CHILD"]),
  name: z.string(),
  avatar: z.string(),
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

export const selectableChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable(),
  locked: z.boolean(),
});

export const selectableChildrenSchema = z.object({
  children: z.array(selectableChildSchema),
});

export type SelectableChild = z.infer<typeof selectableChildSchema>;
export type SelectableChildren = z.infer<typeof selectableChildrenSchema>;

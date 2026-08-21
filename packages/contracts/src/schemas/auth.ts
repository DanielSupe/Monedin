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

export const enterChildProfileSchema = z.object({
  childProfileId: z.string().min(1),
  pin: pinSchema,
});

export type EnterChildProfileInput = z.infer<typeof enterChildProfileSchema>;

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

export const sessionActorSchema = z.discriminatedUnion("familyRole", [
  parentActorSchema,
  childActorSchema,
]);

export type SessionActor = z.infer<typeof sessionActorSchema>;

/**
 * Respuesta del estado de sesión.
 *
 * Responde 200 SIEMPRE, con o sin sesión: la aplicación web la llama al
 * arrancar para saber qué pintar, y que nadie haya entrado todavía es el caso
 * normal, no un error.
 */
export const sessionStateSchema = z.object({
  actor: sessionActorSchema.nullable(),
  /** Si hay una sesión de padre esperando detrás de una de niño. */
  parentSessionAvailable: z.boolean(),
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

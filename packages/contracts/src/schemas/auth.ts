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

  pin: pinSchema,
});

export type RegisterParentInput = z.infer<typeof registerParentSchema>;

export const loginParentSchema = z.object({
  email: emailSchema,

  password: z.string().min(1, "La contraseña es obligatoria."),
});

export type LoginParentInput = z.infer<typeof loginParentSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria."),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changeAdultPinSchema = z.object({
  currentPin: pinSchema,
  newPin: pinSchema,
});

export type ChangeAdultPinInput = z.infer<typeof changeAdultPinSchema>;

export const resetAdultPinSchema = z.object({
  password: z.string().min(1, "La contraseña es obligatoria."),
  newPin: pinSchema,
});

export type ResetAdultPinInput = z.infer<typeof resetAdultPinSchema>;

export const PARENT_PROFILE_ID = "parent" as const;

export const enterProfileSchema = z.object({
  profileId: z.string().min(1),
  pin: pinSchema,
});

export type EnterProfileInput = z.infer<typeof enterProfileSchema>;

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

export const updateTutorialSchema = z.object({ seen: z.boolean() }).strict();

export type UpdateTutorialInput = z.infer<typeof updateTutorialSchema>;

export const themePreferenceSchema = z.enum(["SYSTEM", "LIGHT", "DARK"]);

export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export const updateThemeSchema = z.object({ theme: themePreferenceSchema }).strict();

export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;

export const parentActorSchema = z.object({
  familyRole: z.literal("PARENT"),
  id: z.string(),
  name: z.string(),
  email: z.string(),

  avatar: avatarValueSchema,

  tutorialSeen: z.boolean(),

  theme: themePreferenceSchema,
});

export const childActorSchema = z.object({
  familyRole: z.literal("CHILD"),
  id: z.string(),
  name: z.string(),

  avatar: avatarValueSchema,
  coins: z.number().int(),

  tutorialSeen: z.boolean(),

  theme: themePreferenceSchema,
});

export const selectableProfileSchema = z.object({
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

export const sessionStateSchema = z.object({
  actor: sessionActorSchema.nullable(),

  hasAccount: z.boolean(),
});

export type SessionState = z.infer<typeof sessionStateSchema>;

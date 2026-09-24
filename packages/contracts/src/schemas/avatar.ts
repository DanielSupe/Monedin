import { z } from "zod";
import { AVATAR_KEYS } from "../constants/avatars.js";

export const avatarKeySchema = z.enum(AVATAR_KEYS, {
  errorMap: () => ({ message: "Ese avatar no está en el catálogo." }),
});

export type AvatarKeyInput = z.infer<typeof avatarKeySchema>;

export const avatarValueSchema = z.union([avatarKeySchema, z.string().url()]);

export type AvatarValue = z.infer<typeof avatarValueSchema>;

export function hasAtMostOneAvatarForm(value: {
  avatar?: string | undefined;
  avatarUploadKey?: string | undefined;
}): boolean {
  return value.avatar === undefined || value.avatarUploadKey === undefined;
}

export const AVATAR_FORMS_MESSAGE =
  "Elige un avatar del catálogo o sube una foto, pero no las dos cosas.";

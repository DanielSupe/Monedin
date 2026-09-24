import { z } from "zod";
import { CHILD_AGE_MAX, CHILD_AGE_MIN, NAME_MAX_LENGTH, NAME_MIN_LENGTH } from "../constants/domain.js";
import { pinSchema } from "./auth.js";
import {
  AVATAR_FORMS_MESSAGE,
  avatarKeySchema,
  avatarValueSchema,
  hasAtMostOneAvatarForm,
} from "./avatar.js";
import { paginationQuerySchema, pageOf } from "./pagination.js";
import { uploadKeySchema } from "./uploads.js";

export const childNameSchema = z
  .string()
  .trim()
  .min(NAME_MIN_LENGTH, "El nombre es demasiado corto.")
  .max(NAME_MAX_LENGTH, "El nombre es demasiado largo.");

export const childAgeSchema = z
  .number({ invalid_type_error: "La edad tiene que ser un número." })
  .int("La edad tiene que ser un número entero.")
  .min(CHILD_AGE_MIN, `Monedín es para niños de ${CHILD_AGE_MIN} a ${CHILD_AGE_MAX} años.`)
  .max(CHILD_AGE_MAX, `Monedín es para niños de ${CHILD_AGE_MIN} a ${CHILD_AGE_MAX} años.`);

export const createChildSchema = z
  .object({
    name: childNameSchema,
    pin: pinSchema,
    age: childAgeSchema.optional(),
    avatar: avatarKeySchema.optional(),
  })
  .strict();

export type CreateChildInput = z.infer<typeof createChildSchema>;

export const updateChildSchema = z
  .object({
    name: childNameSchema.optional(),
    age: childAgeSchema.nullable().optional(),
    avatar: avatarKeySchema.optional(),

    avatarUploadKey: uploadKeySchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No hay nada que cambiar.",
  })
  .refine(hasAtMostOneAvatarForm, { message: AVATAR_FORMS_MESSAGE });

export type UpdateChildInput = z.infer<typeof updateChildSchema>;

export const updateOwnChildSchema = z
  .object({
    avatar: avatarKeySchema.optional(),
    avatarUploadKey: uploadKeySchema.optional(),
  })
  .strict()
  .refine((value) => value.avatar !== undefined || value.avatarUploadKey !== undefined, {
    message: "No hay nada que cambiar.",
  })
  .refine(hasAtMostOneAvatarForm, { message: AVATAR_FORMS_MESSAGE });

export type UpdateOwnChildInput = z.infer<typeof updateOwnChildSchema>;

export const childParamsSchema = z.object({
  childId: z.string().min(1, "Falta el identificador del hijo."),
});

export type ChildParams = z.infer<typeof childParamsSchema>;

export const listChildrenQuerySchema = paginationQuerySchema;

export const childSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: avatarValueSchema,
  age: z.number().int().nullable(),
  coins: z.number().int(),
  locked: z.boolean(),
  createdAt: z.string().datetime(),
});

export type Child = z.infer<typeof childSchema>;

export const childrenPageSchema = pageOf(childSchema);
export type ChildrenPage = z.infer<typeof childrenPageSchema>;

export const ownChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: avatarValueSchema,
  age: z.number().int().nullable(),
  coins: z.number().int(),
});

export type OwnChild = z.infer<typeof ownChildSchema>;

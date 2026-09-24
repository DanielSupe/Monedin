import { z } from "zod";
import { ALLOWED_IMAGE_CONTENT_TYPES, MAX_UPLOAD_KEY_LENGTH } from "../constants/uploads.js";

export const imageContentTypeSchema = z.enum(ALLOWED_IMAGE_CONTENT_TYPES, {
  errorMap: () => ({ message: "Ese tipo de imagen no se admite." }),
});

export const createUploadUrlSchema = z
  .object({
    contentType: imageContentTypeSchema,
  })
  .strict();

export type CreateUploadUrlInput = z.infer<typeof createUploadUrlSchema>;

export const uploadKeySchema = z
  .string()
  .min(1, "Falta la referencia de la imagen.")
  .max(MAX_UPLOAD_KEY_LENGTH, "Esa referencia de imagen no es válida.");

export const uploadUrlSchema = z.object({
  uploadUrl: z.string().url(),
  key: z.string(),
  expiresAt: z.string().datetime(),
});

export type UploadUrl = z.infer<typeof uploadUrlSchema>;

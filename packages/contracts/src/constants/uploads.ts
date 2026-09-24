export const ALLOWED_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageContentType = (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

export const MAX_UPLOAD_KEY_LENGTH = 512;

export const MAX_IMAGE_SIZE_MB = 1;

export const AVATAR_MAX_DIMENSION = 512;

export const PHOTO_MAX_DIMENSION = 1280;

import type { ImageContentType } from "@monedin/contracts";

const EXTENSIONS: Record<ImageContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extensionForContentType(contentType: ImageContentType): string {
  return EXTENSIONS[contentType];
}

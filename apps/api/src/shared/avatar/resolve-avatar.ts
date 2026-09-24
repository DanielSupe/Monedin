import { DEFAULT_AVATAR_KEY, type AvatarValue, isAvatarKey } from "@monedin/contracts";
import type { StorageProvider } from "../storage/index.js";

export async function resolveAvatarForResponse(
  storage: StorageProvider,
  value: string | null,
): Promise<AvatarValue> {
  if (isAvatarKey(value)) return value;
  if (value === null || value === "") return DEFAULT_AVATAR_KEY;

  return storage.createReadUrl(value);
}

export async function resolveImageForResponse(
  storage: StorageProvider,
  value: string | null,
): Promise<string | null> {
  if (value === null || value === "") return null;

  return storage.createReadUrl(value);
}

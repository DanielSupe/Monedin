import type { StorageProvider } from "./provider.js";

export async function isConfirmableUpload(
  storage: StorageProvider,
  key: string,
  expectedPrefix: string,
): Promise<boolean> {
  if (!key.startsWith(expectedPrefix)) return false;

  if (key.includes("..")) return false;

  return storage.objectExists(key);
}

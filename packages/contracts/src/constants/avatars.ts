export const AVATAR_KEYS = [
  "nutria",
  "zorro",
  "pulpo",
  "erizo",
  "mapache",
  "tucan",
  "ballena",
  "koala",
  "camaleon",
  "lechuza",
  "panda",
  "ajolote",
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

export const DEFAULT_AVATAR_KEY: AvatarKey = "nutria";

export function isAvatarKey(value: unknown): value is AvatarKey {
  return typeof value === "string" && (AVATAR_KEYS as readonly string[]).includes(value);
}

export function resolveAvatarKey(value: string | null | undefined): AvatarKey {
  return isAvatarKey(value) ? value : DEFAULT_AVATAR_KEY;
}

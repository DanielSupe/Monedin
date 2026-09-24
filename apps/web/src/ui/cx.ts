export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter((value): value is string => typeof value === "string" && value !== "").join(" ");
}

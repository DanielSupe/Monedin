/**
 * Une clases descartando lo que no es una cadena.
 *
 * Cabe en tres líneas y evita una dependencia. No intenta resolver conflictos
 * entre utilidades de Tailwind: en este sistema las piezas deciden sus clases y
 * quien las usa añade posición y margen, que no chocan.
 */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter((value): value is string => typeof value === "string" && value !== "").join(" ");
}

const IDIOMA = "es-ES";

export function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString(IDIOMA, { day: "numeric", month: "long" });
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString(IDIOMA, { day: "numeric", month: "short" });
}

export function hoyConDia(): string {
  return new Date().toLocaleDateString(IDIOMA, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

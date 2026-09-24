import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(suscribir, leer, leerEnServidor);
}

function suscribir(alCambiar: () => void): () => void {
  const media = globalThis.matchMedia?.(CONSULTA);
  if (media === undefined) return () => undefined;

  media.addEventListener("change", alCambiar);
  return () => media.removeEventListener("change", alCambiar);
}

function leer(): boolean {
  return globalThis.matchMedia?.(CONSULTA).matches ?? false;
}

function leerEnServidor(): boolean {
  return false;
}

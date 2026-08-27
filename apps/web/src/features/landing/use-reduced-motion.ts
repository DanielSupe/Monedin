import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

/**
 * Si la persona ha pedido menos movimiento en su sistema.
 *
 * Existe porque el bloque de `tokens.css` **no basta** para esta página. Ese
 * bloque pone toda duración a 1ms, lo cual está bien para una transición y es
 * peor que nada para una animación con estado: la máquina de escribir se queda
 * en el primer carácter y la cuenta en cero. Ninguna regla de CSS puede
 * arreglarlo, porque eso es estado de React y tiene que saberlo el hook.
 *
 * `useSyncExternalStore` y no un efecto: así el primer render ya sabe la
 * respuesta. Con un efecto habría un fotograma con el valor equivocado, que es
 * justo el parpadeo que alguien con sensibilidad al movimiento no debería ver.
 */
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
  // `matchMedia` no existe en algunos entornos de prueba. Ante la duda, se
  // asume que NO se pidió menos movimiento: animar de más molesta, pero dar por
  // buena una preferencia que nadie expresó es peor.
  return globalThis.matchMedia?.(CONSULTA).matches ?? false;
}

function leerEnServidor(): boolean {
  return false;
}

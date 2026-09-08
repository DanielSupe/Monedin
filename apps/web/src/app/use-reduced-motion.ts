import { useEffect, useState } from "react";

/** Lo que el sistema operativo dice cuando alguien pide ver menos movimiento. */
const REDUCIDO = "(prefers-reduced-motion: reduce)";

/**
 * Si quien está delante pidió ver menos movimiento.
 *
 * Existe porque hay movimiento que NO se puede expresar en CSS y por tanto no lo
 * cubre el bloque de `tokens.css`: un contenido que se sustituye a sí mismo cada
 * pocos segundos lo mueve un TEMPORIZADOR, y un temporizador no se apaga con una
 * media query. Hay que preguntar y parar.
 *
 * Y no vale acortar la transición: el bloque del sistema deja las duraciones en
 * un instante, lo que convierte un cambio suave en un salto — peor para quien
 * pidió no ver movimiento, no mejor. Es la misma lección que dejó el crecimiento
 * de las teselas de la rejilla.
 *
 * El valor se lee de forma SÍNCRONA al inicializar el estado y no en un efecto,
 * igual que `useIsWide()`: así el primer pintado ya es el correcto y quien tiene
 * la preferencia activada no llega a ver ni un cambio.
 */
export function useReducedMotion(): boolean {
  const [reducido, setReducido] = useState(() => consultar()?.matches ?? false);

  useEffect(() => {
    const consulta = consultar();
    if (consulta === null) {
      return;
    }

    const alCambiar = (evento: MediaQueryListEvent): void => setReducido(evento.matches);

    setReducido(consulta.matches);
    consulta.addEventListener("change", alCambiar);

    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  return reducido;
}

/** `null` donde no hay `matchMedia`, para no reventar fuera de un navegador. */
function consultar(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia(REDUCIDO);
}

import { useEffect, useState } from "react";

/**
 * Dónde empieza «hay ancho de sobra». Coincide con `lg` de Tailwind.
 *
 * Por debajo —tablet en vertical incluida— el cajón se lleva la pantalla entera
 * al abrirse y la devuelve al cerrarse, que es mejor que dejar 500px de
 * contenido con una columna fija al lado.
 */
const ANCHO = "(min-width: 64rem)";

/**
 * Si la pantalla da para tener la navegación delante.
 *
 * Existe para montar UNA de las dos formas del lateral, no las dos con una
 * escondida por CSS. Dos listas de destinos son dos para quien recorre el
 * documento con teclado o con un lector de pantalla, aunque una no se vea; y
 * jsdom no aplica CSS, así que con `hidden` el test de «ningún destino dos
 * veces» —la regla central de la navegación— no se podría ni escribir.
 *
 * El valor se lee de forma SÍNCRONA al inicializar el estado y no en un efecto:
 * así el primer pintado ya es el correcto y no hay un parpadeo de cajón antes de
 * la columna.
 */
export function useIsWide(): boolean {
  const [ancho, setAncho] = useState(() => consultar()?.matches ?? false);

  useEffect(() => {
    const consulta = consultar();
    if (consulta === null) {
      return;
    }

    const alCambiar = (evento: MediaQueryListEvent): void => setAncho(evento.matches);

    setAncho(consulta.matches);
    consulta.addEventListener("change", alCambiar);

    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  return ancho;
}

/** `null` donde no hay `matchMedia`, para no reventar fuera de un navegador. */
function consultar(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia(ANCHO);
}

import { useEffect, useState } from "react";

const ANCHO = "(min-width: 64rem)";

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

function consultar(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia(ANCHO);
}

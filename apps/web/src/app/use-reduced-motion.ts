import { useEffect, useState } from "react";

const REDUCIDO = "(prefers-reduced-motion: reduce)";

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

function consultar(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia(REDUCIDO);
}

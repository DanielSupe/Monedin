import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion.js";

export interface CountUpOptions {
  duration?: number;

  delay?: number;
}

export function useCountUp(target: number, options: CountUpOptions = {}): number {
  const { duration = 2000, delay = 0 } = options;
  const sinMovimiento = usePrefersReducedMotion();
  const [valor, setValor] = useState(() => (sinMovimiento ? target : 0));

  useEffect(() => {
    if (sinMovimiento) {
      setValor(target);
      return;
    }

    setValor(0);

    let cuadro = 0;
    let inicio: number | undefined;

    const avanzar = (ahora: number): void => {
      inicio ??= ahora;
      const transcurrido = ahora - inicio;

      if (transcurrido < 0) {
        cuadro = requestAnimationFrame(avanzar);
        return;
      }

      const progreso = Math.min(transcurrido / duration, 1);

      const suavizado = 1 - Math.pow(1 - progreso, 3);
      setValor(Math.round(target * suavizado));

      if (progreso < 1) {
        cuadro = requestAnimationFrame(avanzar);
      }
    };

    const espera = setTimeout(() => {
      cuadro = requestAnimationFrame(avanzar);
    }, delay);

    return () => {
      clearTimeout(espera);
      cancelAnimationFrame(cuadro);
    };
  }, [target, duration, delay, sinMovimiento]);

  return valor;
}

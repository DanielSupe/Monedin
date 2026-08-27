import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion.js";

export interface TypewriterOptions {
  /** Milisegundos por carácter. */
  speed?: number;
  /** Cuánto espera antes de empezar a escribir. */
  delay?: number;
}

export interface Typewriter {
  /** Lo que hay escrito hasta ahora. */
  text: string;
  /** Si ya terminó. Lo usa el cursor para dejar de parpadear. */
  done: boolean;
}

/**
 * Escribe un texto carácter a carácter.
 *
 * Con movimiento reducido devuelve el texto **completo** desde el primer render,
 * y `done` en verdadero. Un titular detenido en su primera letra no es una
 * animación discreta: es una página rota.
 *
 * El texto completo está SIEMPRE en el DOM del titular —ver `Hero`—, así que lo
 * que este hook decide es solo qué se ve, nunca qué se anuncia. Un lector de
 * pantalla no debería oír un título escribiéndose letra a letra.
 */
export function useTypewriter(full: string, options: TypewriterOptions = {}): Typewriter {
  const { speed = 35, delay = 0 } = options;
  const sinMovimiento = usePrefersReducedMotion();
  const [escrito, setEscrito] = useState(() => (sinMovimiento ? full.length : 0));

  useEffect(() => {
    if (sinMovimiento) {
      setEscrito(full.length);
      return;
    }

    setEscrito(0);

    let intervalo: ReturnType<typeof setInterval> | undefined;

    const espera = setTimeout(() => {
      intervalo = setInterval(() => {
        setEscrito((anterior) => {
          if (anterior >= full.length) {
            clearInterval(intervalo);
            return anterior;
          }
          return anterior + 1;
        });
      }, speed);
    }, delay);

    return () => {
      clearTimeout(espera);
      clearInterval(intervalo);
    };
  }, [full, speed, delay, sinMovimiento]);

  return { text: full.slice(0, escrito), done: escrito >= full.length };
}

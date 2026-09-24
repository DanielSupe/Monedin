import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion.js";

export interface TypewriterOptions {
  speed?: number;

  delay?: number;
}

export interface Typewriter {
  text: string;

  done: boolean;
}

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

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion.js";

const INICIO = 300;

const PASO = 20;

const TOPE = 500;

const INTERVALO = 5000;

const TRANSICION = 700;

function siguiente(valor: number): number {
  return valor >= TOPE ? 0 : valor + PASO;
}

export function useCoinCycle(): number {
  const sinMovimiento = usePrefersReducedMotion();
  const [valor, setValor] = useState(INICIO);

  const destino = useRef(INICIO);

  useEffect(() => {
    if (sinMovimiento) {
      destino.current = INICIO;
      setValor(INICIO);
      return;
    }

    let cuadro = 0;

    const animarHasta = (desde: number, hasta: number): void => {
      let inicio: number | undefined;

      const avanzar = (ahora: number): void => {
        inicio ??= ahora;
        const progreso = Math.min((ahora - inicio) / TRANSICION, 1);

        const suavizado = 1 - Math.pow(1 - progreso, 3);
        setValor(Math.round(desde + (hasta - desde) * suavizado));

        if (progreso < 1) {
          cuadro = requestAnimationFrame(avanzar);
        }
      };

      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(avanzar);
    };

    const reloj = setInterval(() => {
      const desde = destino.current;
      const hasta = siguiente(desde);
      destino.current = hasta;
      animarHasta(desde, hasta);
    }, INTERVALO);

    return () => {
      clearInterval(reloj);
      cancelAnimationFrame(cuadro);
    };
  }, [sinMovimiento]);

  return valor;
}

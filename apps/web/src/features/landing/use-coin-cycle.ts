import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion.js";

/**
 * El saldo del centro de las órbitas, subiendo por pasos y volviendo a empezar.
 *
 * Empieza en `INICIO`, sube `PASO` cada `INTERVALO`, y al llegar a `TOPE`
 * vuelve a cero para seguir subiendo. Es el ciclo del producto contado con la
 * única cifra que hay en la página: se gana, se acumula, se gasta, se empieza
 * otra vez.
 *
 * Cada paso se ANIMA en vez de saltar, con la misma desaceleración que usa
 * `useCountUp`: un número que cambia de golpe cada cinco segundos parpadea, y
 * uno que sube se lee como que algo está pasando.
 *
 * Con movimiento reducido NO CICLA. Y no es un atajo: un número que cambia solo
 * cada cinco segundos ES movimiento, y de la clase que peor sienta —aparece en
 * el rabillo del ojo y obliga a volver a mirar—. Se queda en `INICIO`, que es un
 * valor honesto y estable. Es el mismo criterio que `Orbits` aplica a los
 * anillos, que se PARAN en vez de acelerarse a un milisegundo.
 */

/** Dónde empieza la cuenta. */
const INICIO = 300;
/** Cuánto sube en cada paso. */
const PASO = 20;
/** Al llegar aquí, vuelve a cero. */
const TOPE = 500;
/** Cada cuánto da un paso, en milisegundos. */
const INTERVALO = 5000;
/** Lo que tarda en recorrer un paso. Corto: es un apunte, no una cuenta atrás. */
const TRANSICION = 700;

/** El siguiente valor del ciclo. Al tocar el tope, vuelve a cero. */
function siguiente(valor: number): number {
  return valor >= TOPE ? 0 : valor + PASO;
}

export function useCoinCycle(): number {
  const sinMovimiento = usePrefersReducedMotion();
  const [valor, setValor] = useState(INICIO);

  /*
   * El destino vive en una referencia y no en el estado.
   *
   * El efecto no puede depender de `valor` —cambia en cada cuadro de la
   * animación, y eso reiniciaría el intervalo sesenta veces por segundo—, así
   * que lo que se lee para decidir el paso siguiente no puede ser el estado.
   */
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
        // Misma desaceleración que `useCountUp`: una cuenta lineal parece un
        // contador de fábrica.
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

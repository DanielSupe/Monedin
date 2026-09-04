import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCoinCycle } from "../../src/features/landing/use-coin-cycle.js";
import { useCountUp } from "../../src/features/landing/use-count-up.js";
import { useTypewriter } from "../../src/features/landing/use-typewriter.js";

/**
 * jsdom no implementa `matchMedia`, así que la preferencia se declara aquí.
 * Es el mismo criterio que el relleno de captura de puntero en `tests/setup.ts`:
 * rellenar un hueco del entorno para que se parezca al navegador de verdad.
 */
function declararMovimientoReducido(reducido: boolean): void {
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    matches: reducido && consulta.includes("prefers-reduced-motion"),
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

beforeEach(() => {
  // `requestAnimationFrame` y `performance` hay que pedirlos: vitest no los
  // simula por defecto, y sin ellos la cuenta corre en tiempo real mientras el
  // test cree estar adelantando el reloj.
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "Date",
      "performance",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("la cuenta del saldo", () => {
  it("empieza en cero y llega al valor pedido", () => {
    declararMovimientoReducido(false);
    const { result } = renderHook(() => useCountUp(340, { duration: 1000 }));

    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe(340);
  });

  it("nunca se pasa del valor pedido", () => {
    declararMovimientoReducido(false);
    const { result } = renderHook(() => useCountUp(340, { duration: 1000 }));

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current).toBe(340);
  });

  it("con movimiento reducido enseña el valor final DESDE EL PRIMER RENDER", () => {
    declararMovimientoReducido(true);
    const { result } = renderHook(() => useCountUp(340));

    // Sin avanzar un solo temporizador. Una cuenta detenida en cero enseña un
    // dato falso, que es peor que no tener cuenta.
    expect(result.current).toBe(340);
  });
});

describe("la máquina de escribir", () => {
  const TITULAR = "Sus tareas valen monedas.";

  it("empieza vacía y termina con el texto completo", () => {
    declararMovimientoReducido(false);
    const { result } = renderHook(() => useTypewriter(TITULAR, { speed: 10 }));

    expect(result.current.text).toBe("");
    expect(result.current.done).toBe(false);

    act(() => {
      vi.advanceTimersByTime(TITULAR.length * 10 + 100);
    });

    expect(result.current.text).toBe(TITULAR);
    expect(result.current.done).toBe(true);
  });

  it("va escribiendo, no aparece de golpe", () => {
    declararMovimientoReducido(false);
    const { result } = renderHook(() => useTypewriter(TITULAR, { speed: 10 }));

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.text.length).toBeGreaterThan(0);
    expect(result.current.text.length).toBeLessThan(TITULAR.length);
    expect(TITULAR.startsWith(result.current.text)).toBe(true);
  });

  it("con movimiento reducido enseña el titular COMPLETO desde el primer render", () => {
    declararMovimientoReducido(true);
    const { result } = renderHook(() => useTypewriter(TITULAR));

    // Un titular detenido en su primera letra no es una animación discreta: es
    // una página rota.
    expect(result.current.text).toBe(TITULAR);
    expect(result.current.done).toBe(true);
  });
});

/**
 * El saldo del centro de las órbitas, que ya no cuenta una vez sino que CICLA.
 *
 * Sube por pasos y al llegar al tope vuelve a cero: es el ciclo del producto
 * contado con la única cifra que hay en la página.
 */
describe("el saldo del centro cicla", () => {
  /** Los valores del ciclo, para no escribirlos a mano en cada expectativa. */
  const INICIO = 300;
  const PASO = 20;
  const TOPE = 500;
  const INTERVALO = 5000;
  /** Lo que dura la transición de un paso. Menor que el intervalo, a propósito. */
  const TRANSICION = 700;

  /**
   * Adelanta N pasos y deja que el último termine de animarse.
   *
   * De UNA vez y no en un bucle de «espera + asienta»: cada asentamiento suma
   * al reloj, así que en diez vueltas se colaban dos intervalos de más y la
   * cuenta salía pasada. Se adelanta el tiempo exacto de los N pasos y solo
   * después lo que tarda la última transición, que al ser menor que un
   * intervalo no dispara ninguno más.
   *
   * Se llama UNA vez por test, por lo mismo.
   */
  function avanzarPasos(cuantos: number): void {
    act(() => {
      vi.advanceTimersByTime(cuantos * INTERVALO);
    });
    act(() => {
      vi.advanceTimersByTime(TRANSICION);
    });
  }

  it("empieza en su valor de inicio, sin esperar", () => {
    declararMovimientoReducido(false);
    const { result } = renderHook(() => useCoinCycle());

    expect(result.current).toBe(INICIO);
  });

  it("sube un paso por intervalo", () => {
    declararMovimientoReducido(false);
    const { result } = renderHook(() => useCoinCycle());

    avanzarPasos(1);
    expect(result.current).toBe(INICIO + PASO);
  });

  /*
   * El caso que de verdad prueba el ciclo.
   *
   * Se llega al tope y se da UN paso más: si no volviera a cero seguiría
   * subiendo, y ese es el defecto que este test persigue. Los números están
   * elegidos para que las dos respuestas se distingan — 0 contra 520.
   */
  it("al llegar al tope vuelve a cero, y sigue desde ahí", () => {
    declararMovimientoReducido(false);
    const { result } = renderHook(() => useCoinCycle());

    // Los pasos justos para llegar al tope, y UNO más. Si no volviera a cero
    // seguiría subiendo: las dos respuestas son 0 y 520, que se distinguen.
    const hastaElTope = (TOPE - INICIO) / PASO;

    avanzarPasos(hastaElTope + 1);
    expect(result.current).toBe(0);
  });

  it("cada paso se ANIMA: a mitad de camino no ha llegado", () => {
    declararMovimientoReducido(false);
    const { result } = renderHook(() => useCoinCycle());

    act(() => {
      vi.advanceTimersByTime(INTERVALO);
    });
    // Justo al saltar el reloj, la transición acaba de empezar.
    expect(result.current).toBeLessThan(INICIO + PASO);
    expect(result.current).toBeGreaterThanOrEqual(INICIO);
  });

  /*
   * Un número que cambia solo cada cinco segundos ES movimiento, y de la clase
   * que peor sienta: aparece en el rabillo del ojo y obliga a volver a mirar.
   */
  it("con movimiento reducido NO cicla: se queda quieto", () => {
    declararMovimientoReducido(true);
    const { result } = renderHook(() => useCoinCycle());

    expect(result.current).toBe(INICIO);

    avanzarPasos(3);

    expect(result.current).toBe(INICIO);
  });
});

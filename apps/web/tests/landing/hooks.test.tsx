import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

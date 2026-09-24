import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCoinCycle } from "../../src/features/landing/use-coin-cycle.js";
import { useCountUp } from "../../src/features/landing/use-count-up.js";
import { useTypewriter } from "../../src/features/landing/use-typewriter.js";

function declararMovimientoReducido(reducido: boolean): void {
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    matches: reducido && consulta.includes("prefers-reduced-motion"),
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

beforeEach(() => {
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

    expect(result.current.text).toBe(TITULAR);
    expect(result.current.done).toBe(true);
  });
});

describe("el saldo del centro cicla", () => {
  const INICIO = 300;
  const PASO = 20;
  const TOPE = 500;
  const INTERVALO = 5000;

  const TRANSICION = 700;

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

  it("al llegar al tope vuelve a cero, y sigue desde ahí", () => {
    declararMovimientoReducido(false);
    const { result } = renderHook(() => useCoinCycle());

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

    expect(result.current).toBeLessThan(INICIO + PASO);
    expect(result.current).toBeGreaterThanOrEqual(INICIO);
  });

  it("con movimiento reducido NO cicla: se queda quieto", () => {
    declararMovimientoReducido(true);
    const { result } = renderHook(() => useCoinCycle());

    expect(result.current).toBe(INICIO);

    avanzarPasos(3);

    expect(result.current).toBe(INICIO);
  });
});

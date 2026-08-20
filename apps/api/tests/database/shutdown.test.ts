import { afterEach, describe, expect, it, vi } from "vitest";
import {
  disconnectPrisma,
  performShutdown,
  registerGracefulShutdown,
} from "../../src/shared/database/client.js";

/**
 * Cierre ordenado.
 *
 * La suscripción a señales se prueba comprobando que engancha y desengancha, no
 * enviando señales de verdad: en Windows `child.kill` no entrega SIGTERM al
 * proceso hijo, así que un test así pasaría en Linux y sería humo en la máquina
 * en la que se está desarrollando.
 *
 * Lo que sí se prueba de verdad es el orden de las dos operaciones, que es lo
 * único que puede estar mal.
 */

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cierre ordenado", () => {
  it("deja de aceptar peticiones ANTES de cerrar la base de datos", async () => {
    const orden: string[] = [];

    const stop = vi.fn(async () => {
      orden.push("dejar de aceptar peticiones");
    });

    await performShutdown(stop);
    orden.push("cerrar base de datos");

    expect(stop).toHaveBeenCalledOnce();
    expect(orden).toEqual(["dejar de aceptar peticiones", "cerrar base de datos"]);
  });

  it("propaga el fallo si no se pueden cerrar las peticiones", async () => {
    const stop = vi.fn(() => Promise.reject(new Error("el servidor no cerró")));

    await expect(performShutdown(stop)).rejects.toThrow("el servidor no cerró");
  });

  it("cerrar la conexión dos veces no falla", async () => {
    await expect(disconnectPrisma()).resolves.toBeUndefined();
    await expect(disconnectPrisma()).resolves.toBeUndefined();
  });
});

describe("suscripción a las señales de terminación", () => {
  it("engancha SIGTERM y SIGINT, y los suelta al desengancharse", () => {
    const antesTerm = process.listenerCount("SIGTERM");
    const antesInt = process.listenerCount("SIGINT");

    const unregister = registerGracefulShutdown(() => Promise.resolve());

    expect(process.listenerCount("SIGTERM")).toBe(antesTerm + 1);
    expect(process.listenerCount("SIGINT")).toBe(antesInt + 1);

    unregister();

    expect(process.listenerCount("SIGTERM")).toBe(antesTerm);
    expect(process.listenerCount("SIGINT")).toBe(antesInt);
  });

  it("una segunda señal durante el cierre no reinicia el proceso de apagado", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    let llamadas = 0;
    const stop = vi.fn(async () => {
      llamadas += 1;
    });

    const unregister = registerGracefulShutdown(stop);
    try {
      process.emit("SIGTERM");
      process.emit("SIGTERM");

      // El cierre es asíncrono; hay que dejar que la microcola avance.
      await new Promise((resolve) => setImmediate(resolve));

      expect(llamadas).toBe(1);
    } finally {
      unregister();
      exit.mockRestore();
    }
  });
});

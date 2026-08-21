import { describe, expect, it } from "vitest";
import {
  hashCredential,
  hashCredentialWithParamsForTests,
  verifyCredential,
} from "../../src/shared/crypto/credentials.js";

describe("hash de credenciales", () => {
  it("verifica la credencial correcta", async () => {
    const hash = await hashCredential("una contraseña larga y decente");

    await expect(verifyCredential("una contraseña larga y decente", hash)).resolves.toMatchObject({
      valid: true,
    });
  });

  it("rechaza una credencial incorrecta", async () => {
    const hash = await hashCredential("una contraseña larga y decente");

    await expect(verifyCredential("otra cosa", hash)).resolves.toMatchObject({ valid: false });
  });

  it("distingue credenciales que solo difieren en un carácter", async () => {
    const hash = await hashCredential("1234");

    await expect(verifyCredential("1235", hash)).resolves.toMatchObject({ valid: false });
    await expect(verifyCredential("1234", hash)).resolves.toMatchObject({ valid: true });
  });

  it("da hashes distintos a dos credenciales idénticas", async () => {
    const [uno, otro] = await Promise.all([
      hashCredential("la misma contraseña"),
      hashCredential("la misma contraseña"),
    ]);

    expect(uno).not.toBe(otro);
    // Y aun así ambos verifican.
    await expect(verifyCredential("la misma contraseña", uno)).resolves.toMatchObject({
      valid: true,
    });
    await expect(verifyCredential("la misma contraseña", otro)).resolves.toMatchObject({
      valid: true,
    });
  });

  it("no deja rastro de la credencial en el hash", async () => {
    const hash = await hashCredential("contraseña-muy-reconocible");

    expect(hash).not.toContain("contraseña-muy-reconocible");
    expect(hash).not.toContain("reconocible");
  });

  it("guarda el algoritmo y los parámetros dentro del hash", async () => {
    const hash = await hashCredential("cualquiera");

    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash).toMatch(/^scrypt\$N=\d+,r=\d+,p=\d+\$[^$]+\$[^$]+$/);
  });

  it("normaliza la credencial, para que la misma tecleada de dos formas valga", async () => {
    // "ñ" se puede componer de dos maneras distintas en Unicode; para quien
    // teclea son la misma letra.
    const compuesta = "contraseña-larga";
    const precompuesta = "contraseña-larga";

    const hash = await hashCredential(compuesta);

    await expect(verifyCredential(precompuesta, hash)).resolves.toMatchObject({ valid: true });
  });
});

describe("subida de parámetros sin invalidar credenciales", () => {
  const PARAMS_ANTIGUOS = { N: 4096, r: 8, p: 1 };

  it("una credencial hasheada con parámetros antiguos sigue verificando", async () => {
    const hash = await hashCredentialWithParamsForTests("la de siempre", PARAMS_ANTIGUOS);

    await expect(verifyCredential("la de siempre", hash)).resolves.toMatchObject({ valid: true });
  });

  it("y se marca para rehashear", async () => {
    const hash = await hashCredentialWithParamsForTests("la de siempre", PARAMS_ANTIGUOS);

    await expect(verifyCredential("la de siempre", hash)).resolves.toEqual({
      valid: true,
      needsRehash: true,
    });
  });

  it("con los parámetros actuales no pide rehash", async () => {
    const hash = await hashCredential("la de siempre");

    await expect(verifyCredential("la de siempre", hash)).resolves.toEqual({
      valid: true,
      needsRehash: false,
    });
  });

  it("no pide rehash de algo que no verifica", async () => {
    const hash = await hashCredentialWithParamsForTests("la de siempre", PARAMS_ANTIGUOS);

    await expect(verifyCredential("otra", hash)).resolves.toEqual({
      valid: false,
      needsRehash: false,
    });
  });
});

describe("robustez ante hashes corruptos", () => {
  const corruptos = [
    ["cadena vacía", ""],
    ["texto suelto", "no-soy-un-hash"],
    ["algoritmo desconocido", "bcrypt$N=1,r=1,p=1$c2Fs$Y2xhdmU="],
    ["faltan partes", "scrypt$N=16384,r=8,p=1$c2Fs"],
    ["parámetros ilegibles", "scrypt$N=abc,r=8,p=1$c2Fs$Y2xhdmU="],
  ] as const;

  for (const [caso, valor] of corruptos) {
    it(`no verifica ni revienta con ${caso}`, async () => {
      await expect(verifyCredential("cualquiera", valor)).resolves.toEqual({
        valid: false,
        needsRehash: false,
      });
    });
  }
});

describe("propiedades que sostienen la seguridad", () => {
  it("la verificación no delata por su duración si el fallo fue temprano o tardío", async () => {
    const hash = await hashCredential("contraseña-de-referencia");

    // Dos credenciales incorrectas: una que difiere en el primer carácter y otra
    // en el último. Una comparación ingenua con === tardaría distinto.
    async function medir(candidata: string): Promise<number> {
      const inicio = performance.now();
      await verifyCredential(candidata, hash);
      return performance.now() - inicio;
    }

    const muestras = 5;
    let temprano = 0;
    let tardio = 0;
    for (let i = 0; i < muestras; i += 1) {
      temprano += await medir("Xontraseña-de-referencia");
      tardio += await medir("contraseña-de-referenciX");
    }

    const media = (temprano + tardio) / (2 * muestras);
    const diferencia = Math.abs(temprano - tardio) / muestras;

    // El grueso del tiempo es la derivación, que es igual en ambos casos. La
    // comparación final es en tiempo constante, así que la diferencia tiene que
    // quedarse en ruido de medición.
    expect(diferencia).toBeLessThan(media * 0.5);
  }, 30_000);

  it("el hash es asíncrono y no bloquea el bucle de eventos", async () => {
    let tics = 0;
    const contador = setInterval(() => {
      tics += 1;
    }, 5);

    try {
      await Promise.all([
        hashCredential("una"),
        hashCredential("dos"),
        hashCredential("tres"),
      ]);
    } finally {
      clearInterval(contador);
    }

    // Si `scrypt` corriera en el hilo principal, el temporizador no habría
    // podido dispararse ni una vez durante los hashes.
    expect(tics).toBeGreaterThan(0);
  }, 30_000);

  it("hashear cuesta tiempo a propósito", async () => {
    const inicio = performance.now();
    await hashCredential("cualquiera");
    const transcurrido = performance.now() - inicio;

    // Un hash instantáneo sería señal de parámetros demasiado bajos: la lentitud
    // es la defensa.
    expect(transcurrido).toBeGreaterThan(10);
  }, 30_000);
});

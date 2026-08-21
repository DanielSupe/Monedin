import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/api/auth.js";
import { describeAuthError, isLockout } from "../src/features/auth/use-session.js";
import { ApiRequestError } from "../src/lib/http-client.js";
import { messages } from "../src/lib/messages.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cliente de sesión", () => {
  it("consulta el estado en la ruta del contrato compartido", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { actor: null, parentSessionAvailable: false }));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchSession();

    expect(fetchMock).toHaveBeenCalledWith(`${API_PREFIX}/auth/session`, expect.anything());
  });

  it("acepta que no haya sesión: no es un error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { actor: null, parentSessionAvailable: false })),
    );

    await expect(api.fetchSession()).resolves.toEqual({
      actor: null,
      parentSessionAvailable: false,
    });
  });

  it("interpreta una sesión de niño con su saldo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          actor: { familyRole: "CHILD", id: "c1", name: "Mateo", avatar: null, coins: 120 },
          parentSessionAvailable: true,
        }),
      ),
    );

    const state = await api.fetchSession();

    expect(state.actor).toMatchObject({ familyRole: "CHILD", coins: 120 });
    expect(state.parentSessionAvailable).toBe(true);
  });

  it("maneja una respuesta 204 sin cuerpo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(emptyResponse(204)));

    // Cerrar sesión y salir de un perfil responden 204: parsearlo como JSON
    // reventaría.
    await expect(api.logout()).resolves.toBeUndefined();
    await expect(api.leaveChildProfile()).resolves.toBeUndefined();
  });

  it("rechaza una respuesta correcta que no cumple el contrato", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { actor: "raro" })));

    await expect(api.fetchSession()).rejects.toBeInstanceOf(ApiRequestError);
  });
});

describe("el front decide por el código, no por el texto", () => {
  it("distingue credencial incorrecta de bloqueo", () => {
    const incorrecta = new ApiRequestError({
      status: 401,
      code: ERROR_CODES.UNAUTHORIZED,
      message: "cualquier redacción",
    });
    const bloqueo = new ApiRequestError({
      status: 429,
      code: ERROR_CODES.TOO_MANY_ATTEMPTS,
      message: "cualquier otra redacción",
    });

    expect(describeAuthError(incorrecta)).toBe(messages.auth.invalidCredentials);
    expect(describeAuthError(bloqueo)).toBe(messages.auth.tooManyAttempts);
    expect(describeAuthError(incorrecta)).not.toBe(describeAuthError(bloqueo));
  });

  it("la decisión no cambia si cambia la redacción del mensaje de la API", () => {
    const textos = ["El correo o la contraseña no son correctos.", "Otra cosa completamente."];

    const resultados = textos.map((message) =>
      describeAuthError(
        new ApiRequestError({ status: 401, code: ERROR_CODES.UNAUTHORIZED, message }),
      ),
    );

    expect(new Set(resultados).size).toBe(1);
  });

  it("reconoce el bloqueo para no invitar a reintentar de inmediato", () => {
    expect(
      isLockout(
        new ApiRequestError({ status: 429, code: ERROR_CODES.TOO_MANY_ATTEMPTS, message: "x" }),
      ),
    ).toBe(true);
    expect(
      isLockout(new ApiRequestError({ status: 401, code: ERROR_CODES.UNAUTHORIZED, message: "x" })),
    ).toBe(false);
  });

  it("un correo ya registrado tiene su propio mensaje", () => {
    const conflicto = new ApiRequestError({
      status: 409,
      code: ERROR_CODES.CONFLICT,
      message: "x",
    });

    expect(describeAuthError(conflicto)).toBe(messages.auth.emailTaken);
  });

  it("un error de validación muestra el detalle del campo", () => {
    const invalido = new ApiRequestError({
      status: 422,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "x",
      details: [{ field: "password", code: "too_small", message: "Necesita más caracteres." }],
    });

    expect(describeAuthError(invalido)).toBe("Necesita más caracteres.");
  });

  it("un fallo de red cae en el mensaje genérico", () => {
    expect(describeAuthError(new TypeError("Failed to fetch"))).toBe(messages.errors.network);
  });
});

describe("mensajes visibles", () => {
  it("el mensaje de credenciales no señala cuál de los dos datos falla", () => {
    const texto = messages.auth.invalidCredentials;

    // Nombra ambos, que es lo que lo hace ambiguo.
    expect(texto).toMatch(/correo/i);
    expect(texto).toMatch(/contraseñ/i);
  });

  it("el mensaje de bloqueo del PIN manda pedir ayuda a un adulto, no reintentar", () => {
    expect(messages.auth.pinLocked).toMatch(/adulto/i);
    expect(messages.auth.pinLocked).not.toMatch(/prueba otra vez/i);
  });
});

describe("la pantalla del PIN habla el idioma de un niño", () => {
  it("un PIN incorrecto no dice nada de correos ni contraseñas", () => {
    // El código es el mismo que el de una contraseña equivocada, así que esta
    // pantalla necesita su propio mensaje. Se detectó probándolo en el
    // navegador: al niño le salía «El correo o la contraseña no son correctos».
    expect(messages.auth.pinWrong).not.toMatch(/correo/i);
    expect(messages.auth.pinWrong).not.toMatch(/contraseñ/i);
    expect(messages.auth.pinWrong).toMatch(/PIN/i);
  });

  it("y el de bloqueo tampoco", () => {
    expect(messages.auth.pinLocked).not.toMatch(/correo/i);
    expect(messages.auth.pinLocked).not.toMatch(/contraseñ/i);
  });
});

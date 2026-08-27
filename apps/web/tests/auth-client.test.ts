import { API_PREFIX, AVATAR_KEYS, DEFAULT_AVATAR_KEY, ERROR_CODES } from "@monedin/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/api/auth.js";
import { AVATAR_OPTIONS, avatarGlyph } from "../src/ui/avatars.js";
import { describeAuthError, isLockout, screenFor } from "../src/features/auth/use-session.js";
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
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { actor: null, hasAccount: false }));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchSession();

    expect(fetchMock).toHaveBeenCalledWith(`${API_PREFIX}/auth/session`, expect.anything());
  });

  it("acepta que no haya cuenta: no es un error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { actor: null, hasAccount: false })));

    await expect(api.fetchSession()).resolves.toEqual({ actor: null, hasAccount: false });
  });

  it("distingue cuenta sin perfil de sesión inexistente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { actor: null, hasAccount: true })));

    const state = await api.fetchSession();

    expect(state).toEqual({ actor: null, hasAccount: true });
  });

  it("interpreta un perfil de niño activo con su saldo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          actor: {
            familyRole: "CHILD",
            id: "c1",
            name: "Mateo",
            avatar: DEFAULT_AVATAR_KEY,
            coins: 120,
          },
          hasAccount: true,
        }),
      ),
    );

    const state = await api.fetchSession();

    expect(state.actor).toMatchObject({ familyRole: "CHILD", coins: 120 });
    expect(state.hasAccount).toBe(true);
  });

  it("el avatar del actor llega siempre resuelto, nunca nulo", async () => {
    // La API lo resuelve al de por defecto antes de responder, igual que en la
    // rejilla. Eran dos formas del mismo dato y el front tenía que tratar el
    // hueco en cada pantalla. Ver la tarea 1.6 de `add-children`.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          actor: { familyRole: "CHILD", id: "c1", name: "Mateo", avatar: null, coins: 0 },
          hasAccount: true,
        }),
      ),
    );

    await expect(api.fetchSession()).rejects.toBeInstanceOf(ApiRequestError);
  });

  it("maneja una respuesta 204 sin cuerpo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(emptyResponse(204)));

    // Cerrar sesión y salir de un perfil responden 204: parsearlo como JSON
    // reventaría.
    await expect(api.logout()).resolves.toBeUndefined();
    await expect(api.leaveProfile()).resolves.toBeUndefined();
  });

  it("rechaza una respuesta correcta que no cumple el contrato", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { actor: "raro" })));

    await expect(api.fetchSession()).rejects.toBeInstanceOf(ApiRequestError);
  });
});

describe("cliente de la rejilla", () => {
  it("lista los perfiles seleccionables en la ruta del contrato compartido", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        profiles: [
          { id: "parent", familyRole: "PARENT", name: "Lucía", avatar: "nutria", locked: false },
          { id: "c1", familyRole: "CHILD", name: "Mateo", avatar: "zorro", locked: false },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { profiles } = await api.fetchProfiles();

    expect(fetchMock).toHaveBeenCalledWith(`${API_PREFIX}/auth/profiles`, expect.anything());
    expect(profiles).toHaveLength(2);
    expect(profiles[0]).toMatchObject({ id: "parent", familyRole: "PARENT" });
  });

  it("entra a un perfil con su identificador y su PIN", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, {
          actor: {
            familyRole: "PARENT",
            id: "u1",
            name: "Lucía",
            email: "l@x.test",
            avatar: "nutria",
          },
          hasAccount: true,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await api.enterProfile({ profileId: "parent", pin: "1357" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_PREFIX}/auth/profiles/enter`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ profileId: "parent", pin: "1357" }) }),
    );
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
      describeAuthError(new ApiRequestError({ status: 401, code: ERROR_CODES.UNAUTHORIZED, message })),
    );

    expect(new Set(resultados).size).toBe(1);
  });

  it("reconoce el bloqueo para no invitar a reintentar de inmediato, sea cual sea el perfil", () => {
    const bloqueo = new ApiRequestError({ status: 429, code: ERROR_CODES.TOO_MANY_ATTEMPTS, message: "x" });
    const incorrecto = new ApiRequestError({ status: 401, code: ERROR_CODES.UNAUTHORIZED, message: "x" });

    expect(isLockout(bloqueo)).toBe(true);
    expect(isLockout(incorrecto)).toBe(false);
  });

  it("un correo ya registrado tiene su propio mensaje", () => {
    const conflicto = new ApiRequestError({ status: 409, code: ERROR_CODES.CONFLICT, message: "x" });

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

describe("la guarda tiene tres estados, no dos", () => {
  it("sin sesión todavía, se pide acceso", () => {
    expect(screenFor(undefined)).toBe("signIn");
  });

  it("sin cuenta, se pide acceso", () => {
    expect(screenFor({ actor: null, hasAccount: false })).toBe("signIn");
  });

  it("con cuenta y sin perfil elegido, la rejilla", () => {
    expect(screenFor({ actor: null, hasAccount: true })).toBe("profiles");
  });

  it("con perfil activo, la aplicación", () => {
    expect(
      screenFor({
        actor: {
          familyRole: "PARENT",
          id: "u1",
          name: "Lucía",
          email: "l@x.test",
          avatar: "nutria",
        },
        hasAccount: true,
      }),
    ).toBe("app");
  });
});

describe("mensajes visibles", () => {
  it("el mensaje de credenciales no señala cuál de los dos datos falla", () => {
    const texto = messages.auth.invalidCredentials;

    // Nombra ambos, que es lo que lo hace ambiguo.
    expect(texto).toMatch(/correo/i);
    expect(texto).toMatch(/contraseñ/i);
  });

  it("el mensaje de bloqueo del PIN de un hijo manda pedir ayuda a un adulto, no reintentar", () => {
    expect(messages.auth.pinLocked).toMatch(/adulto/i);
    expect(messages.auth.pinLocked).not.toMatch(/prueba otra vez/i);
  });
});

describe("la pantalla del PIN habla el idioma de quien la ve", () => {
  it("un PIN de hijo incorrecto no dice nada de correos ni contraseñas", () => {
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

  it("el PIN del padre tiene sus propios mensajes, distintos de los del hijo", () => {
    // Mismo código de error (401 / 429) para los dos roles, pero un padre no
    // necesita que le digan que pida ayuda a un adulto, y a un niño no se le
    // dice que restablezca su PIN con una contraseña.
    expect(messages.auth.adultPinWrong).not.toBe(messages.auth.pinWrong);
    expect(messages.auth.adultPinLocked).not.toBe(messages.auth.pinLocked);
    expect(messages.auth.adultPinLocked).not.toMatch(/adulto/i);
    expect(messages.auth.adultPinLocked).toMatch(/contraseña/i);
  });

  it("un PIN de adulto incorrecto se distingue del bloqueo", () => {
    expect(messages.auth.adultPinWrong).not.toBe(messages.auth.adultPinLocked);
  });
});

describe("el catálogo de avatares", () => {
  it("pinta las mismas claves que declara el contrato, sin huecos", () => {
    const claves = AVATAR_OPTIONS.map((option) => option.key);

    expect(new Set(claves).size).toBe(AVATAR_KEYS.length);
    expect(claves.sort()).toEqual([...AVATAR_KEYS].sort());
  });

  it("cada opción tiene una ilustración", () => {
    for (const option of AVATAR_OPTIONS) {
      expect(option.glyph.length).toBeGreaterThan(0);
    }
  });

  it("una clave desconocida resuelve al avatar por defecto en vez de fallar", () => {
    expect(avatarGlyph("no-existe")).toBe(avatarGlyph(null));
  });
});

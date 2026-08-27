import { API_PREFIX, DEFAULT_AVATAR_KEY } from "@monedin/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as authApi from "../src/api/auth.js";
import * as childrenApi from "../src/api/children.js";
import * as rewardsApi from "../src/api/rewards.js";
import * as tasksApi from "../src/api/tasks.js";
import { isAvatarUrl } from "../src/ui/avatars.js";
import { putToUploadUrl, UploadError } from "../src/lib/s3-upload.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const UNA_URL = {
  uploadUrl: "https://bucket.example/avatars/children/hijo-1/abc.jpg?firma=x",
  key: "avatars/children/hijo-1/abc.jpg",
  expiresAt: "2026-08-25T10:05:00.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pedir una URL de subida", () => {
  it("usa las rutas del contrato y solo manda el tipo de contenido", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, UNA_URL));
    vi.stubGlobal("fetch", fetchMock);

    await childrenApi.requestOwnAvatarUploadUrl("image/jpeg");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/children/me/avatar/upload-url`);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ contentType: "image/jpeg" }));
    // La clave la decide el servidor: mandarla sería inventarse la mitad del
    // mecanismo de seguridad.
    expect(init.body).not.toContain("key");
  });

  it("la del propio niño NO lleva identificador de perfil", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, UNA_URL));
    vi.stubGlobal("fetch", fetchMock);

    await childrenApi.requestOwnAvatarUploadUrl("image/jpeg");

    expect(fetchMock.mock.calls[0]?.[0]).not.toContain("hijo");
  });

  it("las cuatro rutas de subida salen del contrato", async () => {
    // Un Response nuevo por llamada: el cuerpo de uno solo se puede leer una vez.
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(200, UNA_URL)));
    vi.stubGlobal("fetch", fetchMock);

    await childrenApi.requestChildAvatarUploadUrl("hijo-1", "image/png");
    await authApi.requestParentAvatarUploadUrl("image/png");
    await rewardsApi.requestRewardImageUploadUrl("premio-1", "image/png");
    await tasksApi.requestEvidenceUploadUrl("tarea-1", "image/png");

    expect(fetchMock.mock.calls.map((llamada) => llamada[0])).toEqual([
      `${API_PREFIX}/children/hijo-1/avatar/upload-url`,
      `${API_PREFIX}/auth/avatar/upload-url`,
      `${API_PREFIX}/rewards/premio-1/image/upload-url`,
      `${API_PREFIX}/tasks/tarea-1/evidence/upload-url`,
    ]);
  });

  it("una respuesta sin la URL falla como forma inesperada", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { key: "a", expiresAt: UNA_URL.expiresAt })),
    );

    await expect(childrenApi.requestOwnAvatarUploadUrl("image/jpeg")).rejects.toThrow();
  });
});

describe("subir contra la URL firmada", () => {
  it("va por PUT, con el tipo pedido, y FUERA del prefijo de la API", async () => {
    // Si pasara por `apiFetch`, la dirección llevaría el prefijo y el cuerpo
    // iría como JSON: las dos cosas rompen la subida.
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await putToUploadUrl(UNA_URL.uploadUrl, new Blob(["x"]), "image/jpeg");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(UNA_URL.uploadUrl);
    expect(url).not.toContain(API_PREFIX);
    expect(init.method).toBe("PUT");
    expect(init.headers["Content-Type"]).toBe("image/jpeg");
  });

  it("un rechazo del almacén se traduce a un error de subida, no de la API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));

    await expect(
      putToUploadUrl(UNA_URL.uploadUrl, new Blob(["x"]), "image/jpeg"),
    ).rejects.toBeInstanceOf(UploadError);
  });

  it("un fallo de red también", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sin red")));

    await expect(
      putToUploadUrl(UNA_URL.uploadUrl, new Blob(["x"]), "image/jpeg"),
    ).rejects.toBeInstanceOf(UploadError);
  });
});

describe("confirmar lo subido", () => {
  it("el niño manda la clave y NUNCA las dos formas a la vez", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { id: "h1", name: "Ana", avatar: DEFAULT_AVATAR_KEY, age: null, coins: 0 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await childrenApi.updateOwnChild({ avatarUploadKey: UNA_URL.key });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init.method).toBe("PATCH");
    expect(init.body).toContain("avatarUploadKey");
    expect(init.body).not.toContain('"avatar"');
  });

  it("completar una tarea sin foto no manda ninguna evidencia", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        id: "t1",
        title: "Ordenar",
        description: null,
        coins: 10,
        status: "COMPLETED",
        dueDate: null,
        evidence: null,
        createdAt: "2026-08-24T10:00:00.000Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await tasksApi.completeTask("t1");

    expect(fetchMock.mock.calls[0]?.[1].body).toBe("{}");
  });

  it("completar con foto sí la manda", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        id: "t1",
        title: "Ordenar",
        description: null,
        coins: 10,
        status: "COMPLETED",
        dueDate: null,
        evidence: "https://bucket.example/e.jpg",
        createdAt: "2026-08-24T10:00:00.000Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await tasksApi.completeTask("t1", "tasks/t1/evidence/a.jpg");

    expect(fetchMock.mock.calls[0]?.[1].body).toContain("evidenceUploadKey");
  });
});

describe("cómo el front decide qué pintar", () => {
  it("una clave del catálogo NO es una URL", () => {
    // Es lo único que separa pintar un emoji de pintar una foto.
    expect(isAvatarUrl(DEFAULT_AVATAR_KEY)).toBe(false);
    expect(isAvatarUrl("zorro")).toBe(false);
  });

  it("una URL firmada sí lo es", () => {
    expect(isAvatarUrl("https://bucket.example/avatars/x.jpg?firma=y")).toBe(true);
    expect(isAvatarUrl("http://localhost:9000/monedin-dev/x.jpg")).toBe(true);
  });

  it("sin valor cae del lado del catálogo, que resuelve al de por defecto", () => {
    expect(isAvatarUrl(null)).toBe(false);
    expect(isAvatarUrl(undefined)).toBe(false);
    expect(isAvatarUrl("")).toBe(false);
  });
});

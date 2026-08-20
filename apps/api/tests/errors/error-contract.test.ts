import { API_PREFIX, ERROR_CODES, apiErrorSchema } from "@monedin/contracts";
import { Router } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { apiRouters, createApp } from "../../src/app.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../src/shared/errors/domain-errors.js";
import { validate } from "../../src/shared/http/validate.js";

/** Efecto observable: si la lógica de negocio corre, esto crece. */
let businessLogicRuns = 0;

/**
 * Router de pruebas que lanza cada error de dominio. No define ningún mapeo a
 * HTTP: precisamente eso es lo que se comprueba, que un módulo nuevo herede el
 * comportamiento correcto sin escribir código de traducción.
 */
function probeRouter(): Router {
  const router = Router();

  router.get("/probe/not-found", () => {
    throw new NotFoundError();
  });
  router.get("/probe/forbidden", () => {
    throw new ForbiddenError();
  });
  router.get("/probe/unauthorized", () => {
    throw new UnauthorizedError();
  });
  router.get("/probe/conflict", () => {
    throw new ConflictError();
  });
  router.get("/probe/unexpected", () => {
    throw new Error("fallo de la base de datos en /var/lib/postgresql/data");
  });
  router.get("/probe/async-unexpected", async () => {
    await Promise.resolve();
    throw new Error("fallo asíncrono no contemplado");
  });

  const bodySchema = z.object({
    title: z.string().min(2, "el título necesita al menos 2 caracteres"),
    coins: z.number().int().min(1, "las monedas empiezan en 1"),
  });

  router.post(
    "/probe/validated",
    validate({ body: bodySchema }),
    (_req, res) => {
      businessLogicRuns += 1;
      res.status(201).json({ created: true });
    },
  );

  return router;
}

const app = createApp([...apiRouters, probeRouter()]);

beforeEach(() => {
  businessLogicRuns = 0;
});

describe("forma única del cuerpo de error", () => {
  const casos = [
    { ruta: "not-found", estado: 404, codigo: ERROR_CODES.NOT_FOUND },
    { ruta: "forbidden", estado: 403, codigo: ERROR_CODES.FORBIDDEN },
    { ruta: "unauthorized", estado: 401, codigo: ERROR_CODES.UNAUTHORIZED },
    { ruta: "conflict", estado: 409, codigo: ERROR_CODES.CONFLICT },
  ];

  for (const caso of casos) {
    it(`traduce ${caso.ruta} a ${caso.estado} con el cuerpo estándar`, async () => {
      const response = await request(app).get(`${API_PREFIX}/probe/${caso.ruta}`);

      expect(response.status).toBe(caso.estado);
      expect(apiErrorSchema.safeParse(response.body).success).toBe(true);
      expect(response.body.code).toBe(caso.codigo);
      expect(typeof response.body.message).toBe("string");
      expect(response.body.message.length).toBeGreaterThan(0);
    });
  }

  it("usa la misma forma de cuerpo en todos los estados", async () => {
    const respuestas = await Promise.all(
      casos.map((caso) => request(app).get(`${API_PREFIX}/probe/${caso.ruta}`)),
    );

    const formas = respuestas.map((response) => Object.keys(response.body).sort().join(","));

    expect(new Set(formas).size).toBe(1);
  });
});

describe("errores de validación", () => {
  it("responde 422 identificando los dos campos inválidos y su motivo", async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/probe/validated`)
      .send({ title: "x", coins: 0 });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);

    const campos = response.body.details.map((detail: { field: string }) => detail.field);
    expect(campos).toContain("title");
    expect(campos).toContain("coins");
    expect(response.body.details).toHaveLength(2);

    for (const detail of response.body.details) {
      expect(typeof detail.message).toBe("string");
      expect(detail.message.length).toBeGreaterThan(0);
    }
  });

  it("no ejecuta la lógica de negocio cuando la entrada es inválida", async () => {
    await request(app).post(`${API_PREFIX}/probe/validated`).send({ title: "x", coins: 0 });

    expect(businessLogicRuns).toBe(0);
  });

  it("responde 422 ante un cuerpo malformado, sin ejecutar nada", async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/probe/validated`)
      .set("Content-Type", "application/json")
      .send("{esto no es json");

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(businessLogicRuns).toBe(0);
  });

  it("deja pasar la entrada válida", async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/probe/validated`)
      .send({ title: "Ordenar el cuarto", coins: 50 });

    expect(response.status).toBe(201);
    expect(businessLogicRuns).toBe(1);
  });
});

describe("errores inesperados", () => {
  it("responde 500 genérico, con identificador y sin filtrar detalles internos", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app).get(`${API_PREFIX}/probe/unexpected`);
    const cuerpo = JSON.stringify(response.body);

    expect(response.status).toBe(500);
    expect(response.body.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(response.body.incidentId).toBeTruthy();

    // Nada de trazas, rutas de archivos ni mensajes de librerías internas.
    expect(cuerpo).not.toContain("/var/lib/postgresql");
    expect(cuerpo).not.toContain("at ");
    expect(cuerpo).not.toContain(".ts:");
    expect(cuerpo).not.toContain("Error:");
    expect(cuerpo).not.toContain("stack");

    logged.mockRestore();
  });

  it("registra el fallo completo en el log bajo el mismo identificador", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app).get(`${API_PREFIX}/probe/unexpected`);
    const registrado = logged.mock.calls.map((call) => JSON.stringify(call)).join("\n");

    expect(registrado).toContain(response.body.incidentId);
    expect(registrado).toContain("/var/lib/postgresql");

    logged.mockRestore();
  });

  it("captura también los fallos lanzados en handlers asíncronos", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app).get(`${API_PREFIX}/probe/async-unexpected`);

    expect(response.status).toBe(500);
    expect(response.body.code).toBe(ERROR_CODES.INTERNAL_ERROR);

    logged.mockRestore();
  });

  it("da un identificador distinto a cada incidente", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    const primera = await request(app).get(`${API_PREFIX}/probe/unexpected`);
    const segunda = await request(app).get(`${API_PREFIX}/probe/unexpected`);

    expect(primera.body.incidentId).not.toBe(segunda.body.incidentId);

    logged.mockRestore();
  });
});

describe("rutas desconocidas", () => {
  it("responde 404 con el cuerpo estándar, no con el formato del framework", async () => {
    const response = await request(app).get(`${API_PREFIX}/no-existe-esta-ruta`);

    expect(response.status).toBe(404);
    expect(response.type).toBe("application/json");
    expect(apiErrorSchema.safeParse(response.body).success).toBe(true);
    expect(response.body.code).toBe(ERROR_CODES.ROUTE_NOT_FOUND);
  });

  it("responde 404 estándar también fuera del prefijo", async () => {
    const response = await request(app).get("/una-ruta-cualquiera");

    expect(response.status).toBe(404);
    expect(apiErrorSchema.safeParse(response.body).success).toBe(true);
  });
});

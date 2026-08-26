import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { resetAuthData } from "../support/auth.js";
import { fijarSaldo, sembrarPremio } from "../support/rewards.js";
import { sembrarObjeto, subirConUrlFirmada } from "../support/storage.js";
import { estadoDe, familiaOperando, sembrarTarea } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

describe("la foto de un premio", () => {
  it("se añade EDITANDO el premio y se ve en el catálogo", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: hijos[0]!.id, coins: 60 }] });

    const url = await request(app)
      .post(`${API_PREFIX}/rewards/${premio.id}/image/upload-url`)
      .set("Cookie", cookies)
      .send({ contentType: "image/jpeg" })
      .expect(200);

    expect(url.body.key).toContain(`rewards/${premio.id}/`);
    await subirConUrlFirmada(url.body.uploadUrl);

    const editado = await request(app)
      .patch(`${API_PREFIX}/rewards/${premio.id}`)
      .set("Cookie", cookies)
      .send({ imageUploadKey: url.body.key });

    expect(editado.status).toBe(200);
    expect(editado.body.image).toMatch(/^https?:\/\//);
  }, 180_000);

  it("el niño la ve en su escaparate, sin el precio de su hermano", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const [ana, bruno] = hijos;
    await fijarSaldo(ana!.id, 100);

    const premio = await sembrarPremio(parentId, {
      offers: [
        { childId: ana!.id, coins: 60 },
        { childId: bruno!.id, coins: 40 },
      ],
    });

    const key = `rewards/${premio.id}/${crypto.randomUUID()}.jpg`;
    await sembrarObjeto(key);
    await request(app)
      .patch(`${API_PREFIX}/rewards/${premio.id}`)
      .set("Cookie", cookies)
      .send({ imageUploadKey: key })
      .expect(200);

    const escaparate = await request(app)
      .get(`${API_PREFIX}/rewards/mine`)
      .set("Cookie", ana!.cookies);

    expect(escaparate.body.items[0].image).toMatch(/^https?:\/\//);
    expect(escaparate.body.items[0].coins).toBe(60);

    // El precio del hermano sigue sin aparecer. Se comprueba sobre los CAMPOS
    // numéricos y no sobre el JSON en crudo: una URL firmada lleva hexadecimal
    // dentro, así que buscar "40" como texto casa con la firma y no con nada
    // que sea un precio.
    const numeros = JSON.stringify(escaparate.body.items).match(/:\s*(\d+)/g) ?? [];
    expect(numeros).not.toContain(": 40");
    expect(escaparate.body.items.some((item: { coins: number }) => item.coins === 40)).toBe(false);
  }, 300_000);

  it("el alta NO acepta foto: es 422", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);

    const response = await request(app)
      .post(`${API_PREFIX}/rewards`)
      .set("Cookie", cookies)
      .send({
        title: "Ir al cine",
        childIds: [hijos[0]!.id],
        coins: 200,
        imageUploadKey: "rewards/x/a.jpg",
      });

    expect(response.status).toBe(422);
  }, 120_000);

  it("null explícito la quita y el premio sigue siendo válido", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: hijos[0]!.id, coins: 60 }] });

    const key = `rewards/${premio.id}/${crypto.randomUUID()}.jpg`;
    await sembrarObjeto(key);
    await request(app)
      .patch(`${API_PREFIX}/rewards/${premio.id}`)
      .set("Cookie", cookies)
      .send({ imageUploadKey: key })
      .expect(200);

    const sinFoto = await request(app)
      .patch(`${API_PREFIX}/rewards/${premio.id}`)
      .set("Cookie", cookies)
      .send({ imageUploadKey: null });

    expect(sinFoto.status).toBe(200);
    expect(sinFoto.body.image).toBeNull();
  }, 180_000);

  it("la clave de OTRO premio da 422 aunque exista", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: hijos[0]!.id, coins: 60 }] });
    const otro = await sembrarPremio(parentId, { title: "Otro" });

    const ajena = `rewards/${otro.id}/${crypto.randomUUID()}.jpg`;
    await sembrarObjeto(ajena);

    const response = await request(app)
      .patch(`${API_PREFIX}/rewards/${premio.id}`)
      .set("Cookie", cookies)
      .send({ imageUploadKey: ajena });

    expect(response.status).toBe(422);
  }, 180_000);

  it("un niño no pide la URL de subida de un premio", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: hijos[0]!.id, coins: 60 }] });

    const response = await request(app)
      .post(`${API_PREFIX}/rewards/${premio.id}/image/upload-url`)
      .set("Cookie", hijos[0]!.cookies)
      .send({ contentType: "image/jpeg" });

    expect(response.status).toBe(403);
  }, 120_000);
});

describe("la evidencia de una tarea", () => {
  it("completar SIN evidencia funciona igual que siempre", async () => {
    // Es la garantía de que la foto no se volvió un peaje.
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id });

    const response = await request(app)
      .post(`${API_PREFIX}/tasks/${tarea.id}/complete`)
      .set("Cookie", ana.cookies)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.evidence).toBeNull();
    expect(await estadoDe(tarea.id)).toBe("COMPLETED");
  }, 180_000);

  it("completar con evidencia la deja visible para el padre antes de resolver", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id });

    const url = await request(app)
      .post(`${API_PREFIX}/tasks/${tarea.id}/evidence/upload-url`)
      .set("Cookie", ana.cookies)
      .send({ contentType: "image/jpeg" })
      .expect(200);

    await subirConUrlFirmada(url.body.uploadUrl);

    const completada = await request(app)
      .post(`${API_PREFIX}/tasks/${tarea.id}/complete`)
      .set("Cookie", ana.cookies)
      .send({ evidenceUploadKey: url.body.key });

    expect(completada.status).toBe(200);
    expect(completada.body.evidence).toMatch(/^https?:\/\//);

    // Y el padre la ve en su detalle, que es para lo que está.
    const detalle = await request(app)
      .get(`${API_PREFIX}/tasks/${tarea.id}`)
      .set("Cookie", cookies);

    expect(detalle.body.evidence).toMatch(/^https?:\/\//);
  }, 180_000);

  it("una evidencia que no se subió da 422 y la tarea SIGUE PENDIENTE", async () => {
    // Es preferible que el niño reintente a que quede marcada con una foto que
    // no está.
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id });

    const response = await request(app)
      .post(`${API_PREFIX}/tasks/${tarea.id}/complete`)
      .set("Cookie", ana.cookies)
      .send({ evidenceUploadKey: `tasks/${tarea.id}/evidence/fantasma.jpg` });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(await estadoDe(tarea.id)).toBe("PENDING");
  }, 180_000);

  it("la evidencia de OTRA tarea da 422 aunque exista", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id });
    const otra = await sembrarTarea({ parentId, childId: ana.id });

    const ajena = `tasks/${otra.id}/evidence/${crypto.randomUUID()}.jpg`;
    await sembrarObjeto(ajena);

    const response = await request(app)
      .post(`${API_PREFIX}/tasks/${tarea.id}/complete`)
      .set("Cookie", ana.cookies)
      .send({ evidenceUploadKey: ajena });

    expect(response.status).toBe(422);
    expect(await estadoDe(tarea.id)).toBe("PENDING");
  }, 180_000);

  it("no se sube evidencia de una tarea ya marcada", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id }, { status: "COMPLETED" });

    const response = await request(app)
      .post(`${API_PREFIX}/tasks/${tarea.id}/evidence/upload-url`)
      .set("Cookie", ana.cookies)
      .send({ contentType: "image/jpeg" });

    expect(response.status).toBe(409);
  }, 120_000);

  it("un niño no pide la URL de evidencia de la tarea de un hermano", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const [ana, bruno] = hijos;
    const deBruno = await sembrarTarea({ parentId, childId: bruno!.id });

    const response = await request(app)
      .post(`${API_PREFIX}/tasks/${deBruno.id}/evidence/upload-url`)
      .set("Cookie", ana!.cookies)
      .send({ contentType: "image/jpeg" });

    expect(response.status).toBe(404);
  }, 180_000);

  it("un padre no adjunta evidencia: no es su tarea que completar", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const tarea = await sembrarTarea({ parentId, childId: hijos[0]!.id });

    const response = await request(app)
      .post(`${API_PREFIX}/tasks/${tarea.id}/evidence/upload-url`)
      .set("Cookie", cookies)
      .send({ contentType: "image/jpeg" });

    expect(response.status).toBe(403);
  }, 120_000);

  it("el doble tap de completar con evidencia guarda UNA sola", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id });

    const url = await request(app)
      .post(`${API_PREFIX}/tasks/${tarea.id}/evidence/upload-url`)
      .set("Cookie", ana.cookies)
      .send({ contentType: "image/jpeg" })
      .expect(200);
    await subirConUrlFirmada(url.body.uploadUrl);

    const completar = (): request.Test =>
      request(app)
        .post(`${API_PREFIX}/tasks/${tarea.id}/complete`)
        .set("Cookie", ana.cookies)
        .send({ evidenceUploadKey: url.body.key });

    const respuestas = await Promise.all([completar(), completar()]);

    expect(respuestas.map((r) => r.status).sort((a, b) => a - b)).toEqual([200, 409]);
    expect(await estadoDe(tarea.id)).toBe("COMPLETED");
  }, 180_000);
});

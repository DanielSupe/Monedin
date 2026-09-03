import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { resetAuthData } from "../support/auth.js";
import { fijarSaldo, sembrarPremio, valoresNumericos } from "../support/rewards.js";
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

    /*
     * El precio del hermano sigue sin aparecer.
     *
     * Esto comparaba contra `": 40"`, con espacio, sobre una cadena de
     * `JSON.stringify`, que NO pone espacio tras los dos puntos: la comprobación
     * no podía fallar nunca. Y su expresión regular recogía además `:43` y `:12`
     * de un instante, que es el falso positivo del que huía.
     *
     * Un precio es un número, así que se miran los números.
     */
    expect(valoresNumericos(escaparate.body.items)).not.toContain(40);
  }, 300_000);

  /*
   * Esto decía «el alta NO acepta foto: es 422» y ahora dice lo contrario.
   *
   * No es que la regla se relajara: lo que cambió es de qué cuelga una clave
   * todavía sin dueño. Antes tenía que llevar el `rewardId`, que no existe
   * mientras el premio se crea; ahora, al publicar, cuelga del PADRE. Lo que
   * sigue igual son las dos comprobaciones, y de eso van los tests de abajo.
   */
  it("el alta SÍ acepta una foto subida por su prefijo de padre", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);

    const url = await request(app)
      .post(`${API_PREFIX}/rewards/image/upload-url`)
      .set("Cookie", cookies)
      .send({ contentType: "image/jpeg" })
      .expect(200);

    expect(url.body.key).toContain(`rewards/pending/${parentId}/`);
    await subirConUrlFirmada(url.body.uploadUrl);

    const creado = await request(app)
      .post(`${API_PREFIX}/rewards`)
      .set("Cookie", cookies)
      .send({
        title: "Ir al cine",
        childIds: [hijos[0]!.id],
        coins: 200,
        imageUploadKey: url.body.key,
      });

    expect(creado.status).toBe(201);
    expect(creado.body.image).toMatch(/^https?:\/\//);
  }, 300_000);

  it("una clave inventada en el alta es 422 y NO crea el premio", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);

    // Prefijo correcto, pero detrás no hay ningún objeto: solo el prefijo
    // dejaría guardar una referencia rota.
    const response = await request(app)
      .post(`${API_PREFIX}/rewards`)
      .set("Cookie", cookies)
      .send({
        title: "Ir al cine",
        childIds: [hijos[0]!.id],
        coins: 200,
        imageUploadKey: `rewards/pending/${parentId}/${crypto.randomUUID()}.jpg`,
      });

    expect(response.status).toBe(422);

    const catalogo = await request(app).get(`${API_PREFIX}/rewards`).set("Cookie", cookies);
    expect(catalogo.body.total).toBe(0);
  }, 180_000);

  it("la clave de OTRO padre en el alta es 422 aunque exista, y NO crea el premio", async () => {
    // Correo propio: `familiaOperando` usa uno fijo por defecto y dos familias
    // en el mismo test chocarían con un 409 al registrar la segunda.
    const ajena = await familiaOperando(app, ["Zoe"], { email: "otra@ejemplo.dev" });
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);

    // Existe de verdad, pero es de otra familia: solo la existencia dejaría
    // publicar con la imagen de otro.
    const suya = `rewards/pending/${ajena.parentId}/${crypto.randomUUID()}.jpg`;
    await sembrarObjeto(suya);

    const response = await request(app)
      .post(`${API_PREFIX}/rewards`)
      .set("Cookie", cookies)
      .send({ title: "Ir al cine", childIds: [hijos[0]!.id], coins: 200, imageUploadKey: suya });

    expect(response.status).toBe(422);

    const catalogo = await request(app).get(`${API_PREFIX}/rewards`).set("Cookie", cookies);
    expect(catalogo.body.total).toBe(0);
  }, 300_000);

  it("un niño no obtiene la vía de subida del alta", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);

    const response = await request(app)
      .post(`${API_PREFIX}/rewards/image/upload-url`)
      .set("Cookie", hijos[0]!.cookies)
      .send({ contentType: "image/jpeg" });

    expect(response.status).toBe(403);
  }, 120_000);

  /*
   * La vía sin premio no se puede confundir con el detalle de un premio que se
   * llamara «image». Si `/rewards/:rewardId` la tapara, esto sería un 404 —
   * perfectamente plausible, que es lo que hace el fallo silencioso.
   */
  it("pedir la vía del alta no se interpreta como un premio llamado «image»", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const via = await request(app)
      .post(`${API_PREFIX}/rewards/image/upload-url`)
      .set("Cookie", cookies)
      .send({ contentType: "image/jpeg" });

    expect(via.status).toBe(200);
    expect(via.body.uploadUrl).toMatch(/^https?:\/\//);

    // Y el detalle de un premio inexistente sigue respondiendo lo suyo.
    const detalle = await request(app)
      .get(`${API_PREFIX}/rewards/image`)
      .set("Cookie", cookies);

    expect(detalle.status).toBe(404);
  }, 120_000);

  it("pedir la vía y no publicar no crea ningún premio", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    await request(app)
      .post(`${API_PREFIX}/rewards/image/upload-url`)
      .set("Cookie", cookies)
      .send({ contentType: "image/jpeg" })
      .expect(200);

    const catalogo = await request(app).get(`${API_PREFIX}/rewards`).set("Cookie", cookies);
    expect(catalogo.body.total).toBe(0);
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

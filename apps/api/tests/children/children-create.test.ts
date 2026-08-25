import { API_PREFIX, DEFAULT_AVATAR_KEY, ERROR_CODES, MAX_CHILDREN_PER_FAMILY } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { testPrisma } from "../support/database.js";
import {
  CREDENCIALES,
  asChild,
  asParent,
  createChildProfile,
  enterProfile,
  parentIdByEmail,
  registerParent,
  resetAuthData,
} from "../support/auth.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function crear(cookies: string[], body: Record<string, unknown>): request.Test {
  return request(app).post(`${API_PREFIX}/children`).set("Cookie", cookies).send(body);
}

describe("un hijo se crea desde la rejilla, sin haber elegido perfil", () => {
  it("se crea el primer hijo de la familia sin pedir el PIN de adulto", async () => {
    // `registerParent` deja la CUENTA acreditada y NINGÚN perfil activo: es
    // exactamente el estado de la rejilla.
    const { cookies } = await registerParent(app);

    const response = await crear(cookies, { name: "Mateo", pin: "1234" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: "Mateo", coins: 0, age: null });
    expect(response.body.id).toEqual(expect.any(String));
  }, 60_000);

  it("el hijo recién creado aparece en la rejilla", async () => {
    const { cookies } = await registerParent(app);

    await crear(cookies, { name: "Emma", pin: "5678" }).expect(201);

    const rejilla = await request(app).get(`${API_PREFIX}/auth/profiles`).set("Cookie", cookies);

    expect(rejilla.body.profiles.map((p: { name: string }) => p.name)).toContain("Emma");
  }, 60_000);

  it("el PIN elegido sirve para entrar acto seguido", async () => {
    const { cookies } = await registerParent(app);
    const creado = await crear(cookies, { name: "Mateo", pin: "1234" }).expect(201);

    // Si esto no lanza, el perfil quedó utilizable desde el primer momento.
    const conPerfil = await enterProfile(app, cookies, creado.body.id, "1234");

    const suyo = await request(app).get(`${API_PREFIX}/children/me`).set("Cookie", conPerfil);
    expect(suyo.status).toBe(200);
    expect(suyo.body.name).toBe("Mateo");
  }, 60_000);

  it("sin avatar sale el de por defecto, y con avatar el elegido", async () => {
    const { cookies } = await registerParent(app);

    const sin = await crear(cookies, { name: "Sin", pin: "1111" }).expect(201);
    const con = await crear(cookies, { name: "Con", pin: "2222", avatar: "zorro" }).expect(201);

    expect(sin.body.avatar).toBe(DEFAULT_AVATAR_KEY);
    expect(con.body.avatar).toBe("zorro");
  }, 60_000);

  it("acepta la edad dentro del rango del producto", async () => {
    const { cookies } = await registerParent(app);

    const response = await crear(cookies, { name: "Mateo", pin: "1234", age: 8 });

    expect(response.status).toBe(201);
    expect(response.body.age).toBe(8);
  }, 60_000);

  it("también se crea con el perfil del padre ya activo", async () => {
    const { cookies } = await asParent(app);

    await crear(cookies, { name: "Mateo", pin: "1234" }).expect(201);
  }, 60_000);

  it("el perfil nace dentro de la familia de la sesión, no de la petición", async () => {
    const nuestra = await registerParent(app);
    await registerParent(app, { email: "otra@monedin.test" });
    const otroId = await parentIdByEmail("otra@monedin.test");

    // `parentId` es un campo desconocido: el esquema es estricto.
    const response = await crear(nuestra.cookies, {
      name: "Mateo",
      pin: "1234",
      parentId: otroId,
    });

    expect(response.status).toBe(422);
    expect(await testPrisma().childProfile.count({ where: { parentId: otroId } })).toBe(0);
  }, 120_000);

  it("el alta no puede fijar el saldo inicial", async () => {
    // Si esto dejara de fallar, un alta que no pide PIN de adulto se
    // convertiría en una impresora de monedas.
    const { cookies } = await registerParent(app);

    const response = await crear(cookies, { name: "Mateo", pin: "1234", coins: 500 });

    expect(response.status).toBe(422);
  }, 60_000);
});

describe("crear un perfil exige cuenta, y no vale cualquiera que la traiga", () => {
  it("sin sesión de cuenta no se crea nada", async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/children`)
      .send({ name: "Mateo", pin: "1234" });

    expect(response.status).toBe(401);
    expect(await testPrisma().childProfile.count()).toBe(0);
  }, 60_000);

  it("un niño con perfil activo no puede crear hermanos", async () => {
    const { cookies, parentId } = await asChild(app);

    const response = await crear(cookies, { name: "Hermano inventado", pin: "9999" });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
    // Y no queda ninguna fila: se rechaza ANTES de escribir.
    expect(await testPrisma().childProfile.count({ where: { parentId } })).toBe(1);
  }, 120_000);
});

describe("una familia tiene un tope de hijos activos", () => {
  async function llenarFamilia(parentId: string, cuantos: number): Promise<void> {
    for (let i = 0; i < cuantos; i += 1) {
      await createChildProfile(parentId, { name: `Hijo ${i}`, pin: "1234" });
    }
  }

  it("alcanzar el tope da conflicto", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    await llenarFamilia(parentId, MAX_CHILDREN_PER_FAMILY);

    const response = await crear(cookies, { name: "Uno de más", pin: "1234" });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe(ERROR_CODES.CONFLICT);
    expect(response.body.message).toContain(String(MAX_CHILDREN_PER_FAMILY));
  }, 180_000);

  it("dar de baja libera un hueco", async () => {
    const { cookies, accountCookies } = await asParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    await llenarFamilia(parentId, MAX_CHILDREN_PER_FAMILY);

    const alguno = await testPrisma().childProfile.findFirstOrThrow({
      where: { parentId },
      select: { id: true },
    });
    await request(app)
      .delete(`${API_PREFIX}/children/${alguno.id}`)
      .set("Cookie", cookies)
      .expect(204);

    // Con el hueco libre, el alta vuelve a funcionar desde la rejilla.
    await crear(accountCookies, { name: "El que entra", pin: "1234" }).expect(201);
  }, 180_000);

  it("los hijos dados de baja no cuentan para el tope", async () => {
    const { cookies } = await asParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    await llenarFamilia(parentId, MAX_CHILDREN_PER_FAMILY);

    const todos = await testPrisma().childProfile.findMany({
      where: { parentId },
      select: { id: true },
      take: 3,
    });
    for (const hijo of todos) {
      await request(app).delete(`${API_PREFIX}/children/${hijo.id}`).set("Cookie", cookies);
    }

    // Tres bajas, tres huecos.
    for (let i = 0; i < 3; i += 1) {
      await crear(cookies, { name: `Nuevo ${i}`, pin: "1234" }).expect(201);
    }
  }, 180_000);

  it("el tope de una familia no afecta a otra", async () => {
    const nuestra = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    await llenarFamilia(parentId, MAX_CHILDREN_PER_FAMILY);
    await crear(nuestra.cookies, { name: "De más", pin: "1234" }).expect(409);

    const otra = await registerParent(app, { email: "otra@monedin.test" });

    await crear(otra.cookies, { name: "De otra familia", pin: "1234" }).expect(201);
  }, 180_000);
});

describe("el alta valida la entrada antes de tocar nada", () => {
  it("señala todos los campos que fallan de una vez", async () => {
    const { cookies } = await registerParent(app);

    const response = await crear(cookies, { name: "A", pin: "abc", age: 99 });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    const campos = response.body.details.map((d: { field: string }) => d.field);
    expect(campos).toContain("name");
    expect(campos).toContain("pin");
    expect(campos).toContain("age");
  }, 60_000);

  it("rechaza un avatar que no está en el catálogo", async () => {
    const { cookies } = await registerParent(app);

    const response = await crear(cookies, { name: "Mateo", pin: "1234", avatar: "dragon" });

    expect(response.status).toBe(422);
  }, 60_000);

  it("no filtra el PIN ni datos internos en la respuesta", async () => {
    const { cookies } = await registerParent(app);

    const response = await crear(cookies, { name: "Mateo", pin: "1234" }).expect(201);
    const cuerpo = JSON.stringify(response.body);

    expect(cuerpo).not.toContain("pinHash");
    expect(cuerpo).not.toContain("1234");
    expect(cuerpo).not.toContain("parentId");
    expect(cuerpo).not.toContain("deletedAt");
    expect(cuerpo).not.toContain("failedPinAttempts");
  }, 60_000);
});

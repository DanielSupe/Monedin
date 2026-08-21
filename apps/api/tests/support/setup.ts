import { afterAll, beforeAll } from "vitest";
import { setPrismaForTests } from "../../src/shared/database/client.js";
import { closeTestPrisma, testPrisma } from "./database.js";

/**
 * Apunta el cliente de la APLICACIÓN a la base de datos de tests.
 *
 * Sin esto, los tests que llaman a la app con supertest escribirían en la base
 * de DESARROLLO: la app construye su cliente desde `DATABASE_URL`, no desde
 * `TEST_DATABASE_URL`. Es el tipo de fallo que no se nota hasta que faltan
 * datos con los que se estaba trabajando.
 */
beforeAll(() => {
  setPrismaForTests(testPrisma());
});

afterAll(async () => {
  setPrismaForTests(undefined);
  await closeTestPrisma();
});

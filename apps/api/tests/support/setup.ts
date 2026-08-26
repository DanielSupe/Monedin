import { afterAll, beforeAll } from "vitest";
import { setPrismaForTests } from "../../src/shared/database/client.js";
import { setStorageProviderForTests } from "../../src/shared/storage/index.js";
import { closeTestPrisma, testPrisma } from "./database.js";
import { closeTestS3, testStorageProvider } from "./storage.js";

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
  // Lo mismo para el almacén: sin esto, un test que sube una foto la dejaría en
  // el bucket de DESARROLLO, que es el que la app construye desde su config.
  setStorageProviderForTests(testStorageProvider());
});

afterAll(async () => {
  setPrismaForTests(undefined);
  setStorageProviderForTests(undefined);
  closeTestS3();
  await closeTestPrisma();
});

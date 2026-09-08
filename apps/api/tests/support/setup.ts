import { afterAll, beforeAll } from "vitest";
import { setAiProviderForTests } from "../../src/shared/ai/index.js";
import { setPrismaForTests } from "../../src/shared/database/client.js";
import { setStorageProviderForTests } from "../../src/shared/storage/index.js";
import { espiaIA } from "./ai.js";
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
  /*
   * Y el proveedor de IA, que es el caso MÁS fuerte de los tres: los otros dos
   * apuntan a una copia local, y este SUSTITUYE el servicio entero.
   *
   * Va aquí, en el arranque global, y no test a test: así ningún test puede
   * llamar a Google por descuido, ni siquiera uno escrito mañana por quien no
   * leyó esto. Un test que necesite otra respuesta la pide al espía; ninguno
   * necesita quitarlo.
   */
  setAiProviderForTests(espiaIA());
});

afterAll(async () => {
  setPrismaForTests(undefined);
  setStorageProviderForTests(undefined);
  setAiProviderForTests(undefined);
  closeTestS3();
  await closeTestPrisma();
});

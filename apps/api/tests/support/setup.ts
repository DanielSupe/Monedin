import { afterAll, beforeAll } from "vitest";
import { setAiProviderForTests } from "../../src/shared/ai/index.js";
import { setPrismaForTests } from "../../src/shared/database/client.js";
import { setStorageProviderForTests } from "../../src/shared/storage/index.js";
import { espiaIA } from "./ai.js";
import { closeTestPrisma, testPrisma } from "./database.js";
import { closeTestS3, testStorageProvider } from "./storage.js";

beforeAll(() => {
  setPrismaForTests(testPrisma());

  setStorageProviderForTests(testStorageProvider());

  setAiProviderForTests(espiaIA());
});

afterAll(async () => {
  setPrismaForTests(undefined);
  setStorageProviderForTests(undefined);
  setAiProviderForTests(undefined);
  closeTestS3();
  await closeTestPrisma();
});

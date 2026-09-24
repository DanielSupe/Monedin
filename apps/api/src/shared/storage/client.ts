import { getConfig } from "../../config/index.js";
import type { StorageProvider } from "./provider.js";
import { S3StorageProvider } from "./s3-provider.js";

let provider: StorageProvider | undefined;

function createProvider(): StorageProvider {
  const { S3_BUCKET_NAME, S3_REGION, S3_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } =
    getConfig();

  return new S3StorageProvider({
    bucket: S3_BUCKET_NAME,
    region: S3_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    endpoint: S3_ENDPOINT,
  });
}

export function getStorageProvider(): StorageProvider {
  provider ??= createProvider();
  return provider;
}

export function setStorageProviderForTests(replacement: StorageProvider | undefined): void {
  provider = replacement;
}

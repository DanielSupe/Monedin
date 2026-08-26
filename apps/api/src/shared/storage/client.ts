import { getConfig } from "../../config/index.js";
import type { StorageProvider } from "./provider.js";
import { S3StorageProvider } from "./s3-provider.js";

/**
 * El almacén de archivos.
 *
 * ÚNICO lugar del proyecto que lo construye, igual que `getPrisma()` con la
 * base de datos, y perezoso por la misma razón: nada de esto se monta hasta que
 * alguien sube o lee una imagen, así que arrancar la API no depende de que el
 * almacén esté disponible.
 *
 * La configuración sale ya validada de `getConfig()`. Este archivo NO lee el
 * entorno, y por eso no hace falta añadir nada a `allowEnvAccess()` en la
 * configuración de ESLint.
 */

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

/** Devuelve el almacén, construyéndolo la primera vez. */
export function getStorageProvider(): StorageProvider {
  provider ??= createProvider();
  return provider;
}

/** Solo para tests: sustituye el almacén por uno apuntado al bucket de pruebas. */
export function setStorageProviderForTests(replacement: StorageProvider | undefined): void {
  provider = replacement;
}

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getConfig } from "../../src/config/index.js";
import { S3StorageProvider } from "../../src/shared/storage/index.js";

/**
 * Acceso al almacén de tests.
 *
 * Contra MinIO de verdad, no contra un doble, por la misma razón por la que los
 * tests de datos corren contra PostgreSQL real: lo que hay que probar es que una
 * firma atada a un tipo rechaza otro, que una URL caduca y que `HeadObject`
 * responde 404 sobre lo que no existe. Un doble diría que sí a todo. Ver la
 * decisión 8 del design de `add-file-storage`.
 */

let client: S3Client | undefined;

/**
 * El bucket de pruebas, con las DOS comprobaciones que impiden borrar datos de
 * verdad.
 *
 * La batería VACÍA este bucket en su arranque, así que equivocarse aquí es la
 * única forma de perder algo irrecuperable con este módulo. Por eso no basta
 * con que el nombre sea distinto del de desarrollo:
 *
 *   1. Distinto nombre que `S3_BUCKET_NAME`.
 *   2. Detrás de un endpoint PROPIO. Desarrollo puede apuntar al S3 real
 *      dejando `S3_ENDPOINT` vacía; los tests no tienen forma de hacerlo,
 *      porque `TEST_S3_ENDPOINT` no admite vacío. Sin esta segunda, pasar
 *      desarrollo a AWS arrastraría a los tests y la primera pasada vaciaría un
 *      bucket real.
 */
export function testBucket(): string {
  const config = getConfig();

  if (config.TEST_S3_BUCKET_NAME === config.S3_BUCKET_NAME) {
    throw new Error(
      "TEST_S3_BUCKET_NAME y S3_BUCKET_NAME apuntan al mismo bucket. " +
        "La batería VACÍA su bucket entre pasadas: con el de desarrollo, borraría " +
        "las fotos con las que se está trabajando.",
    );
  }

  return config.TEST_S3_BUCKET_NAME;
}

/** El endpoint de los tests. Siempre uno propio, nunca el S3 real. */
function testEndpoint(): string {
  return getConfig().TEST_S3_ENDPOINT;
}

export function testS3Client(): S3Client {
  const config = getConfig();

  client ??= new S3Client({
    region: config.S3_REGION,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
    endpoint: testEndpoint(),
    forcePathStyle: true,
  });

  return client;
}

/** El almacén de la APLICACIÓN, apuntado al bucket de pruebas. */
export function testStorageProvider(): S3StorageProvider {
  const config = getConfig();

  return new S3StorageProvider({
    bucket: testBucket(),
    region: config.S3_REGION,
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    endpoint: testEndpoint(),
  });
}

/**
 * Coloca un objeto directamente, sin pasar por la URL firmada.
 *
 * Es el equivalente a `sembrarTarea`: prepara el estado que el test necesita sin
 * recorrer el flujo que lo llevaría hasta ahí. Para probar el flujo ENTERO está
 * `subirConUrlFirmada`.
 */
export async function sembrarObjeto(
  key: string,
  contentType = "image/jpeg",
  body = "una-foto-de-mentira",
): Promise<void> {
  await testS3Client().send(
    new PutObjectCommand({
      Bucket: testBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/** Sube de verdad contra una URL firmada, como haría el navegador. */
export async function subirConUrlFirmada(
  uploadUrl: string,
  contentType = "image/jpeg",
  body = "una-foto-de-mentira",
): Promise<Response> {
  return fetch(uploadUrl, {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType },
  });
}

/** Si un objeto está en el bucket de pruebas. */
export async function existeObjeto(key: string): Promise<boolean> {
  const listado = await testS3Client().send(
    new ListObjectsV2Command({ Bucket: testBucket(), Prefix: key }),
  );

  return (listado.Contents ?? []).some((objeto) => objeto.Key === key);
}

/** Cuántos objetos hay bajo un prefijo. Para comprobar que no se duplican. */
export async function cuantosObjetos(prefix: string): Promise<number> {
  const listado = await testS3Client().send(
    new ListObjectsV2Command({ Bucket: testBucket(), Prefix: prefix }),
  );

  return (listado.Contents ?? []).length;
}

/**
 * Vacía el bucket de pruebas.
 *
 * El equivalente de `resetAuthData()` para el almacén. Se llama una vez antes de
 * la batería: los tests no comparten claves —cada una lleva un identificador
 * dentro— así que no hace falta vaciarlo entre casos.
 */
export async function vaciarBucketDeTests(): Promise<void> {
  const bucket = testBucket();
  const s3 = testS3Client();

  let continuationToken: string | undefined;

  do {
    const listado = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ...(continuationToken === undefined ? {} : { ContinuationToken: continuationToken }),
      }),
    );

    const objetos = (listado.Contents ?? []).flatMap((objeto) =>
      objeto.Key === undefined ? [] : [{ Key: objeto.Key }],
    );

    if (objetos.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objetos } }),
      );
    }

    continuationToken = listado.IsTruncated === true ? listado.NextContinuationToken : undefined;
  } while (continuationToken !== undefined);
}

export function closeTestS3(): void {
  client?.destroy();
  client = undefined;
}

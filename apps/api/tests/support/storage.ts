import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getConfig } from "../../src/config/index.js";
import { S3StorageProvider } from "../../src/shared/storage/index.js";

let client: S3Client | undefined;

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

function testEndpoint(): string {
  return getConfig().TEST_S3_ENDPOINT;
}

export function testS3Client(): S3Client {
  const config = getConfig();

  client ??= new S3Client({
    region: config.S3_REGION,

    credentials: {
      accessKeyId: config.TEST_AWS_ACCESS_KEY_ID,
      secretAccessKey: config.TEST_AWS_SECRET_ACCESS_KEY,
    },
    endpoint: testEndpoint(),
    forcePathStyle: true,
  });

  return client;
}

export function testStorageProvider(): S3StorageProvider {
  const config = getConfig();

  return new S3StorageProvider({
    bucket: testBucket(),
    region: config.S3_REGION,

    accessKeyId: config.TEST_AWS_ACCESS_KEY_ID,
    secretAccessKey: config.TEST_AWS_SECRET_ACCESS_KEY,
    endpoint: testEndpoint(),
  });
}

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

export async function existeObjeto(key: string): Promise<boolean> {
  const listado = await testS3Client().send(
    new ListObjectsV2Command({ Bucket: testBucket(), Prefix: key }),
  );

  return (listado.Contents ?? []).some((objeto) => objeto.Key === key);
}

export async function cuantosObjetos(prefix: string): Promise<number> {
  const listado = await testS3Client().send(
    new ListObjectsV2Command({ Bucket: testBucket(), Prefix: prefix }),
  );

  return (listado.Contents ?? []).length;
}

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

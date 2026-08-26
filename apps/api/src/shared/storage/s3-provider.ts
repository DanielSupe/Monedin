import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  READ_URL_TTL_SECONDS,
  UPLOAD_URL_TTL_SECONDS,
  type StorageProvider,
} from "./provider.js";

/**
 * El almacén, sobre S3.
 *
 * Habla igual con el S3 real de AWS y con cualquier cosa que hable su
 * protocolo: en desarrollo y en tests apunta a MinIO cambiando solo el
 * `endpoint`. Ver la decisión 8 del design de `add-file-storage`.
 */

export interface S3StorageOptions {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Vacío en producción: el S3 real de AWS. Con valor, un S3-compatible propio. */
  endpoint?: string | undefined;
}

export class S3StorageProvider implements StorageProvider {
  readonly #client: S3Client;
  readonly #bucket: string;

  constructor(options: S3StorageOptions) {
    this.#bucket = options.bucket;
    this.#client = new S3Client({
      region: options.region,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      ...(options.endpoint === undefined
        ? {}
        : {
            endpoint: options.endpoint,
            // Con un endpoint propio, la dirección tiene que ser
            // `endpoint/bucket/clave` y no `bucket.endpoint/clave`: el estilo de
            // subdominio exige un DNS comodín que un MinIO local no tiene.
            forcePathStyle: true,
          }),
    });
  }

  async createUploadUrl({
    key,
    contentType,
  }: {
    key: string;
    contentType: string;
  }): Promise<{ uploadUrl: string; expiresAt: Date }> {
    const command = new PutObjectCommand({
      Bucket: this.#bucket,
      Key: key,
      ContentType: contentType,
    });

    // `signableHeaders` no es opcional aquí, aunque el comando ya lleve el
    // `ContentType`: sin esto el firmante solo incluye `host` en
    // `X-Amz-SignedHeaders`, la firma no cubre el tipo, y una URL emitida para
    // una imagen sirve para subir CUALQUIER cosa —un ejecutable, un HTML—.
    // Forzarlo dentro de la firma es lo que hace que el almacén, y no la
    // aplicación, rechace un tipo distinto del que se pidió.
    const uploadUrl = await getSignedUrl(this.#client, command, {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
      signableHeaders: new Set(["content-type"]),
    });

    return {
      uploadUrl,
      expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
    };
  }

  createReadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.#bucket, Key: key });

    return getSignedUrl(this.#client, command, { expiresIn: READ_URL_TTL_SECONDS });
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.#client.send(new HeadObjectCommand({ Bucket: this.#bucket, Key: key }));
      return true;
    } catch (error) {
      // Que no esté es una respuesta, no un fallo: quien pregunta lo hace justo
      // para decidir. Cualquier otro error —permisos, red, bucket inexistente—
      // sube tal cual, porque responder `false` ahí haría pasar un problema de
      // infraestructura por «el usuario no subió la foto».
      if (isNotFound(error)) return false;
      throw error;
    }
  }
}

/** Un 404 del almacén, en cualquiera de las formas en que el SDK lo presenta. */
function isNotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as {
    name?: unknown;
    $metadata?: { httpStatusCode?: unknown };
  };

  if (candidate.name === "NotFound" || candidate.name === "NoSuchKey") return true;

  return candidate.$metadata?.httpStatusCode === 404;
}

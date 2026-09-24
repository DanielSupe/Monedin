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

export interface S3StorageOptions {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;

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
      if (isNotFound(error)) return false;
      throw error;
    }
  }
}

function isNotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as {
    name?: unknown;
    $metadata?: { httpStatusCode?: unknown };
  };

  if (candidate.name === "NotFound" || candidate.name === "NoSuchKey") return true;

  return candidate.$metadata?.httpStatusCode === 404;
}

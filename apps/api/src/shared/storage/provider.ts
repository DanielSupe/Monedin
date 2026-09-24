export interface StorageProvider {
  createUploadUrl(params: {
    key: string;
    contentType: string;
  }): Promise<{ uploadUrl: string; expiresAt: Date }>;

  createReadUrl(key: string): Promise<string>;

  objectExists(key: string): Promise<boolean>;
}

export const UPLOAD_URL_TTL_SECONDS = 300;

export const READ_URL_TTL_SECONDS = 3600;

import { messages } from "./messages.js";

export class UploadError extends Error {
  constructor(message: string = messages.uploads.failed) {
    super(message);
    this.name = "UploadError";
  }
}

export async function putToUploadUrl(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": contentType },
    });
  } catch {
    throw new UploadError(messages.uploads.network);
  }

  if (!response.ok) {
    throw new UploadError();
  }
}

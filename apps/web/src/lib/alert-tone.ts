import { ERROR_CODES } from "@monedin/contracts";
import type { AlertTone } from "../ui/index.js";
import { ApiRequestError } from "./http-client.js";

export function alertToneFor(error: unknown): AlertTone {
  if (!(error instanceof ApiRequestError)) {
    return "danger";
  }

  if (error.code === ERROR_CODES.CONFLICT || error.code === ERROR_CODES.SERVICE_UNAVAILABLE) {
    return "conflict";
  }

  return "danger";
}

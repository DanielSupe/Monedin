import type { HealthResponse } from "@monedin/contracts";
import { messages } from "../../shared/messages/index.js";
import { findServiceIdentity } from "./health.repository.js";

export function getHealth(): HealthResponse {
  const identity = findServiceIdentity();

  return {
    status: "ok",
    service: messages.health.serviceName,
    version: identity.version,
  };
}

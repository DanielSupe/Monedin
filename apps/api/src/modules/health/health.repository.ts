import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

interface PackageManifest {
  version?: string;
}

export interface ServiceIdentity {
  version: string;
}

export function findServiceIdentity(): ServiceIdentity {
  const manifest = require("../../../package.json") as PackageManifest;
  return { version: manifest.version ?? "0.0.0" };
}

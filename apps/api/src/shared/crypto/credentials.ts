import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

type ScryptAsync = (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const scryptAsync = promisify(scrypt) as unknown as ScryptAsync;

const CURRENT_PARAMS = { N: 16_384, r: 8, p: 1 } as const;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

function maxmemFor(params: { N: number; r: number }): number {
  return 256 * params.N * params.r;
}

interface ParsedHash {
  params: { N: number; r: number; p: number };
  salt: Buffer;
  derivedKey: Buffer;
}

function format(params: typeof CURRENT_PARAMS, salt: Buffer, derivedKey: Buffer): string {
  return [
    "scrypt",
    `N=${params.N},r=${params.r},p=${params.p}`,
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$");
}

function parse(stored: string): ParsedHash | undefined {
  const parts = stored.split("$");
  if (parts.length !== 4) return undefined;

  const [algorithm, rawParams, rawSalt, rawKey] = parts;
  if (algorithm !== "scrypt") return undefined;

  const params: Record<string, number> = {};
  for (const pair of (rawParams ?? "").split(",")) {
    const [key, value] = pair.split("=");
    if (key === undefined || value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
    params[key] = parsed;
  }

  const { N, r, p } = params;
  if (N === undefined || r === undefined || p === undefined) return undefined;

  try {
    return {
      params: { N, r, p },
      salt: Buffer.from(rawSalt ?? "", "base64"),
      derivedKey: Buffer.from(rawKey ?? "", "base64"),
    };
  } catch {
    return undefined;
  }
}

async function derive(
  credential: string,
  salt: Buffer,
  params: { N: number; r: number; p: number },
  keyLength: number,
): Promise<Buffer> {
  return scryptAsync(credential.normalize("NFKC"), salt, keyLength, {
    ...params,
    maxmem: maxmemFor(params),
  });
}

export async function hashCredential(credential: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await derive(credential, salt, CURRENT_PARAMS, KEY_BYTES);

  return format(CURRENT_PARAMS, salt, derivedKey);
}

export interface VerificationResult {
  valid: boolean;

  needsRehash: boolean;
}

export async function verifyCredential(
  credential: string,
  stored: string,
): Promise<VerificationResult> {
  const parsed = parse(stored);

  if (parsed === undefined) {
    return { valid: false, needsRehash: false };
  }

  const candidate = await derive(credential, parsed.salt, parsed.params, parsed.derivedKey.length);

  const valid =
    candidate.length === parsed.derivedKey.length &&
    timingSafeEqual(candidate, parsed.derivedKey);

  return { valid, needsRehash: valid && usesOutdatedParams(parsed.params) };
}

function usesOutdatedParams(params: { N: number; r: number; p: number }): boolean {
  return (
    params.N !== CURRENT_PARAMS.N || params.r !== CURRENT_PARAMS.r || params.p !== CURRENT_PARAMS.p
  );
}

export async function hashCredentialWithParamsForTests(
  credential: string,
  params: { N: number; r: number; p: number },
): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await derive(credential, salt, params, KEY_BYTES);

  return format(params as typeof CURRENT_PARAMS, salt, derivedKey);
}

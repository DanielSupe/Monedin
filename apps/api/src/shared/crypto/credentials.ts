import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Hash y verificación de credenciales: contraseñas de padre y PIN de niño.
 *
 * Usa `scrypt` de la biblioteca estándar, no Argon2id. Argon2id sería la
 * elección por defecto de la industria, pero exige un binario nativo y este
 * proyecto ya perdió media tarde con un antivirus impidiendo escribir
 * exactamente eso. Descubrirlo en el servidor, y con la pieza que hashea
 * contraseñas, no compensa. `scrypt` es memory-hard, que es la propiedad que
 * importa. Ver la decisión 2 del design de `add-authentication`.
 *
 * SIEMPRE asíncrono: un hash tarda del orden de 100 ms a propósito, y hacerlo
 * síncrono congelaría el servidor entero en cada acceso.
 */

/**
 * `promisify` se queda con la primera sobrecarga de `scrypt`, que no admite
 * opciones. Como aquí sí hacen falta (los parámetros y `maxmem`), se declara el
 * tipo de forma explícita.
 */
type ScryptAsync = (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const scryptAsync = promisify(scrypt) as unknown as ScryptAsync;

/**
 * Parámetros actuales.
 *
 * `N` es el coste; subirlo dobla el trabajo y la memoria. Se guardan DENTRO de
 * cada hash para poder subirlos sin invalidar las credenciales existentes.
 */
const CURRENT_PARAMS = { N: 16_384, r: 8, p: 1 } as const;

/** Longitud de la sal y de la derivación, en bytes. */
const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * `maxmem` por defecto de Node no llega para N=16384 con r=8; hay que pedirlo
 * explícitamente o `scrypt` falla con un error de memoria.
 */
function maxmemFor(params: { N: number; r: number }): number {
  return 256 * params.N * params.r;
}

interface ParsedHash {
  params: { N: number; r: number; p: number };
  salt: Buffer;
  derivedKey: Buffer;
}

/**
 * Formato almacenado: `scrypt$N=...,r=...,p=...$<sal>$<derivación>`.
 *
 * Guardar los parámetros junto al hash es lo que permite subirlos más adelante
 * sin obligar a nadie a restablecer su contraseña, y deja preparado el cambio a
 * otro algoritmo: el prefijo dice cuál es.
 */
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

/** Deriva una credencial con una sal y unos parámetros dados. */
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

/**
 * Hashea una credencial con los parámetros actuales.
 *
 * Dos credenciales idénticas producen hashes distintos, porque cada una lleva
 * su propia sal aleatoria.
 */
export async function hashCredential(credential: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await derive(credential, salt, CURRENT_PARAMS, KEY_BYTES);

  return format(CURRENT_PARAMS, salt, derivedKey);
}

export interface VerificationResult {
  /** Si la credencial es correcta. */
  valid: boolean;
  /**
   * Si el hash almacenado usa parámetros antiguos y conviene rehashearlo.
   *
   * Solo tiene sentido actuar sobre esto cuando `valid` es cierto: es el único
   * momento en que se tiene la credencial en claro para volver a derivarla.
   */
  needsRehash: boolean;
}

/**
 * Verifica una credencial contra su hash almacenado.
 *
 * La comparación es en tiempo constante: comparar con `===` filtraría, por lo
 * que tarda en encontrar la primera diferencia, información sobre el valor
 * correcto.
 */
export async function verifyCredential(
  credential: string,
  stored: string,
): Promise<VerificationResult> {
  const parsed = parse(stored);

  // Un hash ilegible no es una credencial válida, y no debe reventar el acceso.
  if (parsed === undefined) {
    return { valid: false, needsRehash: false };
  }

  const candidate = await derive(credential, parsed.salt, parsed.params, parsed.derivedKey.length);

  // `timingSafeEqual` exige longitudes iguales; si difieren, no coincide.
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

/**
 * Solo para tests: hashea con parámetros distintos de los actuales, para poder
 * comprobar que una credencial antigua sigue verificando y se marca para
 * rehash.
 */
export async function hashCredentialWithParamsForTests(
  credential: string,
  params: { N: number; r: number; p: number },
): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await derive(credential, salt, params, KEY_BYTES);

  return format(params as typeof CURRENT_PARAMS, salt, derivedKey);
}

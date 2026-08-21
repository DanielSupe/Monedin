import { createHash, randomBytes } from "node:crypto";

/**
 * Identificadores de sesión.
 *
 * El identificador viaja en la cookie; lo que se guarda es su SHA-256. Que se
 * hashee es menos habitual que hashear contraseñas y es deliberado: una copia
 * de la base de datos —una réplica, un volcado, una consulta en Adminer— no
 * debe bastar para suplantar a nadie. Ver la decisión 3 del design de
 * `add-authentication`.
 *
 * Aquí NO hace falta un hash lento como el de las credenciales: el
 * identificador ya tiene 256 bits de entropía y no hay diccionario que probar.
 * SHA-256 sobra y no añade latencia a cada petición.
 */

/** 32 bytes: 256 bits de entropía. */
const TOKEN_BYTES = 32;

/** Genera un identificador de sesión nuevo, impredecible. */
export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Deriva lo que se almacena a partir del identificador. Nunca al revés. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

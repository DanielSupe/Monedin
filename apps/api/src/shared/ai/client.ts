import { getConfig } from "../../config/index.js";
import { GeminiProvider } from "./gemini-provider.js";
import { AI_MODEL, AI_REQUEST_TIMEOUT_MS, type AiProvider } from "./provider.js";

/**
 * El proveedor de IA.
 *
 * ÚNICO lugar del proyecto que lo construye, igual que `getPrisma()` con la
 * base de datos y `getStorageProvider()` con el almacén, y perezoso por la
 * misma razón: nada de esto se monta hasta que alguien pregunta algo, así que
 * arrancar la API no depende de que Google esté disponible.
 *
 * La configuración sale ya validada de `getConfig()`. Este archivo NO lee el
 * entorno, y por eso `allowEnvAccess()` sigue con sus dos entradas de siempre.
 */

let provider: AiProvider | undefined;

function createProvider(): AiProvider {
  const { GEMINI_API_KEY } = getConfig();

  return new GeminiProvider({
    apiKey: GEMINI_API_KEY,
    model: AI_MODEL,
    timeoutMs: AI_REQUEST_TIMEOUT_MS,
  });
}

/** Devuelve el proveedor, construyéndolo la primera vez. */
export function getAiProvider(): AiProvider {
  provider ??= createProvider();
  return provider;
}

/**
 * Solo para tests: sustituye el proveedor por un doble.
 *
 * La batería lo instala en su `beforeAll` GLOBAL, no test a test. Esa
 * diferencia con el almacén es deliberada: aquel se prueba contra MinIO real
 * porque lo que hay que probar son propiedades del proveedor —que una firma
 * rechaza otro tipo, que una URL caduca—, y un doble diría que sí a todo. Aquí
 * lo que hay que probar es qué mandamos y qué hacemos con lo que vuelve, que es
 * propiedad de NUESTRO código; y la respuesta de un modelo no es determinista,
 * así que un proveedor real ni siquiera podría sostener una aserción.
 *
 * Instalado globalmente, ningún test puede llamar a Google por descuido — ni
 * siquiera uno escrito mañana por quien no leyó esto. Ver la decisión 4 del
 * design de `add-family-assistant`.
 */
export function setAiProviderForTests(replacement: AiProvider | undefined): void {
  provider = replacement;
}

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { getConfig } from "../../config/index.js";
import { logger } from "../logger/index.js";

/**
 * Cliente de base de datos.
 *
 * ÚNICO lugar del proyecto que lo construye. La regla de que solo los archivos
 * de repositorio pueden importarlo la hace cumplir una regla de ESLint; ver la
 * spec `data-access`.
 *
 * Prisma 7 exige un *driver adapter* explícito: el cliente ya no abre la
 * conexión por su cuenta a partir de una URL en el schema. Ver la decisión 6 del
 * design de `add-data-model`.
 */

let client: PrismaClient | undefined;

function createClient(): PrismaClient {
  // La conexión sale de la configuración YA validada. Nadie vuelve a
  // comprobarla aquí: si estuviera mal, el proceso no habría llegado a arrancar.
  const { DATABASE_URL } = getConfig();

  const adapter = new PrismaPg({ connectionString: DATABASE_URL });

  return new PrismaClient({ adapter });
}

/** Devuelve el cliente, creándolo la primera vez. */
export function getPrisma(): PrismaClient {
  client ??= createClient();
  return client;
}

/**
 * Cierra la conexión.
 *
 * Se llama al recibir la señal de terminación, para no dejar conexiones colgadas
 * en cada despliegue.
 */
export async function disconnectPrisma(): Promise<void> {
  if (client === undefined) return;

  const closing = client;
  client = undefined;
  await closing.$disconnect();
}

/**
 * Ejecuta el cierre ordenado.
 *
 * El orden importa: primero se deja de aceptar peticiones, después se cierra la
 * base de datos. Al revés, una petición en vuelo se encontraría sin conexión.
 *
 * Separado de la suscripción a señales para poder probarlo sin matar el proceso
 * de los tests.
 */
export async function performShutdown(stopAcceptingRequests: () => Promise<void>): Promise<void> {
  await stopAcceptingRequests();
  await disconnectPrisma();
}

/**
 * Suscribe el cierre ordenado a las señales de terminación.
 *
 * Devuelve una función que deshace la suscripción.
 */
export function registerGracefulShutdown(stopAcceptingRequests: () => Promise<void>): () => void {
  let shuttingDown = false;

  const handler = (signal: NodeJS.Signals): void => {
    // Una segunda señal mientras se está cerrando no reinicia el proceso.
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`Señal ${signal} recibida, cerrando de forma ordenada`);

    void (async (): Promise<void> => {
      try {
        await performShutdown(stopAcceptingRequests);
        logger.info("Cierre completado");
        process.exit(0);
      } catch (error) {
        logger.error("Fallo durante el cierre ordenado", {
          error: error instanceof Error ? error.message : error,
        });
        process.exit(1);
      }
    })();
  };

  const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
  for (const signal of signals) {
    process.on(signal, handler);
  }

  return () => {
    for (const signal of signals) {
      process.off(signal, handler);
    }
  };
}

/** Solo para tests: sustituye el cliente por uno controlado por el test. */
export function setPrismaForTests(replacement: PrismaClient | undefined): void {
  client = replacement;
}

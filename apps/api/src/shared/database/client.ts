import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { getConfig } from "../../config/index.js";
import { logger } from "../logger/index.js";

let client: PrismaClient | undefined;

function createClient(): PrismaClient {
  const { DATABASE_URL } = getConfig();

  const adapter = new PrismaPg({ connectionString: DATABASE_URL });

  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  client ??= createClient();
  return client;
}

export async function disconnectPrisma(): Promise<void> {
  if (client === undefined) return;

  const closing = client;
  client = undefined;
  await closing.$disconnect();
}

export async function performShutdown(stopAcceptingRequests: () => Promise<void>): Promise<void> {
  await stopAcceptingRequests();
  await disconnectPrisma();
}

export function registerGracefulShutdown(stopAcceptingRequests: () => Promise<void>): () => void {
  let shuttingDown = false;

  const handler = (signal: NodeJS.Signals): void => {
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

export function setPrismaForTests(replacement: PrismaClient | undefined): void {
  client = replacement;
}

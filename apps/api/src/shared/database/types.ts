import type { PrismaClient } from "../../generated/prisma/client.js";

/**
 * Cliente dentro de una transacción.
 *
 * Tiene la misma superficie que el cliente normal salvo la capacidad de abrir
 * otra transacción. Los repositorios lo reciben cuando su operación forma parte
 * de una unidad mayor.
 */
export type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

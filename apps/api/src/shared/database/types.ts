import type { PrismaClient } from "../../generated/prisma/client.js";

export type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

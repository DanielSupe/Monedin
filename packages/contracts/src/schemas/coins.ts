import { z } from "zod";
import { COIN_REASONS } from "../constants/domain.js";
import { childIdSchema } from "./coins-per-child.js";
import { pageOf, paginationQuerySchema } from "./pagination.js";

export const coinReasonSchema = z.enum(COIN_REASONS);

export const listOwnCoinsQuerySchema = paginationQuerySchema.strict();
export type ListOwnCoinsQuery = z.infer<typeof listOwnCoinsQuerySchema>;

export const listCoinsQuerySchema = paginationQuerySchema.strict();
export type ListCoinsQuery = z.infer<typeof listCoinsQuerySchema>;

export const coinsParamsSchema = z.object({ childId: childIdSchema }).strict();
export type CoinsParams = z.infer<typeof coinsParamsSchema>;

export const coinTransactionSchema = z.object({
  id: z.string(),

  amount: z.number().int(),

  balanceAfter: z.number().int(),
  reason: coinReasonSchema,
  createdAt: z.string().datetime(),
  taskId: z.string().nullable(),
  redemptionId: z.string().nullable(),
});

export type CoinTransaction = z.infer<typeof coinTransactionSchema>;

export const coinTransactionsPageSchema = pageOf(coinTransactionSchema);
export type CoinTransactionsPage = z.infer<typeof coinTransactionsPageSchema>;

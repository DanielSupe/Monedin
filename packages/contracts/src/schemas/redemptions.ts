import { z } from "zod";
import { REDEMPTION_STATUSES } from "../constants/domain.js";
import { avatarKeySchema } from "./avatar.js";
import { childIdSchema, coinsAmountSchema } from "./coins-per-child.js";
import { pageOf, paginationQuerySchema } from "./pagination.js";

export const redemptionStatusSchema = z.enum(REDEMPTION_STATUSES);

export const createRedemptionSchema = z
  .object({
    rewardId: z.string().min(1, "Falta el identificador del premio."),
  })
  .strict();

export type CreateRedemptionInput = z.infer<typeof createRedemptionSchema>;

export const redemptionParamsSchema = z
  .object({
    redemptionId: z.string().min(1, "Falta el identificador del canje."),
  })
  .strict();

export type RedemptionParams = z.infer<typeof redemptionParamsSchema>;

export const listRedemptionsQuerySchema = paginationQuerySchema
  .extend({
    status: redemptionStatusSchema.optional(),
    childId: childIdSchema.optional(),
  })
  .strict();

export type ListRedemptionsQuery = z.infer<typeof listRedemptionsQuerySchema>;

export const listOwnRedemptionsQuerySchema = paginationQuerySchema
  .extend({
    status: redemptionStatusSchema.optional(),
  })
  .strict();

export type ListOwnRedemptionsQuery = z.infer<typeof listOwnRedemptionsQuerySchema>;

export const redemptionChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: avatarKeySchema,
});

export type RedemptionChild = z.infer<typeof redemptionChildSchema>;

export const redemptionRewardSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type RedemptionReward = z.infer<typeof redemptionRewardSchema>;

export const redemptionSchema = z.object({
  id: z.string(),
  coins: coinsAmountSchema,
  status: redemptionStatusSchema,
  reward: redemptionRewardSchema,
  child: redemptionChildSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Redemption = z.infer<typeof redemptionSchema>;

export const redemptionsPageSchema = pageOf(redemptionSchema);
export type RedemptionsPage = z.infer<typeof redemptionsPageSchema>;

export const ownRedemptionSchema = z.object({
  id: z.string(),
  coins: coinsAmountSchema,
  status: redemptionStatusSchema,
  reward: redemptionRewardSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type OwnRedemption = z.infer<typeof ownRedemptionSchema>;

export const ownRedemptionsPageSchema = pageOf(ownRedemptionSchema);
export type OwnRedemptionsPage = z.infer<typeof ownRedemptionsPageSchema>;

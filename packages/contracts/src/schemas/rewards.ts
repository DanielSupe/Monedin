import { z } from "zod";
import { REWARD_STATUSES } from "../constants/domain.js";
import { avatarValueSchema } from "./avatar.js";
import {
  coinsAmountSchema,
  coinsPerChildAssignmentSchema,
  coinsPerChildFields,
  withCoinsPerChildRules,
} from "./coins-per-child.js";
import { pageOf, paginationQuerySchema } from "./pagination.js";
import { taskDescriptionSchema, taskTitleSchema } from "./tasks.js";
import { uploadKeySchema } from "./uploads.js";

export const rewardStatusSchema = z.enum(REWARD_STATUSES);

export const createRewardSchema = withCoinsPerChildRules(
  z
    .object({
      title: taskTitleSchema,
      description: taskDescriptionSchema.optional(),

      imageUploadKey: uploadKeySchema.optional(),
      ...coinsPerChildFields,
    })
    .strict(),
);

export type CreateRewardInput = z.infer<typeof createRewardSchema>;

export const updateRewardSchema = z
  .object({
    title: taskTitleSchema.optional(),
    description: taskDescriptionSchema.nullable().optional(),

    imageUploadKey: uploadKeySchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No hay nada que cambiar.",
  });

export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;

export const replaceAssignmentsSchema = z
  .object({
    assignments: z.array(coinsPerChildAssignmentSchema),
  })
  .strict()
  .refine(
    (value) => {
      const ids = value.assignments.map((one) => one.childId);
      return new Set(ids).size === ids.length;
    },
    { message: "Hay un hijo repetido." },
  );

export type ReplaceAssignmentsInput = z.infer<typeof replaceAssignmentsSchema>;

export const rewardParamsSchema = z
  .object({
    rewardId: z.string().min(1, "Falta el identificador del premio."),
  })
  .strict();

export type RewardParams = z.infer<typeof rewardParamsSchema>;

export const listRewardsQuerySchema = paginationQuerySchema
  .extend({
    status: rewardStatusSchema.default("ACTIVE"),
  })
  .strict();

export type ListRewardsQuery = z.infer<typeof listRewardsQuerySchema>;

export const listOwnRewardsQuerySchema = paginationQuerySchema.strict();

export type ListOwnRewardsQuery = z.infer<typeof listOwnRewardsQuerySchema>;

export const rewardOfferChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: avatarValueSchema,
});

export type RewardOfferChild = z.infer<typeof rewardOfferChildSchema>;

export const rewardOfferSchema = z.object({
  child: rewardOfferChildSchema,
  coins: coinsAmountSchema,
});

export type RewardOffer = z.infer<typeof rewardOfferSchema>;

export const rewardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),

  image: z.string().url().nullable(),
  status: rewardStatusSchema,
  offers: z.array(rewardOfferSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Reward = z.infer<typeof rewardSchema>;

export const rewardsPageSchema = pageOf(rewardSchema);
export type RewardsPage = z.infer<typeof rewardsPageSchema>;

export const ownRewardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  image: z.string().url().nullable(),
  coins: coinsAmountSchema,
  affordable: z.boolean(),
  createdAt: z.string().datetime(),
});

export type OwnReward = z.infer<typeof ownRewardSchema>;

export const ownRewardsPageSchema = pageOf(ownRewardSchema);
export type OwnRewardsPage = z.infer<typeof ownRewardsPageSchema>;

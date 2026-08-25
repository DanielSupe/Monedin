import { z } from "zod";
import { REDEMPTION_STATUSES } from "../constants/domain.js";
import { avatarKeySchema } from "./avatar.js";
import { childIdSchema, coinsAmountSchema } from "./coins-per-child.js";
import { pageOf, paginationQuerySchema } from "./pagination.js";

/**
 * Contratos de los canjes, compartidos por la API y el front.
 *
 * A diferencia de tareas y premios, aquí no hay dos formas de entrada ni regla
 * de `coins-per-child`: el niño no elige un precio, hereda el de su oferta. Lo
 * único que solicita es el premio.
 */

/** En qué punto de su resolución está un canje. */
export const redemptionStatusSchema = z.enum(REDEMPTION_STATUSES);

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/**
 * Solicitud de canje. Solo el premio: el precio lo decide el servidor leyendo
 * la oferta vigente para ese hijo, y el hijo sale de la sesión.
 *
 * NO acepta `childId` ni `coins`. Al ser `.strict()`, mandarlos es 422: el
 * mismo mecanismo que ya usan `createTaskSchema`/`createRewardSchema` para que
 * nadie pida en nombre de otro ni fije su propio precio.
 */
export const createRedemptionSchema = z
  .object({
    rewardId: z.string().min(1, "Falta el identificador del premio."),
  })
  .strict();

export type CreateRedemptionInput = z.infer<typeof createRedemptionSchema>;

/** Identificador de canje en la ruta. Validado, no leído a mano. */
export const redemptionParamsSchema = z
  .object({
    redemptionId: z.string().min(1, "Falta el identificador del canje."),
  })
  .strict();

export type RedemptionParams = z.infer<typeof redemptionParamsSchema>;

/**
 * Query de la bandeja del padre: paginación más filtros por estado y por hijo,
 * mismo patrón que `listTasksQuerySchema`.
 */
export const listRedemptionsQuerySchema = paginationQuerySchema
  .extend({
    status: redemptionStatusSchema.optional(),
    childId: childIdSchema.optional(),
  })
  .strict();

export type ListRedemptionsQuery = z.infer<typeof listRedemptionsQuerySchema>;

/**
 * Query de la lista propia del niño.
 *
 * NO tiene `childId`, y al ser `.strict()` mandarlo es 422: la misma garantía
 * que `listOwnTasksQuerySchema`/`listOwnRewardsQuerySchema` de que un niño no
 * puede pedir los canjes de su hermano.
 */
export const listOwnRedemptionsQuerySchema = paginationQuerySchema
  .extend({
    status: redemptionStatusSchema.optional(),
  })
  .strict();

export type ListOwnRedemptionsQuery = z.infer<typeof listOwnRedemptionsQuerySchema>;

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

/** El hijo que solicitó el canje, dentro de la vista del padre. */
export const redemptionChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: avatarKeySchema,
});

export type RedemptionChild = z.infer<typeof redemptionChildSchema>;

/** El premio canjeado, lo justo para identificarlo en la fila. */
export const redemptionRewardSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type RedemptionReward = z.infer<typeof redemptionRewardSchema>;

/**
 * Un canje tal como lo ve el padre: con el hijo que lo solicitó.
 *
 * `coins` es el precio CONGELADO al solicitar, no el precio vigente de la
 * oferta si esta cambió después.
 */
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

/**
 * Un canje tal como lo ve el niño que lo solicitó: sin `child`, es él.
 *
 * Es una forma DISTINTA de `Redemption` y no la misma con un parámetro, misma
 * razón que `Task`/`OwnTask` y `Reward`/`OwnReward`.
 */
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

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

/**
 * Contratos del catálogo de premios, compartidos por la API y el front.
 *
 * `title` y `description` reutilizan los esquemas de `tasks.ts`: la constante
 * de dominio ya documenta que un título y una descripción son de «una tarea o
 * un premio», y sus mensajes son neutros a propósito. Definir uno propio aquí
 * sería la segunda copia que la regla 3 de `CLAUDE.md` pide evitar.
 *
 * El PRECIO no vive en ninguno de los dos esquemas de entrada del premio: vive
 * en la oferta a cada hijo, con la misma regla de `coins-per-child` que ya usa
 * el alta de tareas. Ver la decisión 2 del design de `add-rewards`.
 */

/** El filtro del catálogo. `ACTIVE` por defecto: ver la decisión 6 del design. */
export const rewardStatusSchema = z.enum(REWARD_STATUSES);

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/**
 * Alta de un premio. El precio se indica con la misma regla de dos formas que
 * el reparto de tareas: el mismo para todos los hijos indicados, o uno por
 * hijo.
 *
 * NO acepta `parentId` ni `isActive`: el padre dueño sale de la sesión y un
 * premio nace siempre activo. Al ser `.strict()`, mandarlos es 422.
 *
 * SÍ acepta foto, desde `polish-profile-and-reward-image`. Antes no podía: la
 * clave de la imagen incluía el identificador del premio, que no existe
 * mientras se crea. Lo que cambió es de qué cuelga una clave todavía sin
 * dueño — al publicar, del PADRE que la sube, que sí existe, porque publicar un
 * premio ya exige perfil de padre. Ver la decisión 3 de su design.
 */
export const createRewardSchema = withCoinsPerChildRules(
  z
    .object({
      title: taskTitleSchema,
      description: taskDescriptionSchema.optional(),
      /** La foto ya subida que se confirma al publicar. Opcional. */
      imageUploadKey: uploadKeySchema.optional(),
      ...coinsPerChildFields,
    })
    .strict(),
);

export type CreateRewardInput = z.infer<typeof createRewardSchema>;

/**
 * Edición de un premio: solo título y descripción.
 *
 * NO acepta `coins`. Al ser `.strict()`, es 422 y no un campo que se ignora en
 * silencio: cambiar el precio es cambiar la OFERTA a un hijo, con
 * `replaceAssignmentsSchema`, y no el premio. Ver el requisito «El precio no
 * vive en el premio».
 */
export const updateRewardSchema = z
  .object({
    title: taskTitleSchema.optional(),
    description: taskDescriptionSchema.nullable().optional(),
    /**
     * La foto ya subida que se confirma para este premio. `null` explícito la
     * BORRA, que es distinto de no mandar el campo.
     *
     * Vive aquí y no en el alta porque la clave del almacén lleva dentro el
     * identificador del premio, y ese identificador no existe mientras el
     * premio se está creando. Ver la decisión 7 del design de
     * `add-file-storage`.
     */
    imageUploadKey: uploadKeySchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No hay nada que cambiar.",
  });

export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;

/**
 * El conjunto COMPLETO de ofertas de un premio, listo para reemplazar el
 * anterior entero. Un conjunto vacío es válido: es cómo se retira la oferta a
 * todos sin retirar el premio. Ver la decisión 3 del design.
 */
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

/** Identificador de premio en la ruta. Validado, no leído a mano. */
export const rewardParamsSchema = z
  .object({
    rewardId: z.string().min(1, "Falta el identificador del premio."),
  })
  .strict();

export type RewardParams = z.infer<typeof rewardParamsSchema>;

/**
 * Query del catálogo del padre: paginación más el filtro de estado.
 *
 * `status` tiene valor por defecto `ACTIVE`: el catálogo es una herramienta de
 * trabajo y lo retirado es archivo. Pedirlo explícitamente es la única forma
 * de ver los retirados.
 */
export const listRewardsQuerySchema = paginationQuerySchema
  .extend({
    status: rewardStatusSchema.default("ACTIVE"),
  })
  .strict();

export type ListRewardsQuery = z.infer<typeof listRewardsQuerySchema>;

/**
 * Query del escaparate del niño.
 *
 * NO tiene `childId`, y al ser `.strict()` mandarlo es 422: el mismo mecanismo
 * que `listOwnTasksQuerySchema` para que un niño no pueda pedir el escaparate
 * de su hermano.
 */
export const listOwnRewardsQuerySchema = paginationQuerySchema.strict();

export type ListOwnRewardsQuery = z.infer<typeof listOwnRewardsQuerySchema>;

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

/** El hijo de una oferta, dentro de la vista del padre. Sin saldo: no hace falta aquí. */
export const rewardOfferChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: avatarValueSchema,
});

export type RewardOfferChild = z.infer<typeof rewardOfferChildSchema>;

/** Un hijo con lo que le cuesta A ÉL. */
export const rewardOfferSchema = z.object({
  child: rewardOfferChildSchema,
  coins: coinsAmountSchema,
});

export type RewardOffer = z.infer<typeof rewardOfferSchema>;

/**
 * Un premio tal como lo ve su padre: con TODAS sus ofertas.
 *
 * `offers` puede estar vacío: es un estado válido, no un premio a medio
 * publicar. Ver el riesgo aceptado en el design.
 */
export const rewardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  /** URL ya firmada, o `null` si el premio no tiene foto. Nunca la clave cruda. */
  image: z.string().url().nullable(),
  status: rewardStatusSchema,
  offers: z.array(rewardOfferSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Reward = z.infer<typeof rewardSchema>;

export const rewardsPageSchema = pageOf(rewardSchema);
export type RewardsPage = z.infer<typeof rewardsPageSchema>;

/**
 * Un premio tal como lo ve el niño al que se le ofrece: SOLO su precio.
 *
 * Es una forma DISTINTA de `Reward` y no la misma con un parámetro, por la
 * misma razón que `Task` y `OwnTask`: es lo que hace imposible que el precio
 * de un hermano se cuele en esta respuesta. Ver el requisito «El precio del
 * hermano no se filtra» y la decisión 5 del design para `affordable`.
 */
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

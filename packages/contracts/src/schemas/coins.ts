import { z } from "zod";
import { COIN_REASONS } from "../constants/domain.js";
import { childIdSchema } from "./coins-per-child.js";
import { pageOf, paginationQuerySchema } from "./pagination.js";

/**
 * Contratos del historial de monedas, compartidos por la API y el front.
 *
 * Solo LECTURA. La tabla es append-only y un disparador de PostgreSQL hace
 * fallar cualquier `UPDATE` o `DELETE`; crear un movimiento suelto es otra cosa
 * —mueve dinero, así que exige transacción y pruebas de doble tap— y sigue sin
 * exponerse. Ver la decisión 5 del design de `add-coin-history`.
 */

/** De dónde vino el movimiento. */
export const coinReasonSchema = z.enum(COIN_REASONS);

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/**
 * Query del historial de un niño, el suyo.
 *
 * Solo paginación, y `.strict()`. **NO tiene ningún identificador**, ni podría
 * tenerlo: ahí está la garantía de que un niño no lee el historial de su
 * hermano — no hay parámetro que pudiera apuntar a otro perfil, así que no hay
 * nada que comprobar. Mismo mecanismo que `listOwnTasksQuerySchema`.
 *
 * Y aquí importa más que en otros listados: los hermanos comparten la tablet, y
 * un historial es el registro más detallado que existe de lo que otro niño ha
 * hecho y ha gastado.
 */
export const listOwnCoinsQuerySchema = paginationQuerySchema.strict();
export type ListOwnCoinsQuery = z.infer<typeof listOwnCoinsQuerySchema>;

/** Query del historial que el padre pide de uno de sus hijos. */
export const listCoinsQuerySchema = paginationQuerySchema.strict();
export type ListCoinsQuery = z.infer<typeof listCoinsQuerySchema>;

/** El hijo va en la RUTA, no en la query. Validado, no leído a mano. */
export const coinsParamsSchema = z.object({ childId: childIdSchema }).strict();
export type CoinsParams = z.infer<typeof coinsParamsSchema>;

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

/**
 * Un movimiento del historial.
 *
 * `balanceAfter` viene del servidor y **no se calcula en el cliente**. La
 * columna se guarda redundante desde `add-data-model` con una razón escrita:
 * «convierte auditar el saldo en una comparación, no en una agregación».
 * Acumular en el cliente sería además incorrecto en cuanto haya paginación —la
 * segunda página no sabe con qué saldo empezó—, así que devolverlo no es una
 * optimización sino la única forma correcta.
 *
 * `taskId` y `redemptionId` dicen de dónde vino, cuando vino de algo. Se
 * devuelven los identificadores y no la entidad entera: el historial cuenta lo
 * que pasó con las monedas, no repite el catálogo.
 */
export const coinTransactionSchema = z.object({
  id: z.string(),
  /** Positivo acredita, negativo descuenta. Nunca cero. */
  amount: z.number().int(),
  /** El saldo con el que quedó el niño DESPUÉS de este movimiento. */
  balanceAfter: z.number().int(),
  reason: coinReasonSchema,
  createdAt: z.string().datetime(),
  taskId: z.string().nullable(),
  redemptionId: z.string().nullable(),
});

export type CoinTransaction = z.infer<typeof coinTransactionSchema>;

export const coinTransactionsPageSchema = pageOf(coinTransactionSchema);
export type CoinTransactionsPage = z.infer<typeof coinTransactionsPageSchema>;

import { z } from "zod";
import { COINS_MAX, COINS_MIN } from "../constants/domain.js";

export const childIdSchema = z.string().min(1, "Falta el identificador del hijo.");

export const coinsAmountSchema = z
  .number({ invalid_type_error: "Las monedas tienen que ser un número." })
  .int("Las monedas tienen que ser un número entero.")
  .min(COINS_MIN, `Tiene que ser como mínimo ${COINS_MIN} moneda.`)
  .max(COINS_MAX, `Tiene que ser como máximo ${COINS_MAX} monedas.`);

export const coinsPerChildAssignmentSchema = z
  .object({
    childId: childIdSchema,
    coins: coinsAmountSchema,
  })
  .strict();

export type CoinsPerChildAssignmentInput = z.infer<typeof coinsPerChildAssignmentSchema>;

export const coinsPerChildFields = {
  childIds: z.array(childIdSchema).min(1, "Elige al menos un hijo.").optional(),
  coins: coinsAmountSchema.optional(),
  assignments: z.array(coinsPerChildAssignmentSchema).min(1, "Elige al menos un hijo.").optional(),
};

interface CoinsPerChildShape {
  childIds?: string[] | undefined;
  coins?: number | undefined;
  assignments?: Array<{ childId: string; coins: number }> | undefined;
}

function hasExactlyOneForm(value: CoinsPerChildShape): boolean {
  const compartido = value.childIds !== undefined && value.coins !== undefined;
  const porHijo = value.assignments !== undefined;

  if (compartido === porHijo) return false;
  if (compartido) return value.assignments === undefined;
  return value.childIds === undefined && value.coins === undefined;
}

function hasNoDuplicateChild(value: CoinsPerChildShape): boolean {
  const ids = value.childIds ?? value.assignments?.map((one) => one.childId) ?? [];
  return new Set(ids).size === ids.length;
}

export function withCoinsPerChildRules<T extends z.AnyZodObject>(schema: T) {
  return schema
    .refine((value) => hasExactlyOneForm(value as CoinsPerChildShape), {
      message: "Indica el mismo valor para todos los hijos o uno por hijo, pero no las dos cosas.",
    })
    .refine((value) => hasNoDuplicateChild(value as CoinsPerChildShape), {
      message: "Hay un hijo repetido.",
    });
}

export function normalizeCoinsPerChild(
  value: CoinsPerChildShape,
): Array<{ childId: string; coins: number }> {
  if (value.assignments !== undefined) {
    return value.assignments;
  }

  const { childIds, coins } = value;
  if (childIds === undefined || coins === undefined) {
    throw new Error(
      "normalizeCoinsPerChild: ninguna de las dos formas está presente. " +
        "¿Se llamó sin pasar antes por withCoinsPerChildRules?",
    );
  }

  return childIds.map((childId) => ({ childId, coins }));
}

import { z } from "zod";

export const pageSearch = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});

export type PageSearch = z.infer<typeof pageSearch>;

export const manageSearch = z.object({
  manage: z.unknown().transform((valor) => (valor === true || valor === "true" ? true : undefined)),
});

export type ManageSearch = z.infer<typeof manageSearch>;

export function statusSearch<const T extends readonly [string, ...string[]]>(estados: T) {
  return pageSearch.extend({
    status: z
      .enum(estados)
      .or(z.literal("ALL"))
      .catch("ALL"),
  });
}

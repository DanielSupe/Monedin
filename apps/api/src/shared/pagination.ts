import type { Page, PaginationQuery } from "@monedin/contracts";

/**
 * Traducción entre lo que pide el cliente y lo que entiende la base de datos.
 *
 * El SERVICIO habla de página y tamaño, que es lo que viaja por el contrato.
 * El REPOSITORIO habla de `skip` y `take`, que es lo que entiende Prisma.
 *
 * La aritmética ocurre aquí y en ningún otro sitio, para que ningún repositorio
 * haga cuentas con entrada de usuario. Ver la decisión 3 del design de
 * `add-children`.
 */

/** Desplazamiento y tamaño para el motor, a partir de la página pedida. */
export function toSkipTake(query: PaginationQuery): { skip: number; take: number } {
  return {
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  };
}

/**
 * Envuelve el resultado del repositorio en la forma que espera el contrato.
 *
 * `totalPages` es como mínimo 1, incluso sin resultados: con cero, el front
 * pintaría «página 1 de 0» y podría dividir por cero al construir el paginador.
 *
 * Una página posterior a la última NO es un error: devuelve la lista vacía. Un
 * cliente que acaba de dar de baja la última fila de la página 3 no debería
 * tener que tratar un camino de error para descubrir que ya no hay página 3.
 */
export function toPage<T>(query: PaginationQuery, result: { items: T[]; total: number }): Page<T> {
  return {
    items: result.items,
    page: query.page,
    pageSize: query.pageSize,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / query.pageSize)),
  };
}

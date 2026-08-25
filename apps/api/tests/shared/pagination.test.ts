import { DEFAULT_PAGE_SIZE } from "@monedin/contracts";
import { describe, expect, it } from "vitest";
import { toPage, toSkipTake } from "../../src/shared/pagination.js";

describe("traducción de página a desplazamiento", () => {
  it("la primera página no se salta nada", () => {
    expect(toSkipTake({ page: 1, pageSize: 20 })).toEqual({ skip: 0, take: 20 });
  });

  it("la tercera página se salta las dos anteriores", () => {
    expect(toSkipTake({ page: 3, pageSize: 5 })).toEqual({ skip: 10, take: 5 });
  });
});

describe("envoltura de un listado paginado", () => {
  const query = { page: 1, pageSize: DEFAULT_PAGE_SIZE };

  it("devuelve los elementos con el total sin paginar", () => {
    const page = toPage(query, { items: ["a", "b"], total: 41 });

    expect(page.items).toEqual(["a", "b"]);
    expect(page.total).toBe(41);
    expect(page.totalPages).toBe(3);
  });

  it("una lista vacía sigue teniendo una página", () => {
    // Con cero, el front pintaría «página 1 de 0» y podría dividir por cero.
    const page = toPage(query, { items: [], total: 0 });

    expect(page.totalPages).toBe(1);
    expect(page.items).toEqual([]);
  });

  it("la última página incompleta cuenta igual", () => {
    const page = toPage({ page: 3, pageSize: 2 }, { items: ["e"], total: 5 });

    expect(page.totalPages).toBe(3);
    expect(page.page).toBe(3);
  });

  it("un total que llena las páginas justas no añade una de más", () => {
    expect(toPage({ page: 1, pageSize: 10 }, { items: [], total: 20 }).totalPages).toBe(2);
  });

  it("una página más allá del final es una lista vacía, no un error", () => {
    const page = toPage({ page: 9, pageSize: 20 }, { items: [], total: 3 });

    expect(page.items).toEqual([]);
    expect(page.page).toBe(9);
    expect(page.totalPages).toBe(1);
  });

  it("conserva el tamaño de página que se pidió", () => {
    expect(toPage({ page: 2, pageSize: 7 }, { items: [], total: 30 }).pageSize).toBe(7);
  });
});

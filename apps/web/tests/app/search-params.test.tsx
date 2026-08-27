import { afterEach, describe, expect, it, vi } from "vitest";
import { comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("el filtro y la página viajan en la dirección", () => {
  it("una dirección con filtro abre el listado ya filtrado", async () => {
    const app = await montarApp("/tasks?status=COMPLETED&page=2", comoPadre());

    expect(app.router.state.location.search).toMatchObject({ status: "COMPLETED", page: 2 });
  });

  it("el filtro sobrevive a abrir el formulario y volver atrás", async () => {
    const app = await montarApp("/tasks?status=COMPLETED", comoPadre());

    await app.router.navigate({ to: "/tasks/new" });
    expect(app.direccion()).toBe("/tasks/new");

    app.router.history.back();
    await app.router.invalidate();

    // Un padre que filtra por «esperando mi aprobación», entra a resolver una y
    // vuelve, no debería tener que volver a filtrar.
    expect(app.direccion()).toBe("/tasks");
    expect(app.router.state.location.search).toMatchObject({ status: "COMPLETED" });
  });
});

describe("un valor inválido cae al de por defecto y no rompe la pantalla", () => {
  it("un estado que no existe", async () => {
    const app = await montarApp("/tasks?status=INVENTADO", comoPadre());

    expect(app.router.state.location.search).toMatchObject({ status: "ALL" });
  });

  it("una página que no es un número", async () => {
    const app = await montarApp("/children?page=hola", comoPadre());

    expect(app.router.state.location.search).toMatchObject({ page: 1 });
  });

  it("una página negativa", async () => {
    const app = await montarApp("/rewards?page=-3", comoPadre());

    expect(app.router.state.location.search).toMatchObject({ page: 1, status: "ACTIVE" });
  });

  it("el catálogo de premios no admite ALL: un premio está activo o retirado", async () => {
    const app = await montarApp("/rewards?status=ALL", comoPadre());

    expect(app.router.state.location.search).toMatchObject({ status: "ACTIVE" });
  });
});

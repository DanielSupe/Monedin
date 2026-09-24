import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SIN_SESION, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("la puerta pública", () => {
  it("se ve SIN sesión, que es su razón de existir", async () => {
    const app = await montarApp("/welcome", SIN_SESION);

    expect(app.direccion()).toBe("/welcome");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      messages.landing.headline,
    );
  });

  it("también se ve CON sesión, y no expulsa a nadie", async () => {
    const app = await montarApp("/welcome", comoPadre());

    expect(app.direccion()).toBe("/welcome");
  });

  it("el titular completo está en el DOM aunque se escriba solo", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      messages.landing.headline,
    );
  });

  it("explica el ciclo como un flujo, y en orden", async () => {
    await montarApp("/welcome", SIN_SESION);

    const pasos = [
      messages.landing.howStepTaskTitle,
      messages.landing.howStepApproveTitle,
      messages.landing.howStepCoinsTitle,
      messages.landing.howStepRewardTitle,
    ].map((texto) => screen.getByText(texto));

    for (const [indice, paso] of pasos.slice(0, -1).entries()) {
      expect(
        paso.compareDocumentPosition(pasos[indice + 1] as HTMLElement),
        `«${paso.textContent}» debería ir antes que el paso siguiente`,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }
  });

  it("despeja que la moneda no es dinero real, y qué aprende el niño", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(screen.getByText(messages.landing.aboutTitle)).toBeInTheDocument();
    expect(screen.getByText(messages.landing.aboutBody)).toBeInTheDocument();
    expect(screen.getByText(messages.landing.aboutLearns)).toBeInTheDocument();
  });

  it("y lo despeja ANTES de contar el ciclo, no después", async () => {
    await montarApp("/welcome", SIN_SESION);

    const flujo = screen.getByText(messages.landing.howTitle);
    const franja = screen.getByText(messages.landing.aboutTitle);

    expect(franja.compareDocumentPosition(flujo)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("lo que solo ilustra no se anuncia", async () => {
    await montarApp("/welcome", SIN_SESION);

    await screen.findByText(messages.landing.aboutTitle);

    expect(screen.getAllByRole("img")).toHaveLength(4);
  });

  it("la visualización se anuncia como una imagen con significado", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(screen.getByRole("img", { name: messages.landing.orbitLabel })).toBeInTheDocument();
  });

  it("rinde la marca desde la pieza, igual que los marcos", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(screen.getByRole("img", { name: messages.app.title })).toBeInTheDocument();
  });

  it("no adopta el marco de un rol: todavía no se sabe de quién sería", async () => {
    await montarApp("/welcome", SIN_SESION);

    const raiz = screen.getByRole("banner").parentElement as HTMLElement;
    expect(raiz.getAttribute("data-scale")).not.toBe("parent");
    expect(raiz.getAttribute("data-scale")).not.toBe("child");
  });

  it("tiene audiencia propia: se lee de pie, no como el padre ni como el niño", async () => {
    await montarApp("/welcome", SIN_SESION);

    const raiz = screen.getByRole("banner").parentElement as HTMLElement;
    expect(raiz.getAttribute("data-scale")).toBe("public");
  });

  it("pero las maquetas sí llevan la escala de su audiencia, y son distintas", async () => {
    await montarApp("/welcome", SIN_SESION);

    const delPadre = screen.getByRole("img", { name: messages.landing.previewParentLabel });
    const delNino = screen.getByRole("img", { name: messages.landing.previewChildLabel });

    expect(delPadre.getAttribute("data-scale")).not.toBe(delNino.getAttribute("data-scale"));
  });

  it("y las maquetas se anuncian como ejemplos, no como datos de nadie", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(
      screen.getByRole("img", { name: messages.landing.previewParentLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: messages.landing.previewChildLabel }),
    ).toBeInTheDocument();
  });
});

describe("la página cierra con su acción", () => {
  it("la acción principal está arriba Y abajo, y las dos llevan al registro", async () => {
    await montarApp("/welcome", SIN_SESION);

    const acciones = screen.getAllByRole("link", { name: messages.landing.start });

    expect(acciones.length).toBeGreaterThan(1);
    for (const accion of acciones) {
      expect(accion).toHaveAttribute("href", "/sign-up");
    }
  });

  it("y el cierre no vuelve a argumentar", async () => {
    await montarApp("/welcome", SIN_SESION);

    const cierre = screen.getByText(messages.landing.closingTitle);
    const accion = screen.getByRole("link", { name: messages.landing.closingAction });

    expect(cierre.compareDocumentPosition(accion)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("y aunque se llame distinto, lleva donde las otras", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(
      screen.getByRole("link", { name: messages.landing.closingAction }),
    ).toHaveAttribute("href", "/sign-up");
  });
});

describe("las dos acciones pesan lo mismo", () => {
  it("empezar y entrar están las dos, y ninguna escondida", async () => {
    await montarApp("/welcome", SIN_SESION);

    const empezar = screen.getAllByRole("link", { name: messages.landing.start });
    const entrar = screen.getAllByRole("link", { name: messages.landing.signIn });

    expect(empezar.length).toBeGreaterThan(0);
    expect(entrar.length).toBeGreaterThan(0);

    for (const accion of [...empezar, ...entrar]) {
      expect(accion.querySelector("button")).toBeNull();
    }
  });

  it("las dos llevan a la pantalla de acceso", async () => {
    await montarApp("/welcome", SIN_SESION);

    const enlaces = screen.getAllByRole("link");
    const aAcceso = enlaces.filter((enlace) => enlace.getAttribute("href") === "/sign-in");

    expect(aAcceso.length).toBeGreaterThan(0);
  });
});

describe("la landing no consulta datos de nadie", () => {
  it("no pide nada al servidor salvo la sesión", async () => {
    await montarApp("/welcome", SIN_SESION);

    const fetchMock = globalThis.fetch as unknown as { mock: { calls: unknown[][] } };
    const urls = fetchMock.mock.calls.map((llamada) => String(llamada[0]));

    expect(urls.filter((url) => !url.includes("/auth/session"))).toEqual([]);
  });
});

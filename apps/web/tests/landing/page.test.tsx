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

    // Lo que se escribe letra a letra va oculto a los lectores. Nadie debería
    // oír un título deletreándose.
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      messages.landing.headline,
    );
  });

  it("explica el producto con las tres promesas", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(screen.getByText(messages.landing.promiseEarnTitle)).toBeInTheDocument();
    expect(screen.getByText(messages.landing.promiseSpendTitle)).toBeInTheDocument();
    expect(screen.getByText(messages.landing.promiseApproveTitle)).toBeInTheDocument();
  });

  it("despeja que la moneda no es dinero real, y qué aprende el niño", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(screen.getByText(messages.landing.aboutTitle)).toBeInTheDocument();
    expect(screen.getByText(messages.landing.aboutBody)).toBeInTheDocument();
    expect(screen.getByText(messages.landing.aboutLearns)).toBeInTheDocument();
  });

  /*
   * El orden importa: la franja contesta una duda ANTES de que las tarjetas
   * resuman el ciclo. Comprobar solo que existe dejaría pasar ponerla al final,
   * que es lo contrario de lo que hace falta.
   */
  it("y lo despeja ANTES de las tres promesas", async () => {
    await montarApp("/welcome", SIN_SESION);

    const franja = screen.getByText(messages.landing.aboutTitle);
    const promesas = screen.getByText(messages.landing.promiseEarnTitle);

    expect(franja.compareDocumentPosition(promesas)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  /*
   * La ilustración de la franja NO se anuncia: acompaña a un texto que ya lo
   * dice todo, y oírla sería la misma frase dos veces.
   *
   * Se CUENTAN las imágenes con nombre y no se mira su atributo: comprobar que
   * «la ilustración no tiene nombre» pasaría igual si la ilustración no
   * estuviera. Dos, el logo y las órbitas, y tienen que seguir siendo dos.
   */
  it("lo que solo ilustra no se anuncia", async () => {
    await montarApp("/welcome", SIN_SESION);

    await screen.findByText(messages.landing.aboutTitle);
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("la visualización se anuncia como una imagen con significado", async () => {
    await montarApp("/welcome", SIN_SESION);

    // Doce emojis leídos en voz alta no explican nada; una frase sí.
    expect(screen.getByRole("img", { name: messages.landing.orbitLabel })).toBeInTheDocument();
  });

  it("rinde la marca desde la pieza, igual que los marcos", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(screen.getByRole("img", { name: messages.app.title })).toBeInTheDocument();
  });

  it("no lleva marco de rol: todavía no se sabe de quién sería", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(document.querySelector("[data-scale]")).toBeNull();
  });
});

describe("las dos acciones pesan lo mismo", () => {
  it("empezar y entrar están las dos, y ninguna escondida", async () => {
    await montarApp("/welcome", SIN_SESION);

    // La mitad de quien llega aquí ya es usuario con la sesión caducada: si
    // entrar cuesta encontrarlo, eso se paga a diario.
    const empezar = screen.getAllByRole("link", { name: messages.landing.start });
    const entrar = screen.getAllByRole("link", { name: messages.landing.signIn });

    expect(empezar.length).toBeGreaterThan(0);
    expect(entrar.length).toBeGreaterThan(0);

    // Enlaces, no botones anidados en enlaces: navegar es trabajo de un enlace.
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

    // La sesión la resuelve el router para saber qué marco pintar. Cualquier
    // otra petición sería un dato de una familia en una página pública.
    expect(urls.filter((url) => !url.includes("/auth/session"))).toEqual([]);
  });
});

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

  /*
   * Las tres promesas eran una LISTA y ahora son un FLUJO, porque son un ciclo.
   *
   * Se comprueba el ORDEN y no solo que los cuatro pasos están: una lista de
   * cuatro cajas en cualquier orden pasaría eso, y lo que hay que entender aquí
   * es la secuencia. Aprobar va ENTRE la tarea y las monedas, que es donde
   * ocurre — aprobar es lo que acredita.
   */
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

  /*
   * El orden importa: la franja contesta una duda ANTES de que las tarjetas
   * resuman el ciclo. Comprobar solo que existe dejaría pasar ponerla al final,
   * que es lo contrario de lo que hace falta.
   */
  it("y lo despeja DESPUÉS de contar el ciclo, no antes", async () => {
    await montarApp("/welcome", SIN_SESION);

    const flujo = screen.getByText(messages.landing.howTitle);
    const franja = screen.getByText(messages.landing.aboutTitle);

    expect(flujo.compareDocumentPosition(franja)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
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

    // CUATRO con nombre: el logo, las órbitas y las dos maquetas. La
    // ilustración de la franja no está entre ellas porque es decorativa, y
    // tampoco los glifos de los pasos ni las teselas de las maquetas.
    //
    // Se cuenta y no se mira el atributo: comprobar que «la ilustración no
    // tiene nombre» pasaría igual si la ilustración no estuviera.
    expect(screen.getAllByRole("img")).toHaveLength(4);
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

  /*
   * La RAÍZ, no el documento entero.
   *
   * Decía «ningún `[data-scale]` en la página», y la intención sigue siendo
   * buena: la puerta pública no adopta el marco de un rol, porque todavía no se
   * sabe de quién sería. Pero desde `redesign-public-entry` la página enseña las
   * dos caras de la aplicación, y cada maqueta lleva su escala DE VERDAD — es lo
   * que hace que la diferencia que se ve sea la del producto y no una imitación.
   *
   * Así que lo que hay que afirmar es que la página no se mete en un marco, no
   * que dentro no haya ninguna escala. Ver la decisión 3 del design.
   */
  it("no adopta el marco de un rol: todavía no se sabe de quién sería", async () => {
    await montarApp("/welcome", SIN_SESION);

    const raiz = screen.getByRole("banner").parentElement as HTMLElement;
    expect(raiz.getAttribute("data-scale")).toBeNull();
  });

  it("pero las maquetas sí llevan la escala de su audiencia, y son distintas", async () => {
    await montarApp("/welcome", SIN_SESION);

    const delPadre = screen.getByRole("img", { name: messages.landing.previewParentLabel });
    const delNino = screen.getByRole("img", { name: messages.landing.previewChildLabel });

    // Comparadas ENTRE SÍ: con las dos en la misma escala, la sección no
    // enseñaría lo único que existe para enseñar.
    expect(delPadre.getAttribute("data-scale")).not.toBe(delNino.getAttribute("data-scale"));
  });

  it("y las maquetas se anuncian como ejemplos, no como datos de nadie", async () => {
    await montarApp("/welcome", SIN_SESION);

    // Sin esto, quien recorre la página sin verla oye un saldo y dos nombres de
    // niño sin forma de saber que no son de nadie.
    expect(
      screen.getByRole("img", { name: messages.landing.previewParentLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: messages.landing.previewChildLabel }),
    ).toBeInTheDocument();
  });
});

/**
 * El cierre, desde `redesign-public-entry`.
 *
 * Antes no había: después de la última tarjeta, nada. La única llamada a la
 * acción estaba arriba, así que quien había leído la página entera tenía que
 * volver a subir — justo cuando está más convencido.
 */
describe("la página cierra con su acción", () => {
  it("la acción principal está arriba Y abajo, y las dos llevan al registro", async () => {
    await montarApp("/welcome", SIN_SESION);

    const acciones = screen.getAllByRole("link", { name: messages.landing.start });

    // DOS al menos —la cabecera, el héroe y el cierre—, y todas al mismo sitio:
    // una que llevara a otro lado sería el defecto que `redesign-access` ya
    // arregló en el héroe.
    expect(acciones.length).toBeGreaterThan(1);
    for (const accion of acciones) {
      expect(accion).toHaveAttribute("href", "/sign-up");
    }
  });

  it("y el cierre no vuelve a argumentar", async () => {
    await montarApp("/welcome", SIN_SESION);

    const cierre = screen.getByText(messages.landing.closingTitle);
    const ultimaAccion = screen.getAllByRole("link", { name: messages.landing.start }).at(-1);

    // La acción va DESPUÉS del cierre: si estuviera antes, el cierre sería un
    // párrafo más y no un cierre.
    expect(cierre.compareDocumentPosition(ultimaAccion as HTMLElement)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
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

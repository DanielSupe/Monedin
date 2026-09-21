import { act, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WIDGET_ROTATION_MS, areaOf } from "../../src/app/widget-lines.js";
import { messages } from "../../src/lib/messages.js";
import { conMovimientoReducido } from "../setup.js";
import { comoNino, comoPadre, montarApp } from "../support/router.js";

/**
 * Monedín ofreciéndose desde la esquina.
 *
 * Lo que se persigue aquí no es que se vea —eso lo cuenta cualquiera— sino las
 * cuatro cosas que, rotas, NO SE NOTAN: que no sea un diálogo, que se calle
 * durante el recorrido, que no se duplique en la ayuda, y que deje de turnarse
 * cuando alguien pidió menos movimiento.
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * El acceso FLOTANTE, distinguido por estructura y no por su nombre.
 *
 * Su nombre accesible es el mismo que el del enlace del pie de la ayuda, y eso
 * es correcto —son el mismo destino y la misma acción—, así que buscarlo por
 * nombre encuentra los dos. Lo destapó este test: la ambigüedad que el código
 * advertía existe de verdad, y la salida no es renombrar uno.
 */
function widget(): HTMLElement | null {
  return document.querySelector('[data-widget="monedin"] a');
}

describe("se ofrece desde cualquier pantalla", () => {
  it.each([
    ["un niño", comoNino, "/"],
    ["un padre", comoPadre, "/"],
    ["un niño en sus premios", comoNino, "/me/rewards"],
  ])("%s lo ve, y lleva al chat", async (_quien, sesion, destino) => {
    await montarApp(destino, sesion());

    expect(widget()?.getAttribute("href")).toBe("/assistant");
  });

  /*
   * NO ES UN DIÁLOGO, y este caso lo fija aquí en vez de fiarlo a
   * `tutorial.test.tsx`, que afirma lo mismo desde otro archivo y podría dejar
   * de cubrirlo. Si alguien lo montara sobre `Dialog` o `Spotlight` —que es la
   * tentación, porque ya existen y flotan— el resto de la aplicación quedaría
   * inerte detrás de una mascota decorativa.
   */
  it('NO expone role="dialog"', async () => {
    await montarApp("/", comoNino());

    expect(widget()).not.toBeNull();
    expect(screen.queryAllByRole("dialog")).toHaveLength(0);
  });

  /*
   * El nombre accesible es FIJO. Si fuera el bocadillo, el destino cambiaría de
   * nombre cada ocho segundos: hostil para quien no ve la pantalla, y una bomba
   * para cualquier `getByRole` futuro.
   */
  it("su nombre no es la frase que dice", async () => {
    await montarApp("/", comoNino());

    expect(widget()?.getAttribute("aria-label")).toBe(messages.widget.openChat);
    expect(widget()?.getAttribute("aria-label")).not.toBe(messages.widget.childHomeBalance);
  });
});

describe("no se duplica ni compite", () => {
  /*
   * En la ayuda ya hay un enlace al chat con el mismo nombre. Dos caminos
   * idénticos al mismo sitio en la misma pantalla son ruido, y un `getByRole`
   * ambiguo esperando a morder a cualquier test futuro.
   */
  it("no aparece en la ayuda, que ya ofrece el chat", async () => {
    await montarApp("/help", comoNino());

    expect(screen.getByRole("heading", { name: messages.help.title })).toBeTruthy();
    expect(widget()).toBeNull();
    // Y el de la ayuda sí está: sin esto, un widget que no se montara NUNCA
    // pasaría este caso en verde.
    expect(screen.getByRole("link", { name: messages.help.askMonedin })).toBeTruthy();
  });

  /*
   * Durante el recorrido de bienvenida ya hay un Monedín hablando dentro del
   * foco. El segundo saldría apagado detrás del velo compitiendo con él.
   */
  it("no se monta mientras se está explicando el producto", async () => {
    await montarApp("/", comoNino("Mateo", false));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(widget()).toBeNull();
  });

  it("y sí se monta en cuanto el recorrido está visto", async () => {
    await montarApp("/", comoNino("Mateo", true));

    expect(widget()).not.toBeNull();
  });
});

describe("lo que dice depende de dónde está y de quién mira", () => {
  it("el mismo área dice cosas distintas a un padre que a un niño", async () => {
    await montarApp("/me/rewards", comoNino());
    const delNino = widget()?.textContent;

    // Se desmonta a mano: `cleanup` corre ENTRE tests, no dentro de uno, y dos
    // aplicaciones montadas a la vez dan dos widgets.
    cleanup();

    await montarApp("/rewards", comoPadre());
    const delPadre = widget()?.textContent;

    expect(delNino).toBeTruthy();
    expect(delPadre).toBeTruthy();
    expect(delNino).not.toBe(delPadre);
  });

  it("las áreas se reparten por PREFIJO, así que las dos formas caen igual", () => {
    // Es lo que hace que una ruta nueva de un área existente herede sus frases
    // sin que nadie se acuerde de declararla.
    expect(areaOf("/me/tasks")).toBe(areaOf("/tasks"));
    expect(areaOf("/rewards/new")).toBe("rewards");
    expect(areaOf("/children/abc/coins")).toBe("children");
    // Y una dirección sin área cae en el inicio, en vez de quedarse muda.
    expect(areaOf("/algo-que-no-existe")).toBe("home");
  });
});

describe("la frase se turna, y el reloj no acumula holgura", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Avanza N intervalos EXACTOS, de una sola vez.
   *
   * La lección está escrita: el ayudante del ciclo del saldo avanzaba un
   * intervalo «más mil milisegundos para que la animación asiente», y a las diez
   * vueltas se habían colado dos intervalos enteros — con toda la pinta de un
   * fallo del código. Aquí se adelanta el tiempo exacto y ya está: la transición
   * dura menos que un intervalo, así que no dispara ninguno de más.
   */
  async function avanzar(intervalos: number): Promise<void> {
    await act(async () => {
      vi.advanceTimersByTime(WIDGET_ROTATION_MS * intervalos);
      await Promise.resolve();
    });
  }

  /*
   * EL CASO ESTÁ ELEGIDO PARA QUE DISTINGA, y se comprueban las DOS mitades.
   *
   * El inicio del niño tiene TRES frases. A los tres intervalos hay que estar de
   * vuelta en la primera, y al cuarto en la segunda. Comprobar solo lo primero
   * pasaría con un componente que se quedara siempre en la primera; comprobar
   * solo lo segundo pasaría con uno que no diera la vuelta. Con dos frases y dos
   * avances, un módulo mal escrito daría exactamente lo mismo que uno correcto.
   */
  it("con tres frases, tres intervalos vuelven a la primera y el cuarto pasa a la segunda", async () => {
    await montarApp("/", comoNino());

    const primera = widget()?.textContent;
    expect(primera).toBeTruthy();

    await avanzar(1);
    const segunda = widget()?.textContent;
    expect(segunda).not.toBe(primera);

    await avanzar(2);
    expect(widget()?.textContent).toBe(primera);

    await avanzar(1);
    expect(widget()?.textContent).toBe(segunda);
  });

  /*
   * El caso que caza el defecto REAL: poner `motion-safe:` en la clase y dejar
   * el temporizador corriendo. Visualmente parecería resuelto —no hay fundido—
   * pero el texto seguiría saltando cada ocho segundos, que es exactamente el
   * movimiento del que se estaba huyendo.
   */
  it("con movimiento reducido no se turna, ni después de diez intervalos", async () => {
    conMovimientoReducido();
    await montarApp("/", comoNino());

    const alLlegar = widget()?.textContent;
    expect(alLlegar).toBeTruthy();

    await avanzar(10);

    expect(widget()?.textContent).toBe(alLlegar);
  });
});

/**
 * Al cambiar de área, lo que dice cambia con ella.
 *
 * LO QUE ESTE TEST NO PRUEBA, y hay que decirlo en vez de aparentarlo: que el
 * ÍNDICE vuelva a cero. Para verlo haría falta adelantar el reloj y después
 * navegar, y las dos cosas juntas no se pueden: `router.navigate` con relojes
 * falsos se queda colgado —el router espera promesas que solo corren con el
 * reloj de verdad— y el test muere por tiempo, arrastrando además al resto del
 * archivo. Se intentó de tres maneras, incluidas las APIs asíncronas de
 * temporizador.
 *
 * Lo que SÍ prueba es lo que más se rompe: que el widget reaccione al cambio de
 * área. Un componente que leyera el área una sola vez al montarse pasaría los
 * tests de rotación y fallaría este.
 *
 * El reinicio del índice queda como comprobación manual, en la tarea 6.4 del
 * change. Es la misma decisión que el recorte de imágenes, que tampoco se puede
 * probar de punta a punta bajo jsdom.
 *
 * Y se navega SIN envolver en `act()`: envolverlo BLOQUEA la navegación, que es
 * lo que costó tres intentos y lo que hacía parecer que el problema era el
 * reloj falso. Los otros tests que navegan —el de destinos, el del chat—
 * tampoco lo envuelven.
 */
describe("al cambiar de área cambia lo que dice", () => {
  it("cada área trae sus propias frases, sin remontar la aplicación", async () => {
    const app = await montarApp("/", comoNino());

    expect(widget()?.textContent).toBe(messages.widget.childHomeBalance);

    await app.router.navigate({ to: "/me/tasks" });
    expect(widget()?.textContent).toBe(messages.widget.childTasksDo);

    await app.router.navigate({ to: "/me/rewards" });
    expect(widget()?.textContent).toBe(messages.widget.childRewardsChoose);

    await app.router.navigate({ to: "/" });
    expect(widget()?.textContent).toBe(messages.widget.childHomeBalance);
  });
});

/**
 * ESTE BLOQUE DECÍA «vive en la cabecera», Y ERA LA MITAD EQUIVOCADA.
 *
 * Lo comprobaba de dos maneras: que se encuentra sin abrir el cajón, y que NO
 * está entre los destinos del cajón. La segunda es la que sostenía un argumento
 * —la ayuda no es un destino de TRABAJO, responde «¿cómo funciona esto?» y no
 * «¿qué tengo que hacer hoy?»—. La primera solo describía dónde estaba
 * entonces, y donde estaba era un interrogante mudo con su nombre en un
 * `aria-label`.
 *
 * Así que la segunda se queda tal cual y la primera se sustituye por lo que de
 * verdad hay que garantizar: que la ayuda no se pierde entre los destinos de
 * trabajo pero **está donde está el perfil**, que es el otro sitio del marco
 * para lo que no es trabajo. Que además lleve su nombre a la vista lo comprueba
 * `sidebar.test.tsx`.
 */
describe("el acceso a la ayuda no se mezcla con los destinos de trabajo", () => {
  /*
   * Un destino ofrecido dos veces es un defecto y la única excepción declarada
   * es el perfil; la ayuda no entra en la lista porque no es de trabajo.
   */
  it.each([
    ["un niño", comoNino],
    ["un padre", comoPadre],
  ])("para %s, la ayuda NO está entre los destinos del cajón", async (_quien, sesion) => {
    await montarApp("/", sesion());

    await userEvent.click(screen.getByRole("button", { name: messages.nav.menu }));
    const cajon = screen.getByRole("navigation", { name: messages.nav.drawerLabel });

    // Con el cajón abierto Radix marca el resto del documento como oculto, así
    // que se comprueba DENTRO de él y no con `getAllByRole`.
    expect(cajon.querySelector('a[href="/help"]')).toBeNull();
  });

  /*
   * Y SÍ está en el pie del lateral, junto al perfil. Sin este caso el de arriba
   * pasaría igual con la ayuda BORRADA del marco, que es el defecto opuesto y
   * peor: dejar de mezclarla no puede significar dejar de ofrecerla.
   */
  it.each([
    ["un niño", comoNino],
    ["un padre", comoPadre],
  ])("y para %s está en el pie, donde el perfil", async (_quien, sesion) => {
    await montarApp("/", sesion());

    await userEvent.click(screen.getByRole("button", { name: messages.nav.menu }));
    const lateral = screen
      .getByRole("navigation", { name: messages.nav.drawerLabel })
      .closest("[data-collapsed]");

    expect(lateral?.querySelector('a[href="/help"]')).not.toBeNull();
  });
});

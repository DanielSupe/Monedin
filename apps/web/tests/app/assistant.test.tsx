import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { routeTree } from "../../src/routeTree.gen";
import { conPantallaAncha } from "../setup.js";
import { comoNino, comoPadre } from "../support/router.js";

/**
 * El chat con Monedín.
 *
 * ESPÍA DE `fetch` PROPIO, y no `servirSesion`: aquel responde una página vacía
 * a cualquier URL que no sea la sesión ni los perfiles, y `assistantAnswerSchema`
 * la rechazaría. Es el mismo motivo por el que `tutorial.test.tsx` monta el suyo.
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

interface Enviado {
  question: string;
  history: Array<{ role: string; text: string }>;
}

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface Montado {
  /** Los cuerpos de cada `POST /assistant/ask`, en orden. */
  enviados: Enviado[];
  direccion: () => string;
  /**
   * Se navega con el ROUTER y no pulsando un enlace, porque todavía no hay
   * ninguno que lleve aquí: los accesos —el widget flotante y el icono de
   * ayuda— son el change siguiente. Hasta entonces `/assistant` se alcanza
   * escribiendo la dirección, y eso está declarado en su proposal.
   */
  ir: (destino: string) => Promise<void>;
}

/**
 * Monta la aplicación en `/assistant` con un espía que responde lo que se le
 * diga: una respuesta, o un fallo con su código.
 */
async function montarChat(
  quien: "padre" | "nino",
  responder: (n: number) => { ok: true; answer: string } | { ok: false; status: number; code: string },
  destino = "/assistant",
): Promise<Montado> {
  const enviados: Enviado[] = [];

  const espia = vi.fn((entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada);

    if (url.startsWith(`${API_PREFIX}/auth/session`)) {
      return Promise.resolve(json(quien === "padre" ? comoPadre() : comoNino()));
    }
    if (url.startsWith(`${API_PREFIX}/auth/profiles`)) {
      return Promise.resolve(json({ profiles: [] }));
    }
    if (url.startsWith(`${API_PREFIX}/assistant/ask`)) {
      enviados.push(JSON.parse(String(init?.body)) as Enviado);
      const respuesta = responder(enviados.length);
      return Promise.resolve(
        respuesta.ok
          ? json({ answer: respuesta.answer })
          : json({ code: respuesta.code, message: "…" }, respuesta.status),
      );
    }

    return Promise.resolve(json({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 }));
  });

  vi.stubGlobal("fetch", espia);

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [destino] }),
  });
  await router.load();

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return {
    enviados,
    direccion: () => router.state.location.pathname,
    ir: async (destino) => {
      await router.navigate({ to: destino });
      await router.invalidate();
    },
  };
}

const respondeSiempre = (texto: string) => () => ({ ok: true as const, answer: texto });

async function preguntar(usuario: ReturnType<typeof userEvent.setup>, texto: string): Promise<void> {
  await usuario.type(screen.getByLabelText(messages.assistant.inputLabel), texto);
  await usuario.click(screen.getByRole("button", { name: messages.assistant.send }));
}

describe("preguntar y recibir respuesta", () => {
  it("la pregunta y la respuesta quedan en pantalla", async () => {
    const usuario = userEvent.setup();
    await montarChat("nino", respondeSiempre("Te faltan 20 monedas."));

    await preguntar(usuario, "¿cuánto me falta?");

    /*
     * Se espera a la RESPUESTA, no al título: el título, la introducción y el
     * campo se pintan antes de que llegue nada, así que esperarlos dejaría
     * comprobando sobre un esqueleto.
     */
    expect(await screen.findByText("Te faltan 20 monedas.")).toBeTruthy();
    expect(screen.getByText("¿cuánto me falta?")).toBeTruthy();
  });

  it("cada turno dice QUIÉN habla, no solo se distingue por color", async () => {
    const usuario = userEvent.setup();
    await montarChat("nino", respondeSiempre("Hola."));

    await preguntar(usuario, "hola");
    await screen.findByText("Hola.");

    // Acotado a la LISTA de turnos: el logotipo de la cabecera también dice
    // «Monedín», y buscarlo en toda la pantalla encontraría dos.
    const hilo = within(screen.getByRole("list"));

    expect(hilo.getByText(messages.assistant.you)).toBeTruthy();
    expect(hilo.getByText(messages.assistant.monedin)).toBeTruthy();
  });

  it("el campo se vacía al enviar, para poder escribir la siguiente", async () => {
    const usuario = userEvent.setup();
    await montarChat("padre", respondeSiempre("Listo."));

    await preguntar(usuario, "hola");
    await screen.findByText("Listo.");

    expect((screen.getByLabelText(messages.assistant.inputLabel) as HTMLInputElement).value).toBe("");
  });
});

describe("el hilo previo viaja en la siguiente pregunta", () => {
  /*
   * Es lo único que prueba de verdad la memoria del hilo, y por eso se
   * inspecciona el CUERPO enviado y no lo que se ve. «Lleva algo» no
   * distinguiría un hilo correcto de uno con los turnos al revés o repetidos:
   * se comprueba la cuenta exacta, los textos y el orden.
   */
  it("la segunda petición lleva exactamente los dos turnos anteriores", async () => {
    const usuario = userEvent.setup();
    const { enviados } = await montarChat("padre", (n) => ({
      ok: true as const,
      answer: n === 1 ? "PRIMERA-RESPUESTA" : "SEGUNDA-RESPUESTA",
    }));

    await preguntar(usuario, "PRIMERA-PREGUNTA");
    await screen.findByText("PRIMERA-RESPUESTA");

    await preguntar(usuario, "SEGUNDA-PREGUNTA");
    await screen.findByText("SEGUNDA-RESPUESTA");

    expect(enviados).toHaveLength(2);
    // La primera no lleva hilo: no había nada antes.
    expect(enviados[0]?.history).toEqual([]);
    expect(enviados[1]?.question).toBe("SEGUNDA-PREGUNTA");
    expect(enviados[1]?.history).toEqual([
      { role: "user", text: "PRIMERA-PREGUNTA" },
      { role: "assistant", text: "PRIMERA-RESPUESTA" },
    ]);
  });
});

describe("cuando Monedín no puede responder", () => {
  it("lo cuenta como ADVERTENCIA y no como error", async () => {
    const usuario = userEvent.setup();
    await montarChat("nino", () => ({
      ok: false as const,
      status: 503,
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
    }));

    await preguntar(usuario, "hola");

    const aviso = (await screen.findByText(messages.assistant.unavailable)).closest(
      '[role="alert"]',
    );

    /*
     * Se mira la CLASE y no el `role`, porque el `role` no los distingue:
     * `Alert` da `role="alert"` tanto a `conflict` como a `danger` —los dos
     * interrumpen— y reserva `status` para lo que no interrumpe. Lo que separa
     * un aviso en el tono del conflicto de uno rojo es su tono, y en jsdom eso solo se ve en la
     * clase.
     *
     * Y hace falta la aserción NEGATIVA: comprobar solo que el texto aparece
     * dejaría este test en verde con la rama del 503 quitada de `alertToneFor`,
     * que es exactamente la regresión que persigue.
     */
    expect(aviso?.className).toContain("bg-conflict-soft");
    expect(aviso?.className).not.toContain("bg-danger-soft");
  });

  it("CONSERVA la pregunta y ofrece reintentarla", async () => {
    const usuario = userEvent.setup();
    const { enviados } = await montarChat("nino", (n) =>
      n === 1
        ? { ok: false as const, status: 503, code: ERROR_CODES.SERVICE_UNAVAILABLE }
        : { ok: true as const, answer: "Ahora sí." },
    );

    await preguntar(usuario, "MI-PREGUNTA");
    await screen.findByText(messages.assistant.unavailable);

    // La pregunta sigue ahí: borrar lo que alguien acaba de escribir es la peor
    // respuesta a un fallo que no es suyo.
    expect(screen.getByText("MI-PREGUNTA")).toBeTruthy();

    await usuario.click(screen.getByRole("button", { name: messages.assistant.retry }));
    expect(await screen.findByText("Ahora sí.")).toBeTruthy();

    // Y reintentar NO vuelve a apilar la pregunta: ya estaba en el hilo.
    expect(enviados[1]?.question).toBe("MI-PREGUNTA");
    expect(enviados[1]?.history).toEqual([]);
    expect(screen.getAllByText("MI-PREGUNTA")).toHaveLength(1);
  });

  it("un fallo nuestro sí se pinta como peligro", async () => {
    const usuario = userEvent.setup();
    await montarChat("padre", () => ({
      ok: false as const,
      status: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
    }));

    await preguntar(usuario, "hola");

    const aviso = (await screen.findByText(messages.errors.network)).closest('[role="alert"]');

    // El otro lado del par: sin este caso, un `alertToneFor` que devolviera
    // siempre `warning` pasaría el test de arriba.
    expect(aviso?.className).toContain("bg-danger-soft");
  });
});

describe("la conversación no sobrevive a la navegación", () => {
  /*
   * Fija desde el front la decisión de no persistir nada. Es lo OPUESTO a
   * `?manage=true`, que tenía que sobrevivir al viaje al teclado de PIN: aquel
   * fue a la dirección justamente porque debía cruzar una navegación, y este se
   * queda en `useState` porque debe morir con ella.
   */
  it("salir y volver deja el hilo vacío", async () => {
    const usuario = userEvent.setup();
    const { ir } = await montarChat("nino", respondeSiempre("Una respuesta."));

    await preguntar(usuario, "UNA-PREGUNTA");
    await screen.findByText("Una respuesta.");

    await ir("/me/tasks");
    await waitFor(() => {
      expect(screen.queryByText("Una respuesta.")).toBeNull();
    });

    await ir("/assistant");

    await screen.findByRole("heading", { name: messages.assistant.title });
    expect(screen.queryByText("UNA-PREGUNTA")).toBeNull();
    expect(screen.queryByText("Una respuesta.")).toBeNull();
  });
});

describe("es un destino de los DOS roles", () => {
  it.each(["padre", "nino"] as const)("un %s llega sin ser redirigido", async (quien) => {
    const { direccion } = await montarChat(quien, respondeSiempre("hola"));

    expect(direccion()).toBe("/assistant");
    expect(screen.getByRole("heading", { name: messages.assistant.title })).toBeTruthy();
  });
});

/**
 * La forma de la conversación, desde `redesign-assistant-chat`.
 *
 * Antes eran tarjetas iguales una debajo de otra y lo único que separaba una
 * pregunta de una respuesta era leer la etiqueta. Ahora se distingue por TRES
 * señales a la vez, y los tests las persiguen por separado: si alguien quitara
 * una, el resto seguiría en verde y nadie se enteraría.
 */
describe("un turno se distingue del anterior sin leer de quién es", () => {
  /** Los globos: el elemento con la superficie, dentro de cada turno de la lista. */
  function globos(): HTMLElement[] {
    return [...document.querySelectorAll("li > div")] as HTMLElement[];
  }

  it("no comparten superficie ni alineación", async () => {
    const usuario = userEvent.setup();
    await montarChat("nino", respondeSiempre("Tienes 120 monedas."));

    await preguntar(usuario, "¿cuántas tengo?");
    await screen.findByText("Tienes 120 monedas.");

    const filas = [...document.querySelectorAll("li")] as HTMLElement[];
    expect(filas).toHaveLength(2);

    // POSICIÓN: uno a cada lado. Es lo que se lee de un vistazo.
    expect(filas[0]?.className).toContain("justify-end");
    expect(filas[1]?.className).toContain("justify-start");

    // COLOR: superficies distintas. Distingue con la pantalla en blanco y negro.
    const [mio, suyo] = globos();
    expect(mio?.className).not.toBe(suyo?.className);
    expect(suyo?.className).toContain("bg-coin-soft");
    expect(mio?.className).not.toContain("bg-coin-soft");
  });

  /*
   * La tercera señal, y la que NO se puede perder por hacerlo más bonito: la
   * etiqueta escrita es lo único que oye quien no ve la pantalla. El requisito
   * dice que la respuesta se atribuye «y no solo distinguida por un color».
   */
  it("cada turno sigue diciendo de quién es, sin ver nada", async () => {
    const usuario = userEvent.setup();
    await montarChat("nino", respondeSiempre("Hola."));

    await preguntar(usuario, "hola");
    await screen.findByText("Hola.");

    const hilo = within(screen.getByRole("list"));
    expect(hilo.getByText(messages.assistant.you)).toBeTruthy();
    expect(hilo.getByText(messages.assistant.monedin)).toBeTruthy();
  });

  it("un turno corto no ocupa la línea entera", async () => {
    const usuario = userEvent.setup();
    await montarChat("padre", respondeSiempre("Sí."));

    await preguntar(usuario, "¿sí?");
    await screen.findByText("Sí.");

    // Cada globo lleva su tope: un bloque de borde a borde no se lee como algo
    // que alguien dijo.
    for (const globo of globos()) {
      expect(globo.className).toContain("max-w-");
    }
  });
});

/**
 * Monedín y las sugerencias viven en la columna de la derecha, que SOLO existe
 * cuando hay ancho.
 *
 * Las dos decisiones cambiaron al ver la pantalla montada, y las dos en la misma
 * dirección: en un teléfono lo único que cabe es el chat. La mascota se retiraba
 * al empezar a conversar y ahora se queda —es con quien se habla, y quitarla
 * dejaba la pantalla sin la cara que le da nombre—; las sugerencias bajaban
 * debajo del hilo en estrecho y ahora no se montan, porque comían el alto que
 * necesita lo que se va a leer.
 */
describe("la columna de la derecha solo existe con ancho", () => {
  function mascota(): Element | null {
    return document.querySelector("aside img");
  }

  function sugerencia(): HTMLElement[] {
    return screen.queryAllByRole("button", { name: new RegExp(messages.assistant.ideaBalance) });
  }

  it("en estrecho NO hay ni mascota ni sugerencias: la pantalla es el chat", async () => {
    await montarChat("nino", respondeSiempre("hola"));

    expect(mascota()).toBeNull();
    // Se CUENTAN, no se mira si se ven: jsdom no aplica CSS, así que esconderlas
    // con `hidden` pasaría este test mientras siguen ahí para quien recorre el
    // documento con teclado.
    expect(sugerencia()).toHaveLength(0);
    // Y el chat sí está, que es la otra mitad: si no se montara nada, lo de
    // arriba pasaría en verde.
    expect(screen.getByLabelText(messages.assistant.inputLabel)).toBeTruthy();
  });

  it("en ancho están las dos", async () => {
    conPantallaAncha();
    await montarChat("nino", respondeSiempre("hola"));

    expect(mascota()).not.toBeNull();
    expect(sugerencia()).toHaveLength(1);
  });

  /*
   * SIEMPRE, antes y después de conversar. Es el cambio respecto a la primera
   * versión, y se comprueba en los dos momentos porque medio test —solo el hilo
   * vacío— pasaría con la versión que las retiraba.
   */
  it("siguen ahí con la conversación empezada", async () => {
    conPantallaAncha();
    const usuario = userEvent.setup();
    await montarChat("nino", respondeSiempre("Ya te cuento."));

    expect(mascota()).not.toBeNull();
    expect(sugerencia()).toHaveLength(1);

    await preguntar(usuario, "hola");
    await screen.findByText("Ya te cuento.");

    expect(mascota()).not.toBeNull();
    expect(sugerencia()).toHaveLength(1);
  });

  it("elegir una la PREGUNTA, no la escribe en el campo", async () => {
    conPantallaAncha();
    const usuario = userEvent.setup();
    const { enviados } = await montarChat("nino", respondeSiempre("Con tareas."));

    await usuario.click(sugerencia()[0]!);

    // Se envió de verdad, y aparece en el hilo como suya.
    await screen.findByText("Con tareas.");
    expect(enviados[0]?.question).toBe(messages.assistant.ideaBalance);
    // Y el campo sigue vacío: rellenarlo pediría un segundo gesto para algo que
    // ya se decidió al pulsar.
    expect(
      (screen.getByLabelText(messages.assistant.inputLabel) as HTMLInputElement).value,
    ).toBe("");
  });
});

/**
 * El campo de escribir no se va con los mensajes.
 *
 * Es la única pantalla del producto que desplaza por dentro. Que el campo se
 * quede abajo no se puede medir en jsdom —no aplica CSS ni calcula alto— pero sí
 * se puede comprobar lo que lo hace cierto: que el campo NO esté dentro del
 * elemento que desplaza. Si alguien lo metiera dentro, se iría con el hilo.
 */
describe("el campo de escribir se queda abajo", () => {
  it("no está dentro del contenedor que desplaza", async () => {
    const usuario = userEvent.setup();
    await montarChat("nino", respondeSiempre("Hola."));

    await preguntar(usuario, "hola");
    await screen.findByText("Hola.");

    const desplazable = document.querySelector(".overflow-y-auto");
    expect(desplazable, "no hay ningún contenedor que desplace").not.toBeNull();

    // El hilo SÍ está dentro.
    expect(desplazable?.contains(screen.getByRole("list"))).toBe(true);
    // Y el campo NO.
    expect(desplazable?.contains(screen.getByLabelText(messages.assistant.inputLabel))).toBe(
      false,
    );
  });
});

/**
 * El hueco del hilo vacío dice para qué sirve.
 *
 * Antes estaba en blanco y lo único que sugería que se podía escribir era el
 * campo de abajo.
 */
/**
 * El hilo baja al mensaje nuevo.
 *
 * Sin esto, la respuesta que se acaba de pedir aparece FUERA de la vista: el
 * hilo desplaza por dentro, crece hacia abajo, y la parte visible se queda donde
 * estaba. Ningún test de los que miran texto lo caza, porque el nodo SÍ está en
 * el documento — se vio abriendo la aplicación, con la última respuesta cortada.
 *
 * jsdom no calcula alto, así que `scrollHeight` es 0 y no se puede comprobar que
 * quede abajo del todo. Lo que SÍ se puede comprobar, y es donde está el riesgo,
 * es que alguien tocó el desplazamiento al llegar un turno: si el efecto
 * desapareciera, esto vuelve a ser lo que era.
 */
describe("el hilo baja al mensaje nuevo", () => {
  it("mueve el desplazamiento del hilo al recibir una respuesta", async () => {
    const usuario = userEvent.setup();
    await montarChat("nino", respondeSiempre("Una respuesta larga."));

    const desplazable = document.querySelector(".overflow-y-auto") as HTMLElement;
    // jsdom deja `scrollHeight` en 0, así que se finge un hilo con alto para que
    // asignar `scrollTop` tenga algo que asignar.
    Object.defineProperty(desplazable, "scrollHeight", { value: 800, configurable: true });
    desplazable.scrollTop = 0;

    await preguntar(usuario, "hola");
    await screen.findByText("Una respuesta larga.");

    expect(desplazable.scrollTop).toBe(800);
  });
});

/**
 * EL HILO VACÍO YA NO ES UNA FRASE GRIS: es Monedín saludando.
 *
 * Este caso buscaba una invitación centrada que decía para qué sirve la
 * pantalla. Explicaba, sí, pero dejaba el chat vacío de verdad. Ahora se abre
 * con un turno suyo, que enseña cómo se ve un turno antes de escribir ninguno y
 * saluda con LO QUE HAY, así que la primera pregunta tiene de dónde salir.
 *
 * Se comprueban las dos mitades, igual que antes: que el saludo está, y que se
 * va al primer mensaje — si se quedara, competiría con la conversación.
 */
describe("con el hilo vacío Monedín saluda", () => {
  it("saluda al entrar, y deja sitio al primer mensaje", async () => {
    const usuario = userEvent.setup();
    await montarChat("nino", respondeSiempre("Claro."));

    const saludo = await screen.findByText(new RegExp(messages.assistant.greetAskChild));
    expect(saludo).toBeTruthy();

    await preguntar(usuario, "hola");
    await screen.findByText("Claro.");

    expect(screen.queryByText(new RegExp(messages.assistant.greetAskChild))).toBeNull();
  });

  /*
   * Y saluda con lo que HAY, que es la mitad que lo distingue de un texto fijo:
   * con otro saldo, el saludo dice otra cosa. Sin este caso, un saludo escrito a
   * mano pasaría igual.
   */
  it("y lo que dice depende del saldo de quien entra", async () => {
    await montarChat("nino", respondeSiempre("Claro."));

    const saludo = await screen.findByText(new RegExp(messages.assistant.greetAskChild));

    // El saldo del actor de prueba, tomado de donde vive y no escrito otra vez.
    expect(saludo.textContent).toContain(String(comoNino().actor?.coins));
  });
});

/**
 * LAS IDEAS SON DE QUIEN PREGUNTA, y eran las del niño para los dos.
 *
 * A un padre se le ofrecía «¿qué me falta por hacer?» y «¿para qué premio me
 * alcanza?». No son preguntas suyas: él reparte tareas y pone precios, no las
 * hace ni ahorra. El mismo defecto tenía la frase de la cabecera, que le decía
 * que Monedín conoce «tus monedas» cuando las monedas son de sus hijos.
 *
 * El test monta LOS DOS y compara: con un solo rol, cualquiera de los dos juegos
 * pasaría — que es exactamente cómo estaba antes.
 */
describe("cada rol recibe sus propias ideas", () => {
  it("al niño se le ofrecen las suyas y al padre las suyas", async () => {
    // Las sugerencias viven en la columna de la derecha, que solo se monta con
    // ancho: en estrecho la pantalla es el chat y nada más.
    conPantallaAncha();

    await montarChat("nino", respondeSiempre("Claro."));
    expect(await screen.findByRole("button", { name: messages.assistant.ideaRewards })).toBeTruthy();
    expect(screen.queryByRole("button", { name: messages.assistant.ideaPrice })).toBeNull();

    cleanup();
    conPantallaAncha();

    await montarChat("padre", respondeSiempre("Claro."));
    expect(await screen.findByRole("button", { name: messages.assistant.ideaPrice })).toBeTruthy();
    expect(screen.queryByRole("button", { name: messages.assistant.ideaRewards })).toBeNull();
  });
});

import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { routeTree } from "../../src/routeTree.gen";
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
     * `Alert` da `role="alert"` tanto a `warning` como a `danger` —los dos
     * interrumpen— y reserva `status` para lo que no interrumpe. Lo que separa
     * un aviso ámbar de uno rojo es su tono, y en jsdom eso solo se ve en la
     * clase.
     *
     * Y hace falta la aserción NEGATIVA: comprobar solo que el texto aparece
     * dejaría este test en verde con la rama del 503 quitada de `alertToneFor`,
     * que es exactamente la regresión que persigue.
     */
    expect(aviso?.className).toContain("bg-warning-soft");
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

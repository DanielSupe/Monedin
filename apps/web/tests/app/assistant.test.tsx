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
  enviados: Enviado[];
  direccion: () => string;

  ir: (destino: string) => Promise<void>;
}

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

    expect(await screen.findByText("Te faltan 20 monedas.")).toBeTruthy();
    expect(screen.getByText("¿cuánto me falta?")).toBeTruthy();
  });

  it("cada turno dice QUIÉN habla, no solo se distingue por color", async () => {
    const usuario = userEvent.setup();
    await montarChat("nino", respondeSiempre("Hola."));

    await preguntar(usuario, "hola");
    await screen.findByText("Hola.");

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

    expect(screen.getByText("MI-PREGUNTA")).toBeTruthy();

    await usuario.click(screen.getByRole("button", { name: messages.assistant.retry }));
    expect(await screen.findByText("Ahora sí.")).toBeTruthy();

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

    expect(aviso?.className).toContain("bg-danger-soft");
  });
});

describe("la conversación no sobrevive a la navegación", () => {
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

describe("un turno se distingue del anterior sin leer de quién es", () => {
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

    expect(filas[0]?.className).toContain("justify-end");
    expect(filas[1]?.className).toContain("justify-start");

    const [mio, suyo] = globos();
    expect(mio?.className).not.toBe(suyo?.className);
    expect(suyo?.className).toContain("bg-coin-soft");
    expect(mio?.className).not.toContain("bg-coin-soft");
  });

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

    for (const globo of globos()) {
      expect(globo.className).toContain("max-w-");
    }
  });
});

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

    expect(sugerencia()).toHaveLength(0);

    expect(screen.getByLabelText(messages.assistant.inputLabel)).toBeTruthy();
  });

  it("en ancho están las dos", async () => {
    conPantallaAncha();
    await montarChat("nino", respondeSiempre("hola"));

    expect(mascota()).not.toBeNull();
    expect(sugerencia()).toHaveLength(1);
  });

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

    await screen.findByText("Con tareas.");
    expect(enviados[0]?.question).toBe(messages.assistant.ideaBalance);

    expect(
      (screen.getByLabelText(messages.assistant.inputLabel) as HTMLInputElement).value,
    ).toBe("");
  });
});

describe("el campo de escribir se queda abajo", () => {
  it("no está dentro del contenedor que desplaza", async () => {
    const usuario = userEvent.setup();
    await montarChat("nino", respondeSiempre("Hola."));

    await preguntar(usuario, "hola");
    await screen.findByText("Hola.");

    const desplazable = document.querySelector(".overflow-y-auto");
    expect(desplazable, "no hay ningún contenedor que desplace").not.toBeNull();

    expect(desplazable?.contains(screen.getByRole("list"))).toBe(true);

    expect(desplazable?.contains(screen.getByLabelText(messages.assistant.inputLabel))).toBe(
      false,
    );
  });
});

describe("el hilo baja al mensaje nuevo", () => {
  it("mueve el desplazamiento del hilo al recibir una respuesta", async () => {
    const usuario = userEvent.setup();
    await montarChat("nino", respondeSiempre("Una respuesta larga."));

    const desplazable = document.querySelector(".overflow-y-auto") as HTMLElement;

    Object.defineProperty(desplazable, "scrollHeight", { value: 800, configurable: true });
    desplazable.scrollTop = 0;

    await preguntar(usuario, "hola");
    await screen.findByText("Una respuesta larga.");

    expect(desplazable.scrollTop).toBe(800);
  });
});

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

  it("y lo que dice depende del saldo de quien entra", async () => {
    await montarChat("nino", respondeSiempre("Claro."));

    const saludo = await screen.findByText(new RegExp(messages.assistant.greetAskChild));

    expect(saludo.textContent).toContain(String(comoNino().actor?.coins));
  });
});

describe("cada rol recibe sus propias ideas", () => {
  it("al niño se le ofrecen las suyas y al padre las suyas", async () => {
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

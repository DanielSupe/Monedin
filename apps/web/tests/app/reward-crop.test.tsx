import { AVATAR_MAX_DIMENSION, PHOTO_MAX_DIMENSION, type OwnTask } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { comoNino, comoPadre } from "../support/router.js";

/**
 * `ImageUploadField` se sustituye por un marcador que expone lo que recibe.
 *
 * Lo que hay que comprobar es QUÉ PAR pide cada punto de uso —si recorta y con
 * cuánto detalle guarda— y ese par no llega al DOM de ninguna otra forma.
 *
 * NO se prueba el recorte de punta a punta, y conviene decir por qué:
 * `react-easy-crop` mide su lienzo para calcular el área, jsdom no hace layout,
 * así que su `onCropComplete` nunca dispara y la subida no llega a ocurrir. Eso
 * se comprueba abriendo la aplicación, y está escrito como tarea.
 */
vi.mock("../../src/features/uploads/ImageUploadField.js", () => ({
  ImageUploadField: ({ aspect, maxDimension }: { aspect?: number; maxDimension: number }) => (
    <div
      data-testid="campo-de-imagen"
      data-aspect={aspect === undefined ? "sin-recorte" : String(aspect)}
      data-max={String(maxDimension)}
    />
  ),
}));

const { RewardForm } = await import("../../src/features/rewards/RewardForm.js");
const { RewardImage } = await import("../../src/features/rewards/RewardImage.js");
const { AvatarPicker } = await import("../../src/features/profiles/AvatarPicker.js");
const { MyTasks } = await import("../../src/features/tasks/MyTasks.js");

afterEach(() => {
  vi.unstubAllGlobals();
});

function json(cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function pagina<T>(items: T[]): unknown {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

function servir(sesion: "padre" | "nino", extra: Record<string, unknown> = {}): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL) => {
      const url = String(entrada);

      if (url.includes("/auth/session"))
        return Promise.resolve(json(sesion === "padre" ? comoPadre() : comoNino()));
      if (url.includes("/auth/profiles")) return Promise.resolve(json({ profiles: [] }));

      for (const [fragmento, cuerpo] of Object.entries(extra)) {
        if (url.includes(fragmento)) return Promise.resolve(json(cuerpo));
      }

      return Promise.resolve(json(pagina([])));
    }),
  );
}

function montar(pantalla: React.ReactElement): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}>{pantalla}</QueryClientProvider>);
}

/** El par que pidió el campo de imagen de la pantalla. */
function parPedido(): { aspect: string | null; max: string | null } {
  const campo = screen.getByTestId("campo-de-imagen");
  return { aspect: campo.getAttribute("data-aspect"), max: campo.getAttribute("data-max") };
}

const HIJO = {
  id: "h1",
  name: "Mateo",
  avatar: "zorro",
  age: 8,
  coins: 120,
  locked: false,
  createdAt: "2026-09-01T10:00:00.000Z",
};

const TAREA: OwnTask = {
  id: "t1",
  title: "Recoger la mesa",
  description: null,
  coins: 20,
  status: "PENDING",
  dueDate: null,
  evidence: null,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
};

/**
 * Lo que este change existe para quitar de en medio.
 *
 * `aspect` decidía DOS cosas: si se recortaba y —vía `forAvatar`— si el
 * resultado se reducía a 512 px o a 1280. Pedir recorte para un premio le habría
 * encogido la foto a tamaño de avatar para una tesela que ocupa media tablet.
 */
describe("cada punto de uso pide su forma y su tamaño por separado", () => {
  it("el alta de un premio recorta y guarda detalle de FOTO", async () => {
    servir("padre", { "/children": pagina([HIJO]) });
    montar(<RewardForm onSaved={() => {}} />);

    await screen.findByText(messages.rewards.newRewardTitle);

    expect(parPedido()).toEqual({ aspect: "1", max: String(PHOTO_MAX_DIMENSION) });
  });

  it("un avatar recorta y guarda a medida de AVATAR", () => {
    montar(
      <AvatarPicker
        value="zorro"
        onChange={() => {}}
        label={messages.children.chooseAvatar}
        requestUploadUrl={() =>
          Promise.resolve({ uploadUrl: "https://x.dev", key: "k", expiresAt: "2026-09-04" })
        }
        onUpload={() => {}}
      />,
    );

    expect(parPedido()).toEqual({ aspect: "1", max: String(AVATAR_MAX_DIMENSION) });
  });

  it("una evidencia NO recorta, y guarda detalle de foto", async () => {
    servir("nino", { "/tasks/mine": pagina([TAREA]) });
    montar(<MyTasks />);

    await screen.findByText("Recoger la mesa");

    expect(parPedido()).toEqual({ aspect: "sin-recorte", max: String(PHOTO_MAX_DIMENSION) });
  });

  /*
   * El caso que de verdad prueba la separación, y por eso mira DOS pantallas.
   *
   * El premio comparte forma con el avatar y NO su tamaño; comparte tamaño con
   * la evidencia y NO su forma. Con las dos decisiones atadas en una sola prop,
   * uno de esos dos pares sería imposible de expresar — que es exactamente lo
   * que pasaba antes.
   */
  it("el premio comparte forma con el avatar y tamaño con la evidencia", async () => {
    servir("padre", { "/children": pagina([HIJO]) });
    montar(<RewardForm onSaved={() => {}} />);
    await screen.findByText(messages.rewards.newRewardTitle);
    const premio = parPedido();

    cleanup();
    vi.unstubAllGlobals();

    servir("nino", { "/tasks/mine": pagina([TAREA]) });
    montar(<MyTasks />);
    await screen.findByText("Recoger la mesa");
    const evidencia = parPedido();

    expect(premio.aspect).not.toBe(evidencia.aspect);
    expect(premio.max).toBe(evidencia.max);
    // Y NO es el de un avatar, que es lo que le habría tocado con las dos
    // decisiones atadas.
    expect(premio.max).not.toBe(String(AVATAR_MAX_DIMENSION));
  });
});

/**
 * La otra mitad del arreglo de la rejilla.
 *
 * Recortar endereza las fotos NUEVAS. Las que ya están subidas conservan su
 * proporción, así que sin una caja fija una apaisada seguiría descuadrando su
 * fila.
 */
describe("la imagen de un premio ocupa siempre la misma caja", () => {
  /** Solo las clases que deciden la caja. */
  const caja = (elemento: HTMLElement): string[] =>
    elemento.className.split(/\s+/).filter((clase) => /^aspect-|^h-|^max-h-|^w-/.test(clase));

  it("con foto y sin ella dan la MISMA caja", () => {
    const { container: conFoto } = render(
      <RewardImage image="https://almacen.ejemplo.dev/a.jpg" title="Helado" />,
    );
    const foto = conFoto.firstElementChild as HTMLElement;

    const { container: sinFoto } = render(<RewardImage image={null} title="Cine" />);
    const respaldo = sinFoto.firstElementChild as HTMLElement;

    /*
     * Se comparan las dos ENTRE SÍ, no se comprueba que cada una tiene caja:
     * eran `max-h-40` y `h-40`, dos declaraciones distintas —una un máximo, la
     * otra fija—, y mirarlas por separado no lo habría visto.
     */
    expect(caja(foto)).toEqual(caja(respaldo));
    expect(caja(foto)).toContain("aspect-square");
  });

  it("la foto se encuadra sin deformarse", () => {
    const { container } = render(
      <RewardImage image="https://almacen.ejemplo.dev/apaisada.jpg" title="Helado" />,
    );

    // `object-cover` recorta al mostrar, que es lo que deja ver una foto vieja de
    // otra proporción sin reprocesar nada en el almacén.
    expect((container.firstElementChild as HTMLElement).className).toContain("object-cover");
  });
});

/**
 * El contrato de `prepareImage`, que es donde vivía la bandera.
 *
 * Recibe la medida y ya no la deduce de si le dijeron que era un avatar. La
 * FIRMA es la comprobación: con la bandera eran un blob y un objeto de opciones.
 */
describe("prepareImage usa la medida que recibe", () => {
  it("no queda ninguna bandera que la deduzca", async () => {
    const modulo = await import("../../src/features/uploads/prepare-image.js");

    expect(modulo.prepareImage.length).toBe(2);
  });
});

import { API_PREFIX, type OwnRedemption, type OwnReward } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MyRedemptions } from "../../src/features/redemptions/MyRedemptions.js";
import { MyRewards } from "../../src/features/rewards/MyRewards.js";
import { messages } from "../../src/lib/messages.js";
import { comoNino } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** El saldo de `comoNino()` son 120 monedas. */
const SALDO = 120;

const PREMIOS: OwnReward[] = [
  {
    id: "r1",
    title: "Helado",
    description: null,
    coins: 60,
    image: null,
    affordable: true,
    createdAt: "2026-08-31T10:00:00.000Z",
  },
  {
    id: "r2",
    title: "Ir al cine",
    description: null,
    coins: 200,
    image: null,
    affordable: false,
    createdAt: "2026-08-31T10:00:00.000Z",
  },
];

const CANJES: OwnRedemption[] = [
  {
    id: "c1",
    coins: 60,
    status: "PENDING",
    reward: { id: "r1", title: "Helado" },
    createdAt: "2026-08-31T10:00:00.000Z",
    updatedAt: "2026-08-31T10:00:00.000Z",
  },
  {
    id: "c2",
    coins: 60,
    status: "APPROVED",
    reward: { id: "r1", title: "Helado" },
    createdAt: "2026-08-31T10:00:00.000Z",
    updatedAt: "2026-08-31T10:00:00.000Z",
  },
  {
    id: "c3",
    coins: 60,
    status: "REJECTED",
    reward: { id: "r1", title: "Helado" },
    createdAt: "2026-08-31T10:00:00.000Z",
    updatedAt: "2026-08-31T10:00:00.000Z",
  },
];

function pagina<T>(items: T[]): unknown {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

function servir(premios: OwnReward[], canjes: OwnRedemption[]): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL) => {
      const url = String(entrada);

      const cuerpo = url.startsWith(`${API_PREFIX}/auth/session`)
        ? comoNino()
        : url.startsWith(`${API_PREFIX}/rewards/mine`)
          ? pagina(premios)
          : url.startsWith(`${API_PREFIX}/redemptions/mine`)
            ? pagina(canjes)
            : {};

      return Promise.resolve(
        new Response(JSON.stringify(cuerpo), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
}

function montar(pantalla: React.ReactElement): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(<QueryClientProvider client={queryClient}>{pantalla}</QueryClientProvider>);
}

/**
 * `ProgressBar` se escribió en `add-design-system` para este caso exacto —lo
 * dice su cabecera— y hasta este change solo la usaba el catálogo. Ver cuánto
 * falta para una meta es la mitad del ciclo que el producto enseña.
 */
describe("lo que le falta a un niño se ve como progreso", () => {
  it("un premio que no alcanza enseña la distancia, con su valor y su meta", async () => {
    servir(PREMIOS, []);
    montar(<MyRewards />);

    const caro = (await screen.findByText("Ir al cine")).closest("li") as HTMLElement;
    const barra = within(caro).getByRole("progressbar");

    expect(barra).toHaveAttribute("aria-valuenow", String(SALDO));
    expect(barra).toHaveAttribute("aria-valuemax", "200");

    // La cifra se queda: la barra dice «estás por aquí» y el número dice cuánto.
    expect(caro).toHaveTextContent(`${messages.rewards.missingPrefix} 80`);
  });

  it("un premio que sí alcanza ofrece pedirlo y no enseña distancia", async () => {
    servir(PREMIOS, []);
    montar(<MyRewards />);

    const barato = (await screen.findByText("Helado")).closest("li") as HTMLElement;

    expect(within(barato).queryByRole("progressbar")).toBeNull();
    expect(
      within(barato).getByRole("button", { name: messages.redemptions.request }),
    ).toBeInTheDocument();
  });

  it("un premio ya pedido no ofrece volver a pedirlo", async () => {
    servir(PREMIOS, [CANJES[0] as OwnRedemption]);
    montar(<MyRewards />);

    const barato = (await screen.findByText("Helado")).closest("li") as HTMLElement;

    expect(within(barato).getByText(messages.redemptions.alreadyRequested)).toBeInTheDocument();
    expect(within(barato).queryByRole("button", { name: messages.redemptions.request })).toBeNull();
  });
});

/**
 * No son tres variantes de lo mismo: aprobar descuenta y rechazar es terminal
 * y no devuelve nada, porque el descuento solo ocurre al aprobar.
 */
describe("el estado de un canje se distingue por su forma", () => {
  it("los tres estados llevan su etiqueta", async () => {
    servir([], CANJES);
    montar(<MyRedemptions />);

    expect(await screen.findByText(messages.redemptions.statusPending)).toBeInTheDocument();
    expect(screen.getByText(messages.redemptions.statusApproved)).toBeInTheDocument();
    expect(screen.getByText(messages.redemptions.statusRejected)).toBeInTheDocument();
  });

  /*
   * Y se DISTINGUEN, que es lo que pide la spec.
   *
   * La primera versión de este test solo comprobaba que las tres etiquetas
   * estuvieran, y eso ya pasaba antes de vestir la pantalla: al inyectar el
   * mismo tono en los tres estados, el test seguía en verde. Un test que no
   * falla ante la violación que persigue no está probando nada.
   */
  it("y se distinguen entre sí, no solo por su texto", async () => {
    servir([], CANJES);
    montar(<MyRedemptions />);

    await screen.findByText(messages.redemptions.statusPending);

    const tonos = [
      messages.redemptions.statusPending,
      messages.redemptions.statusApproved,
      messages.redemptions.statusRejected,
    ].map((texto) => screen.getByText(texto).className);

    expect(new Set(tonos).size).toBe(3);
  });
});

import { API_PREFIX } from "@monedin/contracts";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { comoNino, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("data-theme");
});

function estampado(): string | null {
  return document.documentElement.getAttribute("data-theme");
}

describe("el marco aplica el tema del perfil", () => {
  it("un perfil en oscuro lo estampa en la raíz", async () => {
    await montarApp("/", { ...comoNino(), actor: { ...comoNino().actor!, theme: "DARK" } });

    expect(estampado()).toBe("dark");
  });

  it("uno en claro, también", async () => {
    await montarApp("/", { ...comoPadre(), actor: { ...comoPadre().actor!, theme: "LIGHT" } });

    expect(estampado()).toBe("light");
  });

  it("y seguir al sistema no escribe nada", async () => {
    await montarApp("/", comoNino());

    expect(estampado()).toBeNull();
  });
});

describe("la cabecera ofrece cambiar de tema", () => {
  function espiarGuardado(theme: "SYSTEM" | "LIGHT" | "DARK") {
    const enviados: string[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn((entrada: RequestInfo | URL, init?: RequestInit) => {
        const url = String(entrada);

        if (init?.method === "PATCH" && url.includes("/auth/theme")) {
          enviados.push(String(init.body));
          return Promise.resolve(new Response(null, { status: 204 }));
        }

        const cuerpo = url.startsWith(`${API_PREFIX}/auth/session`)
          ? { ...comoNino(), actor: { ...comoNino().actor!, theme } }
          : url.startsWith(`${API_PREFIX}/auth/profiles`)
            ? { profiles: [] }
            : { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };

        return Promise.resolve(
          new Response(JSON.stringify(cuerpo), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }),
    );

    return enviados;
  }

  it("se anuncia con el estado en el que está, y cambia con él", async () => {
    await montarApp("/", { ...comoNino(), actor: { ...comoNino().actor!, theme: "DARK" } });

    expect(
      await screen.findByRole("button", { name: messages.nav.themeDark }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: messages.nav.themeLight })).toBeNull();
  });

  it("desde seguir al sistema, el siguiente paso es el claro", async () => {
    await montarApp("/", comoNino());
    const enviados = espiarGuardado("SYSTEM");

    await userEvent.click(await screen.findByRole("button", { name: messages.nav.themeSystem }));

    expect(enviados).toEqual([JSON.stringify({ theme: "LIGHT" })]);
  });

  it("desde el claro, el oscuro", async () => {
    await montarApp("/", { ...comoNino(), actor: { ...comoNino().actor!, theme: "LIGHT" } });
    const enviados = espiarGuardado("LIGHT");

    await userEvent.click(await screen.findByRole("button", { name: messages.nav.themeLight }));

    expect(enviados).toEqual([JSON.stringify({ theme: "DARK" })]);
  });

  it("y desde el oscuro se vuelve a seguir al sistema", async () => {
    await montarApp("/", { ...comoNino(), actor: { ...comoNino().actor!, theme: "DARK" } });
    const enviados = espiarGuardado("DARK");

    await userEvent.click(await screen.findByRole("button", { name: messages.nav.themeDark }));

    expect(enviados).toEqual([JSON.stringify({ theme: "SYSTEM" })]);
  });

  it("el padre lo tiene igual", async () => {
    await montarApp("/", comoPadre());

    expect(
      await screen.findByRole("button", { name: messages.nav.themeSystem }),
    ).toBeInTheDocument();
  });

  it("y antes de elegir perfil no está", async () => {
    await montarApp("/profiles", { actor: null, hasAccount: true });

    await screen.findByText(messages.auth.whoIsPlaying);

    for (const nombre of [
      messages.nav.themeSystem,
      messages.nav.themeLight,
      messages.nav.themeDark,
    ]) {
      expect(screen.queryByRole("button", { name: nombre })).toBeNull();
    }
  });
});

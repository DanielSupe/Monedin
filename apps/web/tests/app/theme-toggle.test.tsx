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

/** El tema que el marco dejó escrito en la raíz, o `null` si no escribió nada. */
function estampado(): string | null {
  return document.documentElement.getAttribute("data-theme");
}

/**
 * EL TEMA SE APLICA A LA RAÍZ, Y ESO NO ES UN DETALLE DE DÓNDE PONER UN ATRIBUTO.
 *
 * Los diálogos y el velo del recorrido salen por un PORTAL, al final del
 * documento y fuera del marco. Con el atributo puesto en el contenedor del
 * marco se quedarían con el tema contrario — en el sitio donde menos se mira y
 * más molesta.
 */
describe("el marco aplica el tema del perfil", () => {
  it("un perfil en oscuro lo estampa en la raíz", async () => {
    await montarApp("/", { ...comoNino(), actor: { ...comoNino().actor!, theme: "DARK" } });

    expect(estampado()).toBe("dark");
  });

  it("uno en claro, también", async () => {
    await montarApp("/", { ...comoPadre(), actor: { ...comoPadre().actor!, theme: "LIGHT" } });

    expect(estampado()).toBe("light");
  });

  /*
   * «Seguir al sistema» se escribe como AUSENCIA del atributo, no como `light`.
   * Son dos cosas distintas: uno cambia al anochecer y el otro no, y con `light`
   * escrito la preferencia del dispositivo dejaría de mandar.
   */
  it("y seguir al sistema no escribe nada", async () => {
    await montarApp("/", comoNino());

    expect(estampado()).toBeNull();
  });
});

/**
 * Tres estados con un solo control, y el nombre dice DÓNDE ESTÁ.
 *
 * Lo que alguien necesita al llegar al control es saber en qué tema está; a
 * dónde lleva lo descubre pulsando. Es la misma regla que el control de contraer
 * el lateral, cuyo nombre cambia con el estado porque lo que hace cambia.
 */
describe("la cabecera ofrece cambiar de tema", () => {
  /*
   * SE ESPÍA DESPUÉS DE MONTAR, y hace falta decirlo: `montarApp` instala su
   * propio doble de `fetch`, así que uno puesto antes lo pisa el ayudante y el
   * PATCH nunca se ve. El primer intento hizo justo eso.
   */
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

  /*
   * El ciclo, comprobado por lo que MANDA y no por lo que pinta: el valor
   * siguiente es la decisión del control, y el pintado depende de que el
   * servidor conteste.
   */
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

  /*
   * Antes de elegir perfil no hay actor, así que no habría dónde guardar la
   * elección. Es la misma razón por la que el marco de entrada no declara escala.
   */
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

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroPanel } from "../../src/ui/HeroPanel.js";
import { Mascota } from "../../src/ui/Mascota.js";
import { ProgressRing } from "../../src/ui/ProgressRing.js";

const SRC = resolve(process.cwd(), "src");

describe("HeroPanel", () => {
  it("los dos tonos no comparten superficie", () => {
    const hacer = render(<HeroPanel tone="action">Hacer</HeroPanel>);
    const conseguido = render(<HeroPanel tone="saving">Conseguido</HeroPanel>);

    const clasesDe = (r: ReturnType<typeof render>): string =>
      r.container.querySelector("section")?.className ?? "";

    expect(clasesDe(hacer)).not.toBe(clasesDe(conseguido));
  });

  it("el tono es un conjunto cerrado, no un color", () => {
    const fuente = readFileSync(join(SRC, "ui", "HeroPanel.tsx"), "utf8");

    expect(fuente).toMatch(/export type HeroTone = "action" \| "saving";/);
    expect(fuente).not.toMatch(/\bcolor\??:\s*string/);
  });

  it("ninguna pantalla declara un degradado por su cuenta", () => {
    const culpables: string[] = [];

    const recorrer = (directorio: string): void => {
      for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
        const ruta = join(directorio, entrada.name);

        if (entrada.isDirectory()) {
          recorrer(ruta);
          continue;
        }

        if (!entrada.name.endsWith(".tsx")) continue;

        const contenido = readFileSync(ruta, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
        if (/\bbg-linear-|\bbg-gradient-|linear-gradient\(/.test(contenido)) {
          culpables.push(relative(SRC, ruta));
        }
      }
    };

    recorrer(join(SRC, "features"));
    recorrer(join(SRC, "routes"));

    expect(
      culpables,
      `un realce de color sale de HeroPanel, no de un degradado escrito en la pantalla:\n${culpables.join(
        "\n",
      )}`,
    ).toEqual([]);
  });
});

describe("ProgressRing", () => {
  it("dice su valor a quien no lo ve, en sus tres casos", () => {
    for (const [hechas, total] of [
      [0, 5],
      [2, 5],
      [5, 5],
    ] as const) {
      const { unmount } = render(<ProgressRing done={hechas} total={total} />);
      const aro = screen.getByRole("meter");

      expect(aro).toHaveAttribute("aria-valuenow", String(hechas));
      expect(aro).toHaveAttribute("aria-valuemax", String(total));
      unmount();
    }
  });

  it("el trazo crece con lo hecho, y los tres casos son distintos", () => {
    const trazoDe = (hechas: number): string => {
      const { container, unmount } = render(<ProgressRing done={hechas} total={5} />);
      const trazo = container.querySelectorAll("circle")[1]?.getAttribute("stroke-dasharray") ?? "";
      unmount();
      return trazo;
    };

    const [vacio, medio, lleno] = [trazoDe(0), trazoDe(2), trazoDe(5)];

    expect(new Set([vacio, medio, lleno]).size).toBe(3);
  });

  it("sin tareas no dibuja un aro completo", () => {
    const { container } = render(<ProgressRing done={0} total={0} />);
    const trazo = container.querySelectorAll("circle")[1]?.getAttribute("stroke-dasharray") ?? "";

    expect(trazo.startsWith("0 ")).toBe(true);
  });
});

describe("Mascota", () => {
  it("la ilustración no se anuncia, y lo que dice sí", () => {
    render(<Mascota pose="explica">Las monedas se van al aprobar.</Mascota>);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Las monedas se van al aprobar.")).toBeInTheDocument();
  });

  it("sin globo se dibuja igual, y sigue sin anunciarse", () => {
    const { container } = render(<Mascota pose="saluda" />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
  });
});

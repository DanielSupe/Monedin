import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { conPantallaAncha } from "../setup.js";
import { comoNino, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function marco(): HTMLElement {
  return document.querySelector("[data-scale]") as HTMLElement;
}

function envoltorio(): HTMLElement {
  return screen.getByRole("main").parentElement as HTMLElement;
}

describe("con la columna delante, lo que se desplaza es el contenido", () => {
  it.each([
    ["el padre", comoPadre()],
    ["el niño", comoNino()],
  ])("%s: el marco se ata a la ventana y el contenido desplaza", async (_quien, sesion) => {
    conPantallaAncha();
    await montarApp("/", sesion);

    expect(marco().className).toContain("h-dvh");
    expect(marco().className).toContain("overflow-hidden");
    expect(envoltorio().className).toContain("overflow-y-auto");

    expect(screen.getByRole("main").className).toContain("max-w-wide");
  });
});

describe("en estrecho no cambia nada", () => {
  it.each([
    ["el padre", comoPadre()],
    ["el niño", comoNino()],
  ])("%s: el marco no se ata y el contenido no desplaza", async (_quien, sesion) => {
    await montarApp("/", sesion);

    expect(marco().className).toContain("min-h-dvh");
    expect(marco().className).not.toContain("overflow-hidden");
    expect(envoltorio().className).not.toContain("overflow-y-auto");
  });
});

describe("los dos ejes del desbordamiento van juntos", () => {
  it.each([
    ["el padre", comoPadre()],
    ["el niño", comoNino()],
  ])("%s: el <main> no declara ningún desbordamiento", async (_quien, sesion) => {
    conPantallaAncha();
    await montarApp("/", sesion);

    expect(screen.getByRole("main").className).not.toMatch(/overflow-/);
    expect(envoltorio().className).toMatch(/overflow-x-auto/);
  });
});

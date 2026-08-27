import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "../../src/ui/Badge.js";
import { Card } from "../../src/ui/Card.js";

// Bajo `jsdom`, `import.meta.url` no es una URL `file:`, así que se resuelve
// desde la raíz del paquete, que es donde vitest corre.
const TOKENS = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8");

/** Sin comentarios: uno de bloque delante de un token se lo comía al partir por `;`. */
const SIN_COMENTARIOS = TOKENS.replace(/\/\*[\s\S]*?\*\//g, "");

/** Los valores declarados dentro de un bloque de selector, como mapa. */
function tokensDeclaradosEn(selector: string): Map<string, string> {
  const bloque = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(SIN_COMENTARIOS);
  expect(bloque, `no se encontró el bloque ${selector} en tokens.css`).not.toBeNull();

  const valores = new Map<string, string>();
  for (const linea of (bloque?.[1] ?? "").split(";")) {
    const [nombre, ...resto] = linea.split(":");
    if (nombre !== undefined && resto.length > 0 && nombre.trim().startsWith("--")) {
      valores.set(nombre.trim(), resto.join(":").trim());
    }
  }
  return valores;
}

/**
 * La doble escala no se puede medir montando: jsdom no procesa Tailwind y no
 * resuelve `var()`. Lo que sí es verificable, y es lo que la regla dice de
 * verdad, son dos cosas: que la pieza NO se bifurca por audiencia, y que los
 * tokens sí tienen dos valores. Que la diferencia se vea es el catálogo vivo.
 */
describe("la doble escala", () => {
  it("la misma pieza rinde el mismo marcado bajo las dos escalas", () => {
    const { container: comoNino } = render(
      <div data-scale="child">
        <Card>
          <Badge tone="success">Aprobada</Badge>
        </Card>
      </div>,
    );
    const { container: comoPadre } = render(
      <div data-scale="parent">
        <Card>
          <Badge tone="success">Aprobada</Badge>
        </Card>
      </div>,
    );

    const nino = comoNino.querySelector("[data-scale] > div")?.outerHTML;
    const padre = comoPadre.querySelector("[data-scale] > div")?.outerHTML;

    // Idéntico a propósito: si algún día difieren, alguien metió una prop de
    // audiencia en la pieza y el sistema empezó a duplicarse.
    expect(nino).toBe(padre);
  });

  it("las dos escalas declaran los mismos tokens con valores distintos", () => {
    const nino = tokensDeclaradosEn('\\[data-scale="child"\\]');
    const padre = tokensDeclaradosEn(':root,\\s*\\[data-scale="parent"\\]');

    for (const token of ["--text-hero", "--text-title", "--radius-card", "--tap-min"]) {
      expect(padre.has(token), `${token} falta en la escala del padre`).toBe(true);
      expect(nino.has(token), `${token} falta en la escala del niño`).toBe(true);
      expect(nino.get(token), `${token} vale lo mismo en las dos escalas`).not.toBe(padre.get(token));
    }
  });

  it("el objetivo de toque del niño no baja de 44px", () => {
    const nino = tokensDeclaradosEn('\\[data-scale="child"\\]');
    const enRem = Number.parseFloat(nino.get("--tap-min") ?? "0");

    // 44px sobre la raíz de 16px. Lo exige la spec, y aquí falla si alguien lo baja.
    expect(enRem * 16).toBeGreaterThanOrEqual(44);
  });

  it("la paleta cruda no se DECLARA en @theme, así que no genera utilidades", () => {
    const theme = /@theme\s*\{([\s\S]*?)\n\}/.exec(SIN_COMENTARIOS)?.[1] ?? "";
    expect(theme, "no se encontró el bloque @theme en tokens.css").not.toBe("");

    // Referenciar un primitivo con `var(--mnd-…)` es justo lo que la capa 2 hace.
    // Lo que no puede pasar es DECLARARLO aquí: entonces `bg-mnd-amber-400`
    // empieza a existir y la regla de «solo la capa 2» deja de ser cumplible.
    const declarados = theme.split(";").filter((linea) => /^\s*--mnd-/.test(linea));
    expect(declarados).toEqual([]);
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = (relativo: string): string => readFileSync(resolve(process.cwd(), relativo), "utf8");

const INDEX = raiz("src/ui/index.ts");
const CATALOGO = raiz("src/ui-catalog.tsx");

const CATALOGO_SIN_COMENTARIOS = CATALOGO.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /\/\/[^\n]*/g,
  "",
);

function piezasExportadas(): string[] {
  const nombres = new Set<string>();

  for (const exportacion of INDEX.matchAll(/export \{([^}]*)\}/g)) {
    for (const parte of (exportacion[1] ?? "").split(",")) {
      const nombre = parte.trim();

      if (nombre !== "" && !nombre.startsWith("type ") && /^[A-Z][a-z]/.test(nombre)) {
        nombres.add(nombre);
      }
    }
  }

  return [...nombres];
}

describe("el catálogo vivo", () => {
  it("enseña todas las piezas exportadas", () => {
    const piezas = piezasExportadas();
    expect(piezas.length).toBeGreaterThan(0);

    const ausentes = piezas.filter((pieza) => !new RegExp(`<${pieza}[\\s/>]`).test(CATALOGO));

    expect(ausentes, `piezas exportadas que el catálogo no enseña: ${ausentes.join(", ")}`).toEqual(
      [],
    );
  });

  it("no monta ningún proveedor de datos, que es lo que prueba la frontera", () => {
    expect(CATALOGO_SIN_COMENTARIOS).not.toMatch(/QueryClientProvider|RouterProvider|createRouter/);
  });

  it("declara las dos escalas, porque enseñar una sola no enseña la diferencia", () => {
    expect(CATALOGO).toContain('data-scale="parent"');
    expect(CATALOGO).toContain('data-scale="child"');
  });
});

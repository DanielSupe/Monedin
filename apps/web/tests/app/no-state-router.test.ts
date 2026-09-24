import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const FEATURES = resolve(process.cwd(), "src/features");

function archivosDe(directorio: string): string[] {
  const encontrados: string[] = [];

  for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) {
      encontrados.push(...archivosDe(ruta));
    } else if (/\.tsx?$/.test(entrada.name)) {
      encontrados.push(ruta);
    }
  }

  return encontrados;
}

const ARCHIVOS = archivosDe(FEATURES);

function sinComentarios(contenido: string): string {
  return contenido.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

function nombre(ruta: string): string {
  return relative(FEATURES, ruta).split("\\").join("/");
}

describe("la navegación no se cablea a mano", () => {
  it("hay archivos que revisar", () => {
    expect(ARCHIVOS.length).toBeGreaterThan(10);
  });

  const EVENTOS_DE_DOMINIO = ["onSaved"];

  it("ninguna pantalla recibe una función para volver o cerrarse", () => {
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      const contenido = sinComentarios(readFileSync(ruta, "utf8"));

      const props = contenido.matchAll(/\b(on[A-Z]\w*)\??\s*:\s*\(\)\s*=>\s*(?:void|Promise<void>)/g);

      for (const [, prop] of props) {
        if (prop !== undefined && !EVENTOS_DE_DOMINIO.includes(prop)) {
          culpables.push(`${nombre(ruta)} → ${prop}`);
        }
      }
    }

    expect(
      culpables,
      `una pantalla navega contra el router, no contra quien la abrió:\n${culpables.join("\n")}\n` +
        "Un evento de dominio —«esto ocurrió»— sí es legítimo y se declara en " +
        "EVENTOS_DE_DOMINIO. Una función sin argumentos que significa «ciérrame», no: " +
        "para salir, un hueco con un enlace dentro.",
    ).toEqual([]);
  });

  it("ningún componente decide con estado local qué pantalla mostrar", () => {
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      const contenido = sinComentarios(readFileSync(ruta, "utf8"));

      const union = /type\s+\w+\s*=\s*\{\s*name:\s*"/.test(contenido);
      const estado = /useState<\s*(Vista|View)\b/.test(contenido);

      if (union || estado) {
        culpables.push(nombre(ruta));
      }
    }

    expect(
      culpables,
      `cada destino tiene su propia dirección:\n${culpables.join("\n")}`,
    ).toEqual([]);
  });
});

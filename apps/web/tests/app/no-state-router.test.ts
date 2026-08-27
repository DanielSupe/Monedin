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

/**
 * Lo que impide que el estado-como-router vuelva.
 *
 * Es la razón de ser de `add-app-shell`: las pantallas del niño vivían dentro de
 * `/` con booleanos, así que el botón atrás sacaba de la aplicación. Sin una
 * regla, la forma más barata de añadir la pantalla siguiente vuelve a ser esa.
 *
 * Un test y no lint porque ambas son FORMAS, no símbolos, y un selector que las
 * distinga de un uso legítimo sería más frágil que esto. Mismo criterio que el
 * test de colores literales y el de rutas de solo cuenta de la API.
 */
describe("la navegación no se cablea a mano", () => {
  it("hay archivos que revisar", () => {
    expect(ARCHIVOS.length).toBeGreaterThan(10);
  });

  it("ninguna pantalla recibe una función para volver o cerrarse", () => {
    const culpables = ARCHIVOS.filter((ruta) =>
      /\bonDone\b/.test(sinComentarios(readFileSync(ruta, "utf8"))),
    ).map(nombre);

    expect(
      culpables,
      `una pantalla navega contra el router, no contra quien la abrió:\n${culpables.join("\n")}\n` +
        "Un evento de dominio —`onSaved`, «esto ocurrió»— sí es legítimo; `onDone` —«ciérrame»— no.",
    ).toEqual([]);
  });

  it("ningún componente decide con estado local qué pantalla mostrar", () => {
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      const contenido = sinComentarios(readFileSync(ruta, "utf8"));

      // La forma exacta que tenían las tres que se retiraron:
      //   type Vista = { name: "list" } | { name: "new" }
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

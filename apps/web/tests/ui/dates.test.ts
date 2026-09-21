import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { fechaCorta, fechaLarga } from "../../src/lib/dates.js";

const SRC = resolve(process.cwd(), "src");
const DATES = join(SRC, "lib", "dates.ts");

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

/** Todo `src` menos el único archivo que tiene permiso para decidir un formato. */
const ARCHIVOS = archivosDe(SRC).filter(
  (ruta) => ruta !== DATES && !ruta.endsWith("routeTree.gen.ts"),
);

function sinComentarios(contenido: string): string {
  return contenido.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/**
 * EL FORMATO DE UNA FECHA VISIBLE SE DECIDE EN UN SITIO, Y AQUÍ SE HACE CUMPLIR.
 *
 * Lo decidían cuatro pantallas y de tres maneras. Una convención que solo vive
 * en un documento está muerta al tercer mes, así que esto falla el día que una
 * quinta vuelva a elegir el suyo — que es exactamente cómo se llegó a tres.
 *
 * Sin lista de excepciones. Es la lección de `close-style-debt`: una lista vacía
 * es una puerta abierta, porque el día que alguien tenga prisa añadir una línea
 * cuesta menos que usar la función.
 */
describe("las fechas las escribe un solo sitio", () => {
  it("ninguna pantalla llama a `toLocaleDateString` por su cuenta", () => {
    const culpables = ARCHIVOS.filter((ruta) =>
      /toLocaleDateString|toLocaleString|DateTimeFormat/.test(
        sinComentarios(readFileSync(ruta, "utf8")),
      ),
    ).map((ruta) => relative(SRC, ruta));

    expect(culpables, "el formato lo decide `lib/dates.ts` y nadie más").toEqual([]);
  });

  /*
   * Y LA OTRA MITAD, que es la que de verdad se escapaba: que el idioma esté
   * DECLARADO. Un `toLocaleDateString(undefined, …)` pasa el test de arriba
   * —no, no lo pasa— pero sí pasaría cualquier revisión, porque a quien
   * desarrolla en español le sale en español. Esto lo mira por el RESULTADO: si
   * alguien dejara el idioma al dispositivo, bajo un entorno en inglés la fecha
   * saldría con el mes en inglés y esto lo caza.
   */
  it("y las escribe en español, no en el idioma del dispositivo", () => {
    expect(fechaLarga("2026-09-08T10:00:00.000Z")).toBe("8 de septiembre");
    expect(fechaCorta("2026-09-08T10:00:00.000Z")).toBe("8 sept");
  });

  /*
   * Ninguna de las dos lleva año: todo lo que este producto fecha ocurrió o va a
   * ocurrir en días. Se comprueba con una fecha de OTRO año, para que un formato
   * que lo incluyera no pasara por casualidad al caer en el año en curso.
   */
  it("y ninguna lleva año", () => {
    for (const escrita of [fechaLarga("2019-01-03T10:00:00.000Z"), fechaCorta("2019-01-03T10:00:00.000Z")]) {
      expect(escrita).not.toMatch(/2019|19/);
    }
  });
});

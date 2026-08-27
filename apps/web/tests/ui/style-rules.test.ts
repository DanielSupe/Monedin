import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(process.cwd(), "src");
const TOKENS = join(SRC, "styles", "tokens.css");

function archivosDe(directorio: string): string[] {
  const encontrados: string[] = [];

  for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) {
      encontrados.push(...archivosDe(ruta));
    } else if (/\.(ts|tsx|css)$/.test(entrada.name)) {
      encontrados.push(ruta);
    }
  }

  return encontrados;
}

/*
 * DEUDA CON FECHA DE CADUCIDAD, la misma que la de `eslint.config.js`.
 *
 * Las pantallas del andamio llevan sus colores escritos a mano —`#b00020` para
 * un error, `#ccc` para un borde— y este change no las viste a propósito. Cada
 * uno de los nueve changes siguientes BORRA su entrada de esta lista al vestir
 * su pantalla. Cuando quede vacía, se borra la constante y la regla cubre todo
 * `src`. Una entrada que siga aquí sin change que la reclame es que alguien se
 * saltó el plan.
 */
const SIN_VESTIR = [
  "features/auth",
  "features/children",
  "features/redemptions",
  "features/rewards",
  "features/tasks",
  "features/uploads",
  "routes",
];

function estaSinVestir(ruta: string): boolean {
  // En Windows `relative` devuelve barras invertidas; se normaliza para que la
  // lista de arriba se lea igual en los dos sistemas.
  const relativa = relative(SRC, ruta).split("\\").join("/");
  return SIN_VESTIR.some((parte) => relativa.startsWith(parte));
}

/** Todo lo de `src`, menos el archivo de tokens, lo generado y lo aún sin vestir. */
const ARCHIVOS = archivosDe(SRC).filter(
  (ruta) => ruta !== TOKENS && !ruta.endsWith("routeTree.gen.ts") && !estaSinVestir(ruta),
);

function sinComentarios(contenido: string): string {
  return contenido.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/**
 * Lo que ESLint no llega a ver.
 *
 * El prop `style` lo caza una regla de lint. Un color escrito dentro de una
 * cadena de clases, o una utilidad con valor arbitrario, no: para ESLint es
 * texto. El proyecto ya resuelve así lo que la herramienta no alcanza —un test
 * compara las constantes contra el SQL, otro enumera las rutas de solo cuenta—,
 * y esto es lo mismo. Ver decisión 7 del design.
 */
describe("el estilo no se escribe fuera de los tokens", () => {
  it("encuentra archivos que revisar", () => {
    expect(ARCHIVOS.length).toBeGreaterThan(10);
  });

  it("la lista de pantallas sin vestir solo puede encoger", () => {
    // Si alguien añade una entrada en vez de quitarla, este número no cuadra y
    // hay que venir aquí a explicarse.
    expect(SIN_VESTIR).toHaveLength(7);
  });

  it("ningún color literal fuera de tokens.css", () => {
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      const contenido = sinComentarios(readFileSync(ruta, "utf8"));
      const encontrados = contenido.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(/g);

      if (encontrados !== null) {
        culpables.push(`${relative(SRC, ruta)} → ${[...new Set(encontrados)].join(", ")}`);
      }
    }

    expect(
      culpables,
      `un color solo se declara en src/styles/tokens.css:\n${culpables.join("\n")}`,
    ).toEqual([]);
  });

  it("ninguna utilidad con valor arbitrario", () => {
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      if (!ruta.endsWith(".tsx")) continue;

      // El archivo ENTERO y no solo lo que hay dentro de `className="…"`: las
      // piezas guardan sus variantes en objetos `Record<Tono, string>`, y un
      // escaneo del atributo se las salta todas. Comprobado inyectando una.
      const contenido = sinComentarios(readFileSync(ruta, "utf8"));

      // `p-[13px]`, `bg-[#f0a]`. Quedan fuera dos cosas que NO son medidas
      // escritas a mano: `max-w-(--container-dialog)`, que referencia un token,
      // y los VARIANTES como `data-[state=active]:`, que seleccionan y no
      // miden — se distinguen porque llevan dos puntos detrás del corchete.
      const arbitrarias = contenido.match(/[a-z][\w-]*-\[[^\]]+\](?!:)/g);

      if (arbitrarias !== null) {
        culpables.push(`${relative(SRC, ruta)} → ${[...new Set(arbitrarias)].join(", ")}`);
      }
    }

    expect(
      culpables,
      `una medida se declara en src/styles/tokens.css, no en el punto de uso:\n${culpables.join("\n")}`,
    ).toEqual([]);
  });
});

/**
 * La frontera que hace que una pieza se pueda probar sin servidor.
 *
 * Si `ui/` importara un cliente de la API o un hook de datos, el catálogo vivo
 * necesitaría proveedores y las pruebas necesitarían un servidor. Es la misma
 * clase de regla que confina Prisma al repositorio en la API.
 */
describe("las piezas no conocen el dominio", () => {
  const PIEZAS = archivosDe(join(SRC, "ui"));

  it("hay piezas que revisar", () => {
    expect(PIEZAS.length).toBeGreaterThan(10);
  });

  it("ninguna pieza importa de features/ ni de api/", () => {
    const culpables: string[] = [];

    for (const ruta of PIEZAS) {
      const contenido = readFileSync(ruta, "utf8");

      for (const linea of contenido.split("\n")) {
        if (/^\s*import .*from ["'].*\/(features|api)\//.test(linea)) {
          culpables.push(`${relative(SRC, ruta)} → ${linea.trim()}`);
        }
      }
    }

    expect(culpables, `una pieza de ui/ no depende del dominio:\n${culpables.join("\n")}`).toEqual(
      [],
    );
  });
});

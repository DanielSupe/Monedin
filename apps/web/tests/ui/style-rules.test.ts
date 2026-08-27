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

/*
 * Lo que impide volver a una tipografía POR DISPOSITIVO.
 *
 * El token era una pila del sistema, y eso entregaba una marca redondeada en
 * Apple y otra distinta en Windows y en Android. Estos tests no comprueban que
 * la familia sea Nunito —cambiarla algún día es legítimo—, sino que la entrega
 * el proyecto y no el sistema operativo de cada quien.
 */
describe("la tipografía la entrega el sistema, no el dispositivo", () => {
  /*
   * Familias y palabras clave que resuelven a «lo que tenga instalado este
   * aparato». Poner cualquiera de estas la PRIMERA es exactamente el defecto
   * que este archivo existe para no repetir.
   */
  const DEL_DISPOSITIVO = [
    "ui-rounded",
    "ui-sans-serif",
    "ui-serif",
    "ui-monospace",
    "system-ui",
    "sans-serif",
    "serif",
    "monospace",
    "-apple-system",
    "blinkmacsystemfont",
    "sf pro rounded",
    "segoe ui",
    "segoe ui variable",
    "roboto",
    "helvetica",
    "arial",
  ];

  const CSS = readFileSync(TOKENS, "utf8");

  /** La pila declarada, partida en familias. Vale en varias líneas. */
  function pilaDeclarada(): string[] {
    const declaracion = /--font-sans:\s*([^;]+);/.exec(CSS);
    expect(declaracion, "no hay declaración de --font-sans en tokens.css").not.toBeNull();

    return (declaracion?.[1] ?? "")
      .split(",")
      .map((familia) => familia.trim().replace(/\s+/g, " "))
      .filter((familia) => familia.length > 0);
  }

  it("la primera familia de --font-sans no es del dispositivo", () => {
    const primera = pilaDeclarada()[0] ?? "";
    const nombre = primera.replace(/^["']|["']$/g, "").toLowerCase();

    expect(
      DEL_DISPOSITIVO,
      `--font-sans empieza por «${primera}», que resuelve a lo que cada aparato tenga instalado`,
    ).not.toContain(nombre);
  });

  it("la familia de la marca la sirve el proyecto", () => {
    const primera = (pilaDeclarada()[0] ?? "").replace(/^["']|["']$/g, "");
    // La primera palabra basta: el paquete se llama `nunito` y la familia
    // «Nunito Variable». Lo que se comprueba es que la fuente esté IMPORTADA,
    // no que se llame de una manera concreta.
    const raiz = (primera.split(" ")[0] ?? "").toLowerCase();
    const importes = CSS.match(/@import\s+["'][^"']+["']/g) ?? [];

    expect(
      importes.some((linea) => linea.toLowerCase().includes(raiz)),
      `--font-sans empieza por «${primera}» y tokens.css no importa esa fuente: sin el import ` +
        `no se entrega nada y cada aparato pinta lo que quiere`,
    ).toBe(true);
  });

  it("detrás de la marca queda un respaldo del sistema", () => {
    const pila = pilaDeclarada();
    const detras = pila.slice(1).map((familia) => familia.replace(/^["']|["']$/g, "").toLowerCase());

    // Sin respaldo, un fallo de carga da la serif por defecto del navegador:
    // Times New Roman en una aplicación para niños.
    expect(
      detras.filter((familia) => DEL_DISPOSITIVO.includes(familia)).length,
      `--font-sans no deja respaldo del sistema detrás de la marca: ${pila.join(", ")}`,
    ).toBeGreaterThan(0);

    expect(detras.at(-1), "la pila tiene que acabar en una familia genérica").toBe("sans-serif");
  });
});

/*
 * En una columna de saldos, `120` y `1.250` tienen que alinear sus dígitos.
 * Va en la pieza y no en `body` porque alinear cifras es correcto en una
 * columna de números e incorrecto en un texto corrido.
 */
describe("las cifras de una columna alinean", () => {
  it("Coins pide cifras tabulares", () => {
    const contenido = readFileSync(join(SRC, "ui", "Coins.tsx"), "utf8");

    expect(
      sinComentarios(contenido),
      "Coins es la pieza que dibuja cantidades: sin cifras tabulares una lista de saldos no alinea",
    ).toContain("tabular-nums");
  });
});

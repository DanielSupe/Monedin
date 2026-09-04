import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { messages } from "../../src/lib/messages.js";

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
 * Todo lo de `src`, menos el archivo de tokens y lo generado.
 *
 * Ya no hay lista de excepciones que restar. `add-design-system` la creó con su
 * condición de muerte escrita —cada change borra su línea, y al quedar vacía se
 * borra el bloque— y `close-style-debt` la cumplió. Dejarla vacía «por si acaso»
 * habría sido una puerta abierta: añadir una línea cuesta menos que vestir una
 * pantalla, y el mecanismo estaría ahí invitando.
 */
const ARCHIVOS = archivosDe(SRC).filter(
  (ruta) => ruta !== TOKENS && !ruta.endsWith("routeTree.gen.ts"),
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

/**
 * Lo que impide que un número de negocio se escriba a mano.
 *
 * `CLAUDE.md` lo prohíbe dos veces —«impórtalo» y «tenerlo en dos sitios acaba
 * con uno de los dos mintiendo»— y hasta `close-style-debt` no lo comprobaba
 * nada. Había SEIS: tres `maxLength={4}` y tres cifras metidas dentro de
 * cadenas del catálogo.
 */
describe("un número de negocio no se escribe a mano", () => {
  /** Cada cadena del catálogo, con la ruta por la que se llega a ella. */
  function cadenasDe(objeto: unknown, camino: string[] = []): Array<[string, string]> {
    if (typeof objeto === "string") {
      return [[camino.join("."), objeto]];
    }
    if (objeto === null || typeof objeto !== "object") {
      return [];
    }
    return Object.entries(objeto).flatMap(([clave, valor]) =>
      cadenasDe(valor, [...camino, clave]),
    );
  }

  it("hay cadenas que revisar", () => {
    expect(cadenasDe(messages).length).toBeGreaterThan(100);
  });

  /*
   * Dentro de un texto es donde se escapa: «PIN de 4 dígitos» no parece un
   * número de negocio, y lo es. Y es el que más se pudre, porque al código lo
   * protege un esquema de Zod y al texto no lo protege nada — el día que el PIN
   * pase a cinco dígitos, el campo aceptaría cinco y la etiqueta seguiría
   * diciendo cuatro.
   *
   * La regla es fuerte a propósito y hoy da CERO falsos positivos: las tres
   * cadenas que llevaban cifras eran las tres constantes de dominio. Si algún
   * día hace falta un número que NO sea de dominio, se verá al añadirlo y se
   * decidirá entonces, que es mejor que no enterarse.
   */
  it("ninguna cadena del catálogo lleva una cifra dentro", () => {
    const culpables = cadenasDe(messages)
      .filter(([, texto]) => /[0-9]/.test(texto))
      .map(([ruta, texto]) => `${ruta} → "${texto}"`);

    expect(
      culpables,
      `una cifra dentro de un texto es un número de negocio disfrazado:\n${culpables.join("\n")}\n` +
        "Compón la cifra en el punto de uso desde su constante, como `PIN_LABEL`.",
    ).toEqual([]);
  });

  it("ningún `maxLength` con un literal numérico", () => {
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      if (!ruta.endsWith(".tsx")) continue;

      const encontrados = sinComentarios(readFileSync(ruta, "utf8")).match(/maxLength=\{\d+\}/g);

      if (encontrados !== null) {
        culpables.push(`${relative(SRC, ruta)} → ${[...new Set(encontrados)].join(", ")}`);
      }
    }

    expect(
      culpables,
      `una longitud máxima sale de su constante:\n${culpables.join("\n")}`,
    ).toEqual([]);
  });
});

/**
 * Lo que impide que el contenido se reparta por todo el monitor.
 *
 * Mientras la navegación estuvo detrás de un botón casi no se notaba. Desde
 * `pin-sidebar-on-desktop` el lateral está fijo, y sin tope el contenido usaba
 * lo que sobrara: cuatro teselas del inicio del niño acababan midiendo unos
 * 560px cada una con un emoji de 28px flotando en medio.
 *
 * El efecto crece justo cuando la ventana crece, así que en el dispositivo del
 * que se presume —una tablet— se veía bien y en un escritorio se veía roto. Por
 * eso hace falta un test: mirarlo en el sitio equivocado no lo enseña.
 */
describe("el contenido no se reparte por todo el monitor", () => {
  const MARCOS = ["ChildShell.tsx", "ParentShell.tsx"];

  /**
   * Las clases del `<main>`, vengan como vengan.
   *
   * Buscaba `<main className="…">` con la lista entre comillas, así que en
   * cuanto `pin-sidebar-footer` la metió en un `cx()` de varias líneas dejó de
   * encontrar nada — y el test falló por la FORMA del código y no por lo que
   * comprueba. Es el mismo tropiezo que el catálogo vivo tuvo con una
   * exportación multilínea: una regla que analiza código tiene que mirar el
   * bloque, no el renglón.
   *
   * Ahora toma la etiqueta de apertura entera y junta todas sus cadenas: da
   * igual que las clases estén en un literal o repartidas en un `cx()`.
   */
  function clasesDelMain(marco: string): string {
    const contenido = readFileSync(join(SRC, "app", marco), "utf8");
    const apertura = contenido.match(/<main[\s\S]*?>/);

    return (apertura?.[0].match(/"([^"]*)"/g) ?? []).join(" ");
  }

  it.each(MARCOS)("el <main> de %s declara un ancho máximo", (marco) => {
    const clases = clasesDelMain(marco);

    expect(clases, `${marco} no tiene un <main> con clases`).not.toBe("");
    expect(clases, `el <main> de ${marco} no se topa ni se centra`).toMatch(/max-w-\S+/);
    expect(clases).toContain("mx-auto");
  });

  it("y el tope sale de un token con nombre, no de una medida a mano", () => {
    // `max-w-wide` sale de `--container-wide`. `max-w-[72rem]` sería la misma
    // medida escrita en el punto de uso, y además la caza el test de valores
    // arbitrarios: esto comprueba lo que aquel no puede, que sea un NOMBRE.
    for (const marco of MARCOS) {
      expect(
        clasesDelMain(marco),
        `el <main> de ${marco} usa una medida sin nombre`,
      ).toMatch(/max-w-[a-z][\w-]*(\s|$)/);
    }
  });
});

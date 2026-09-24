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

const ARCHIVOS = archivosDe(SRC).filter(
  (ruta) => ruta !== TOKENS && !ruta.endsWith("routeTree.gen.ts"),
);

function sinComentarios(contenido: string): string {
  return contenido.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

describe("el estilo no se escribe fuera de los tokens", () => {
  it("encuentra archivos que revisar", () => {
    expect(ARCHIVOS.length).toBeGreaterThan(10);
  });

  const COLOR_ES_CONTENIDO = [join("ui", "avatars.tsx")];

  it("la excepción de color como contenido no se ensancha sola", () => {
    expect(COLOR_ES_CONTENIDO).toEqual([join("ui", "avatars.tsx")]);
  });

  it("ningún color literal fuera de tokens.css", () => {
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      if (COLOR_ES_CONTENIDO.some((permitido) => ruta.endsWith(permitido))) continue;

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

  it("ninguna capa flotante fija su apilado con un número", () => {
    const culpables: string[] = [];
    const FLOTA = /\b(?:fixed|sticky)\b/;
    const APILADO = /\bz-(?:[1-9]\d*|\[[^\]]+\])/;

    for (const ruta of ARCHIVOS) {
      const contenido = sinComentarios(readFileSync(ruta, "utf8"));

      const cadenas = contenido.match(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g) ?? [];
      const malas = cadenas.filter((c) => FLOTA.test(c) && APILADO.test(c));

      if (malas.length > 0) {
        culpables.push(`${relative(SRC, ruta)} → ${malas.join(" | ")}`);
      }
    }

    expect(
      culpables,
      `una capa que flota sobre la página pide su sitio por nombre, y el orden se lee en src/styles/tokens.css:\n${culpables.join(
        "\n",
      )}`,
    ).toEqual([]);
  });

  const AUTORIZADOS_AL_COLOR_MONEDA = [
    join("ui", "coin-mark.tsx"),

    join("ui", "Coins.tsx"),

    join("ui", "ProgressBar.tsx"),

    join("ui", "IconTile.tsx"),

    join("ui", "Button.tsx"),

    join("features", "auth", "ProfileGrid.tsx"),

    join("features", "assistant", "AssistantChat.tsx"),
  ];

  it("hay archivos autorizados al color de la moneda", () => {
    expect(AUTORIZADOS_AL_COLOR_MONEDA.length).toBeGreaterThan(0);
  });

  it("solo los archivos autorizados usan el color de la moneda", () => {
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      const relativa = relative(SRC, ruta);
      if (AUTORIZADOS_AL_COLOR_MONEDA.includes(relativa)) continue;

      const contenido = sinComentarios(readFileSync(ruta, "utf8"));

      const encontrados = contenido.match(/\b(?:bg|text|border|fill|stroke|ring)-coin(?:-[a-z]+)?\b/g);

      if (encontrados !== null) {
        culpables.push(`${relativa} → ${[...new Set(encontrados)].join(", ")}`);
      }
    }

    expect(
      culpables,
      `el color de la moneda es para el dinero y para la mascota. Si un archivo nuevo lo necesita de verdad, se añade a AUTORIZADOS_AL_COLOR_MONEDA y se ve en la revisión:\n${culpables.join(
        "\n",
      )}`,
    ).toEqual([]);
  });

  it("ninguna utilidad con valor arbitrario", () => {
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      if (!ruta.endsWith(".tsx")) continue;

      const contenido = sinComentarios(readFileSync(ruta, "utf8"));

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

  it("ningún paso de escala fuera de los declarados", () => {
    const RADIO_AJENO = /\brounded(?:-[tblr]{1,2})?-(?:xs|sm|md|lg|xl|[2-9]xl|full)\b/g;
    const TAMANO_AJENO = /\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/g;
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      if (!ruta.endsWith(".tsx")) continue;

      const contenido = sinComentarios(readFileSync(ruta, "utf8"));
      const ajenos = [
        ...(contenido.match(RADIO_AJENO) ?? []),
        ...(contenido.match(TAMANO_AJENO) ?? []),
      ];

      if (ajenos.length > 0) {
        culpables.push(`${relative(SRC, ruta)} → ${[...new Set(ajenos)].join(", ")}`);
      }
    }

    expect(
      culpables,
      `los pasos son los del sistema —rounded-control|card|panel|sheet|pill y text-micro|small|body|lead|title|display|hero—, no los de Tailwind:\n${culpables.join(
        "\n",
      )}`,
    ).toEqual([]);
  });
});

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

describe("la tipografía la entrega el sistema, no el dispositivo", () => {
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

    expect(
      detras.filter((familia) => DEL_DISPOSITIVO.includes(familia)).length,
      `--font-sans no deja respaldo del sistema detrás de la marca: ${pila.join(", ")}`,
    ).toBeGreaterThan(0);

    expect(detras.at(-1), "la pila tiene que acabar en una familia genérica").toBe("sans-serif");
  });
});

describe("las cifras de una columna alinean", () => {
  it("Coins pide cifras tabulares", () => {
    const contenido = readFileSync(join(SRC, "ui", "Coins.tsx"), "utf8");

    expect(
      sinComentarios(contenido),
      "Coins es la pieza que dibuja cantidades: sin cifras tabulares una lista de saldos no alinea",
    ).toContain("tabular-nums");
  });
});

describe("un número de negocio no se escribe a mano", () => {
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

describe("el contenido no se reparte por todo el monitor", () => {
  const MARCOS = ["ChildShell.tsx", "ParentShell.tsx"];

  function clasesDelMain(marco: string): string {
    const contenido = readFileSync(join(SRC, "app", marco), "utf8");

    const apertura = contenido.match(/<main\s[\s\S]*?>/);

    return (apertura?.[0].match(/"([^"]*)"/g) ?? []).join(" ");
  }

  it.each(MARCOS)("el <main> de %s declara un ancho máximo", (marco) => {
    const clases = clasesDelMain(marco);

    expect(clases, `${marco} no tiene un <main> con clases`).not.toBe("");
    expect(clases, `el <main> de ${marco} no se topa ni se centra`).toMatch(/max-w-\S+/);
    expect(clases).toContain("mx-auto");
  });

  it("y el tope sale de un token con nombre, no de una medida a mano", () => {
    for (const marco of MARCOS) {
      expect(
        clasesDelMain(marco),
        `el <main> de ${marco} usa una medida sin nombre`,
      ).toMatch(/max-w-[a-z][\w-]*(\s|$)/);
    }
  });
});

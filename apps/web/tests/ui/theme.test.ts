import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(process.cwd(), "src");
const TOKENS = join(SRC, "styles", "tokens.css");
const CSS = readFileSync(TOKENS, "utf8");

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

function bloqueDesde(css: string, desde: number): string {
  const abre = css.indexOf("{", desde);
  let nivel = 0;

  for (let i = abre; i < css.length; i++) {
    if (css[i] === "{") nivel++;
    if (css[i] === "}") {
      nivel--;
      if (nivel === 0) return css.slice(abre + 1, i);
    }
  }

  throw new Error("bloque sin cerrar desde el índice " + String(desde));
}

function bloqueDe(selector: string): string {
  const donde = CSS.indexOf(selector);
  expect(donde, `falta el bloque \`${selector}\` en tokens.css`).toBeGreaterThan(-1);
  return bloqueDesde(CSS, donde);
}

function coloresDe(bloque: string): string[] {
  return [...bloque.matchAll(/^\s*(--color-[\w-]+)\s*:/gm)].map((m) => m[1] ?? "");
}

const NO_SE_REASIGNAN = ["--color-ink-inverted", "--color-on-coin", "--color-danger-solid"];

const CLARO = coloresDe(bloqueDe("@theme {")).filter(
  (token) => !NO_SE_REASIGNAN.includes(token),
);
const POR_SISTEMA = coloresDe(bloqueDesde(CSS, CSS.indexOf('(prefers-color-scheme: dark)')));
const POR_ATRIBUTO = coloresDe(bloqueDe(':root[data-theme="dark"] {'));

describe("el tema oscuro reasigna la capa semántica entera", () => {
  it("hay tokens de color que revisar", () => {
    expect(CLARO.length).toBeGreaterThan(15);
  });

  it("el bloque que sigue al sistema no se deja ninguno", () => {
    const faltan = CLARO.filter((token) => !POR_SISTEMA.includes(token));

    expect(
      faltan,
      `el tema oscuro por preferencia del sistema no reasigna:\n  ${faltan.join("\n  ")}`,
    ).toEqual([]);
  });

  it("el bloque del atributo no se deja ninguno", () => {
    const faltan = CLARO.filter((token) => !POR_ATRIBUTO.includes(token));

    expect(
      faltan,
      `el tema oscuro elegido a mano no reasigna:\n  ${faltan.join("\n  ")}`,
    ).toEqual([]);
  });

  it("los que no se reasignan no aparecen en ningún bloque oscuro", () => {
    const colados = NO_SE_REASIGNAN.filter(
      (token) => POR_SISTEMA.includes(token) || POR_ATRIBUTO.includes(token),
    );

    expect(
      colados,
      `estos nombran la tinta de una superficie que NO cambia con el tema, así que ellos tampoco pueden:\n  ${colados.join("\n  ")}`,
    ).toEqual([]);
  });

  it("la lista de exentos es corta y cada entrada está declarada", () => {
    expect(NO_SE_REASIGNAN.length).toBeGreaterThan(0);
    expect(NO_SE_REASIGNAN.length).toBeLessThanOrEqual(4);

    for (const token of NO_SE_REASIGNAN) {
      expect(bloqueDe("@theme {"), `${token} tiene que existir en el tema claro`).toContain(
        `${token}:`,
      );
    }
  });

  it("los dos bloques oscuros declaran lo mismo", () => {
    expect([...POR_SISTEMA].sort()).toEqual([...POR_ATRIBUTO].sort());
  });

  it("los acentos que no cambian, no cambian", () => {
    const iguales = ["--color-primary", "--color-coin", "--color-danger"];

    for (const token of iguales) {
      const claro = new RegExp(`^\\s*${token}\\s*:\\s*var\\((--[\\w-]+)\\)`, "m").exec(
        bloqueDe("@theme {"),
      );
      const oscuro = new RegExp(`^\\s*--noche-${token.slice("--color-".length)}\\s*:\\s*var\\((--[\\w-]+)\\)`, "m").exec(CSS);

      expect(claro, `${token} tiene que salir de un primitivo`).not.toBeNull();
      expect(oscuro, `falta el valor oscuro de ${token}`).not.toBeNull();
    }

    expect(CSS).toContain("--noche-primary: var(--mnd-coral-700);");
    expect(CSS).toContain("--noche-coin: var(--mnd-amber-400);");
  });

  it("el esquema de color declarado al navegador sigue al tema", () => {
    expect(CSS).toContain("color-scheme: light dark;");
    expect(CSS).toMatch(/:root\[data-theme="dark"\]\s*\{\s*color-scheme: dark;/);
    expect(CSS).toMatch(/:root\[data-theme="light"\]\s*\{\s*color-scheme: light;/);
  });
});

describe("ninguna utilidad apunta a un token que ya no existe", () => {
  const RETIRADOS = ["success", "warning"];

  it("ningún archivo usa un color retirado del sistema", () => {
    const culpables: string[] = [];
    const patron = new RegExp(
      `\\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:${RETIRADOS.join("|")})(?:-soft)?\\b`,
      "g",
    );

    for (const ruta of ARCHIVOS) {
      if (!ruta.endsWith(".tsx")) continue;

      const encontrados = sinComentarios(readFileSync(ruta, "utf8")).match(patron);
      if (encontrados !== null) {
        culpables.push(`${relative(SRC, ruta)} → ${[...new Set(encontrados)].join(", ")}`);
      }
    }

    expect(
      culpables,
      `esos tokens se renombraron: \`success\` es \`done\` y \`warning\` es \`conflict\`. Una utilidad que apunta a un token retirado no pinta nada, y no falla en ninguna parte:\n${culpables.join(
        "\n",
      )}`,
    ).toEqual([]);
  });

  it("los nombres nuevos existen en los tokens", () => {
    for (const token of ["--color-done", "--color-conflict", "--color-info", "--color-danger"]) {
      expect(CSS, `falta ${token} en tokens.css`).toContain(`${token}:`);
    }
  });
});

describe("un componente de fuera se adopta sin su paleta", () => {
  const AJENAS = [
    "--background",
    "--foreground",
    "--card",
    "--popover",
    "--muted",
    "--accent",
    "--destructive",
    "--ring",
  ];

  it("la capa de alias existe y apunta a los tokens de aquí", () => {
    const alias = bloqueDe("@theme inline {");

    expect(alias).toContain("--color-background: var(--color-surface)");
    expect(alias).toContain("--color-muted-foreground: var(--color-ink-muted)");
    expect(alias).toContain("--color-destructive: var(--color-danger)");
  });

  it("ningún archivo declara una variable de color de la librería externa", () => {
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      const contenido = readFileSync(ruta, "utf8");

      const declaradas = AJENAS.filter((nombre) =>
        new RegExp(`^\\s*${nombre}\\s*:`, "m").test(contenido),
      );

      if (declaradas.length > 0) {
        culpables.push(`${relative(SRC, ruta)} → ${declaradas.join(", ")}`);
      }
    }

    expect(
      culpables,
      `el color sale de tokens.css. Copiar el tema de la librería daría dos fuentes de verdad:\n${culpables.join(
        "\n",
      )}`,
    ).toEqual([]);
  });

  it("ningún archivo usa la variante de tema de la librería", () => {
    const culpables: string[] = [];

    for (const ruta of ARCHIVOS) {
      if (!ruta.endsWith(".tsx")) continue;

      if (/\bdark:[a-z]/.test(sinComentarios(readFileSync(ruta, "utf8")))) {
        culpables.push(relative(SRC, ruta));
      }
    }

    expect(
      culpables,
      `el tema cambia el valor de los tokens: una pieza no escribe \`dark:\`. Estos se copiaron sin adaptar:\n${culpables.join(
        "\n",
      )}`,
    ).toEqual([]);
  });
});

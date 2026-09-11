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

/** Todo lo de `src`, menos el archivo de tokens y lo generado. */
const ARCHIVOS = archivosDe(SRC).filter(
  (ruta) => ruta !== TOKENS && !ruta.endsWith("routeTree.gen.ts"),
);

function sinComentarios(contenido: string): string {
  return contenido.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/**
 * Lo único que una batería puede comprobar de un tema.
 *
 * jsdom no aplica CSS, así que el ASPECTO se verifica abriendo pantallas, igual
 * que ya pasa al tocar cualquier token. Pero que un tema esté COMPLETO sí se
 * comprueba leyendo el archivo, y es la regresión que de verdad duele: el día
 * que alguien añada un semántico nuevo y se olvide de su valor oscuro, el fallo
 * aparece como un texto negro sobre negro en la pantalla que nadie abre.
 *
 * Los dos bloques oscuros declaran la misma lista a propósito —CSS no puede
 * aplicar un mismo bloque desde dentro y desde fuera de una media query—, así
 * que hay que comprobar los DOS. Que uno esté completo no dice nada del otro.
 */

/** El contenido entre llaves que abre en `desde`, contando anidamiento. */
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

const CLARO = coloresDe(bloqueDe("@theme {"));
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

  /*
   * Los dos bloques tienen que decir lo MISMO. Si uno declarase de más, habría
   * un token que solo existe cuando el tema se elige a mano y no cuando lo elige
   * el sistema — que es el caso que hoy usa todo el mundo.
   */
  it("los dos bloques oscuros declaran lo mismo", () => {
    expect([...POR_SISTEMA].sort()).toEqual([...POR_ATRIBUTO].sort());
  });

  /*
   * Lo que el tema NO puede cambiar. El coral, el ámbar y el rojo valen lo mismo
   * en los dos temas; el violeta solo se aclara. Es lo que hace que sea el mismo
   * producto y no dos, y por eso se fija aquí y no en un comentario.
   */
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

    // El coral de la acción y el ámbar de la moneda son el MISMO primitivo.
    expect(CSS).toContain("--noche-primary: var(--mnd-coral-700);");
    expect(CSS).toContain("--noche-coin: var(--mnd-amber-400);");
  });

  it("el esquema de color declarado al navegador sigue al tema", () => {
    expect(CSS).toContain("color-scheme: light dark;");
    expect(CSS).toMatch(/:root\[data-theme="dark"\]\s*\{\s*color-scheme: dark;/);
    expect(CSS).toMatch(/:root\[data-theme="light"\]\s*\{\s*color-scheme: light;/);
  });
});

/**
 * Un componente de fuera usa NUESTROS tokens, o no entra.
 *
 * La capa de alias deja que shadcn escriba `bg-background` y que eso resuelva a
 * la paleta de Monedín. Lo que hay que impedir es lo contrario: que alguien
 * copie también su bloque de tema, que traería un segundo juego de valores de
 * color — la regla del origen único, rota por la puerta de atrás.
 */
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

      // La declaración, no el uso: `--background: oklch(...)`. Los alias de
      // `tokens.css` van con el prefijo `--color-` y no casan con esto.
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

      // `dark:bg-…`. Aquí el tema cambia el VALOR de las variables, así que una
      // pieza no necesita la variante: si aparece, se copió sin adaptar.
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

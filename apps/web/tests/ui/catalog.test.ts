import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = (relativo: string): string => readFileSync(resolve(process.cwd(), relativo), "utf8");

const INDEX = raiz("src/ui/index.ts");
const CATALOGO = raiz("src/ui-catalog.tsx");

/**
 * Sin comentarios. El catálogo EXPLICA en su cabecera que no monta
 * `QueryClientProvider`, así que un test que busque ese nombre en el archivo
 * entero encuentra la propia documentación y falla por decir la verdad.
 */
const CATALOGO_SIN_COMENTARIOS = CATALOGO.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /\/\/[^\n]*/g,
  "",
);

/**
 * Los componentes exportados por `ui/index.ts`: los que empiezan por mayúscula.
 *
 * Se lee el ARCHIVO ENTERO y no línea a línea, que es como estaba y por eso no
 * servía: la expresión exigía la llave de cierre en la misma línea, así que una
 * exportación repartida en varias —lo que hace el formateador en cuanto la lista
 * de nombres es larga— no la veía ninguna, y esa pieza se saltaba el catálogo
 * sin que nada fallara.
 *
 * Lo destapó `DataTable`, la primera pieza con una exportación multilínea: el
 * agujero llevaba abierto desde `add-design-system` sin que se notara.
 */
function piezasExportadas(): string[] {
  const nombres = new Set<string>();

  for (const exportacion of INDEX.matchAll(/export \{([^}]*)\}/g)) {
    for (const parte of (exportacion[1] ?? "").split(",")) {
      const nombre = parte.trim();
      // Los tipos se exportan como `type Algo` y no son piezas que enseñar.
      // `AVATAR_OPTIONS` tampoco: es una constante, y se distingue porque un
      // componente es PascalCase y una constante va en mayúsculas y guiones.
      if (nombre !== "" && !nombre.startsWith("type ") && /^[A-Z][a-z]/.test(nombre)) {
        nombres.add(nombre);
      }
    }
  }

  return [...nombres];
}

/**
 * Un catálogo que envejece es como muere un sistema de diseño: alguien añade una
 * pieza, no la enseña, y la siguiente pantalla la reinventa porque no sabía que
 * existía. La lista vive donde se comprueba, igual que las rutas de solo cuenta
 * de la API.
 */
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
    // Si el catálogo necesitara `QueryClientProvider` o el router, alguna pieza
    // habría dejado de ser independiente del dominio sin que nadie se enterara.
    expect(CATALOGO_SIN_COMENTARIOS).not.toMatch(/QueryClientProvider|RouterProvider|createRouter/);
  });

  it("declara las dos escalas, porque enseñar una sola no enseña la diferencia", () => {
    expect(CATALOGO).toContain('data-scale="parent"');
    expect(CATALOGO).toContain('data-scale="child"');
  });
});

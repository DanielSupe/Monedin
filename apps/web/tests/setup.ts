import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Preparación común de los tests del front.
 *
 * `cleanup` desmonta lo montado tras cada test. Sin esto, dos tests que buscan
 * el mismo texto encuentran dos nodos y el segundo falla por ambigüedad, lo que
 * parece un fallo del componente y no lo es.
 */
afterEach(() => {
  cleanup();
});

/*
 * Lo que jsdom no implementa y Radix sí usa.
 *
 * jsdom no tiene la API de captura de puntero ni `scrollIntoView`. El gesto de
 * deslizar del `Toast` llama a `hasPointerCapture` en cuanto alguien lo toca, y
 * la excepción salta DESPUÉS de que el test haya terminado: los asserts pasan,
 * pero la ejecución acaba con un error y `vitest` devuelve un código distinto de
 * cero. Es la peor forma de fallar, porque parece un test frágil y no lo es.
 *
 * No es un doble de nada que estemos probando: es rellenar un hueco del entorno
 * para que el navegador simulado se parezca al de verdad. Si algún día se prueba
 * el gesto en sí, hará falta algo mejor que esto.
 */
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => undefined;
  Element.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.scrollIntoView ??= () => undefined;
}

/**
 * `matchMedia`, que jsdom tampoco implementa.
 *
 * El marco lo usa para montar UNA de las dos formas del lateral —columna fija o
 * cajón— en vez de las dos con una escondida por CSS. Sin este relleno, montar
 * la aplicación revienta.
 *
 * Por defecto responde que NO hay ancho, que es el modo estrecho: es lo que
 * suponen los tests que ya existían. Un test que quiera probar el modo ancho
 * llama a `conPantallaAncha()` antes de montar.
 */
let pantallaAncha = false;

export function conPantallaAncha(): void {
  pantallaAncha = true;
}

afterEach(() => {
  pantallaAncha = false;
});

if (typeof window !== "undefined") {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: pantallaAncha,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

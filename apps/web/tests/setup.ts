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

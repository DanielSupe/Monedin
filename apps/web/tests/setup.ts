import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => undefined;
  Element.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.scrollIntoView ??= () => undefined;
}

let pantallaAncha = false;
let movimientoReducido = false;

export function conPantallaAncha(): void {
  pantallaAncha = true;
}

export function conMovimientoReducido(): void {
  movimientoReducido = true;
}

afterEach(() => {
  pantallaAncha = false;
  movimientoReducido = false;
});

if (typeof window !== "undefined") {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: query.includes("prefers-reduced-motion") ? movimientoReducido : pantallaAncha,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {
    }
    unobserve(): void {
    }
    disconnect(): void {
    }
  };
}

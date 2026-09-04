import { useEffect, useState } from "react";
import type { SpotlightRect } from "../../ui/index.js";

/**
 * Dónde está en la pantalla el elemento que un paso explica.
 *
 * El paso nombra un ancla y las pantallas la declaran con `data-tutorial`. Se
 * busca por atributo y no por una referencia pasada de mano en mano porque
 * quien monta el recorrido —la pantalla de inicio— no es quien dibuja cada
 * trozo: encadenar referencias obligaría a que cada componente intermedio
 * supiera del recorrido.
 *
 * Devuelve `undefined` cuando el ancla NO está en la pantalla, y eso no es un
 * error: un paso sin ancla se muestra centrado y sin destacar nada. Es lo que
 * hace que el recorrido funcione en una cuenta recién creada — que es
 * exactamente cuando se ve.
 *
 * Se vuelve a medir al cambiar de ancla y al cambiar el tamaño de la ventana.
 * No al desplazar: mientras el recorrido está abierto el resto del documento
 * queda inerte, así que no hay nada que desplazar.
 */
export function useAnchorRect(anchor: string | undefined): SpotlightRect | undefined {
  const [rect, setRect] = useState<SpotlightRect | undefined>(undefined);

  useEffect(() => {
    if (anchor === undefined) {
      setRect(undefined);
      return;
    }

    const medir = (): void => {
      const elemento = document.querySelector(`[data-tutorial="${anchor}"]`);

      if (elemento === null) {
        setRect(undefined);
        return;
      }

      const caja = elemento.getBoundingClientRect();
      setRect({ top: caja.top, left: caja.left, width: caja.width, height: caja.height });
    };

    medir();
    window.addEventListener("resize", medir);

    return () => window.removeEventListener("resize", medir);
  }, [anchor]);

  return rect;
}

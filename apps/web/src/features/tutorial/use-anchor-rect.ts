import { useEffect, useState } from "react";
import type { SpotlightRect } from "../../ui/index.js";

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

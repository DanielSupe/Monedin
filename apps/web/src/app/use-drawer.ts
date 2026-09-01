import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * El estado del cajón de navegación, y su cierre al llegar a un destino.
 *
 * **Esto no contradice «la navegación es del router, no del estado».** Esa regla
 * habla de QUÉ PANTALLA se enseña; abrir un cajón es una revelación, no un
 * destino. La prueba es que se comporta al revés que el modo «administrar» de la
 * rejilla, que sí fue a la dirección:
 *
 *   ?manage=true                            este cajón
 *   ────────────                            ──────────
 *   tiene que SOBREVIVIR a una navegación   tiene que MORIR con ella
 *   cruza hasta el teclado de PIN           no cruza a ningún sitio
 *   recargar lo conserva                    recargar lo abriría sin que nadie lo pida
 *   atrás sale del modo                     atrás debe VOLVER, no cerrar un panel
 *
 * Se cierra **al cambiar la dirección** y no en el `onClick` de cada enlace: el
 * botón atrás también cambia la dirección, y un panel abierto tapando la
 * pantalla a la que se acaba de volver es peor que no tenerlo.
 */
export function useDrawer(): { open: boolean; setOpen: (open: boolean) => void } {
  const [open, setOpen] = useState(false);
  const ruta = useRouterState({ select: (estado) => estado.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [ruta]);

  return { open, setOpen };
}

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cx } from "./cx.js";

/** Dónde está lo que se destaca, en coordenadas de la ventana. */
export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface SpotlightProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Qué es esto. Se anuncia; no hace falta que se vea dos veces. */
  title: string;
  /** Lo que explica el paso. Se anuncia junto al título. */
  description: string;
  /** Sin él, el panel va centrado y se atenúa la pantalla entera. */
  rect?: SpotlightRect;
  /** Lo que acompaña al texto: una ilustración, un contador de pasos. */
  children?: ReactNode;
  /** Los controles. El de avanzar es lo único que actúa mientras está abierto. */
  footer: ReactNode;
}

/**
 * Atenúa la pantalla y deja destacada una parte de ella, con un panel al lado.
 *
 * SOBRE LAS PRIMITIVAS DE RADIX, NO SOBRE `Dialog`. Aquella pieza cubre la
 * pantalla entera y centra su tarjeta, que es exactamente lo contrario de lo
 * que hace falta aquí. Lo que sí se reutiliza es su comportamiento —foco
 * atrapado, cierre con Escape, resto del documento inerte y anuncio por
 * título—, que su propia cabecera advierte que «no se escribe bien a mano, y lo
 * peor es que roto no se nota hasta que alguien lo necesita de verdad».
 *
 * Que el resto quede INERTE no es un efecto colateral que haya que sortear: es
 * lo que hace falta. Lo que se pulsa es el control de avanzar, nunca el
 * elemento iluminado — el foco señala, no invita a interactuar.
 *
 * NO SABE DE DOMINIO: recibe dónde destacar y qué decir. Ni perfiles, ni roles,
 * ni qué pantalla la monta. Es la misma frontera que impide a `Pagination`
 * construir sus propios enlaces.
 *
 * ESTILO EN LÍNEA, y es la CUARTA excepción del proyecto tras `ProgressBar`,
 * `Orbits` e `ImageUploadField`. Cada llamada nueva a `allowInlineStyles()`
 * debilita la regla, así que conviene justificarla: la posición y el tamaño del
 * hueco salen de medir un elemento en ejecución, y no hay token que exprese
 * «donde está esa tarjeta ahora mismo». Toda la geometría está concentrada AQUÍ
 * para que la excepción cubra lo mínimo.
 */

/** Cuánto respira el hueco alrededor de lo que destaca. */
const AIRE = 8;

/**
 * Dónde cabe el panel sin tocar lo que se destaca.
 *
 * La primera versión miraba en qué MITAD de la ventana caía el hueco y ponía el
 * panel al otro lado. No basta: el panel mide lo que mida su contenido, así que
 * en una pantalla baja crecía hasta meterse en el hueco igualmente — el lado
 * era el correcto y el tamaño no.
 *
 * Ahora se mide la banda libre a cada lado y se elige LA MÁS GRANDE, y el panel
 * se limita a caber en ella. Es lo que convierte «normalmente no lo tapa» en «no
 * lo tapa»: si el contenido no cabe, se desplaza dentro del panel, que es la
 * única salida que no invade nada.
 */
function colocacion(rect: SpotlightRect | undefined): Record<string, string | number> {
  if (rect === undefined) {
    // Sin nada que destacar no hay nada que esquivar: abajo, con el mismo tope
    // de alto por si el contenido creciera.
    return { bottom: AIRE * 3, maxHeight: `calc(100dvh - ${AIRE * 6}px)` };
  }

  const arriba = rect.top;
  const abajo = window.innerHeight - (rect.top + rect.height);

  return abajo >= arriba
    ? { top: rect.top + rect.height + AIRE * 3, maxHeight: Math.max(abajo - AIRE * 5, 0) }
    : { bottom: window.innerHeight - rect.top + AIRE * 3, maxHeight: Math.max(arriba - AIRE * 5, 0) };
}

export function Spotlight({
  open,
  onOpenChange,
  title,
  description,
  rect,
  children,
  footer,
}: SpotlightProps): React.ReactElement {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        {/*
          El velo de Radix va TRANSPARENTE: sigue haciendo su trabajo —marcar
          inerte lo de debajo y cerrar al pulsar fuera— y lo que se ve lo pinta
          el hueco de abajo. Si además tiñera, el atenuado saldría doble.
        */}
        <RadixDialog.Overlay className="fixed inset-0" />

        {rect === undefined ? (
          /* Sin nada que destacar: se atenúa la pantalla entera. */
          <div aria-hidden="true" className="fixed inset-0 bg-ink/70" />
        ) : (
          /*
            EL AGUJERO ES UNA SOMBRA, no un recorte.

            Una caja colocada sobre lo destacado, con una sombra enorme y opaca
            proyectada hacia fuera: tiñe todo lo de alrededor y deja limpio lo de
            dentro. Sin máscaras, sin SVG y sin recalcular una silueta — mover la
            caja mueve el agujero.

            La alternativa eran cuatro rectángulos alrededor del hueco, que hay
            que mantener sincronizados en cada medida y dejan costura en las
            esquinas.
          */
          <div
            aria-hidden="true"
            style={{
              top: rect.top - AIRE,
              left: rect.left - AIRE,
              width: rect.width + AIRE * 2,
              height: rect.height + AIRE * 2,
              boxShadow: "0 0 0 100vmax var(--color-spotlight-veil)",
            }}
            className="rounded-card pointer-events-none fixed transition-all duration-normal motion-reduce:transition-none"
          />
        )}

        {/* Colocado en la banda libre y limitado a caber en ella. Ver `colocacion`. */}
        <RadixDialog.Content
          style={colocacion(rect)}
          className={cx(
            "rounded-card fixed inset-x-4 mx-auto flex max-w-dialog flex-col gap-3",
            "border border-border bg-surface-raised p-5 shadow-raised",
            // Si el contenido no cabe en la banda libre, se desplaza DENTRO del
            // panel: es la única salida que no invade lo que se está señalando.
            "overflow-y-auto",
          )}
        >
          <RadixDialog.Title className="text-title font-bold text-ink">{title}</RadixDialog.Title>
          <RadixDialog.Description className="text-body text-ink-muted">
            {description}
          </RadixDialog.Description>

          {children}

          <div className="flex flex-wrap items-center justify-between gap-2">{footer}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

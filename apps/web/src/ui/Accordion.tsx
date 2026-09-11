import * as RadixAccordion from "@radix-ui/react-accordion";
import type { ReactNode } from "react";

export interface AccordionItem {
  /** Estable y único dentro de la lista. */
  value: string;
  /** Lo que se lee plegado. Es la pregunta, no la respuesta. */
  label: string;
  /**
   * Lo que va DELANTE de la pregunta: un número, una tesela, nada.
   *
   * Decorativo por contrato —lo que nombra la fila es su pregunta—, y por eso lo
   * pone quien coloca la lista y no la pieza: un acordeón no sabe si sus
   * elementos se numeran.
   */
  lead?: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
}

/**
 * Contenido que se pliega y se despliega EN SU SITIO.
 *
 * Es la tercera forma de revelación del sistema, y responde a otra pregunta que
 * las dos que ya había: `Dialog` interrumpe para pedir algo, `Drawer` saca una
 * lista de destinos por un lado, y esto despliega una respuesta larga sin sacar
 * a nadie de donde estaba.
 *
 * SOBRE RADIX, y por lo mismo que `Dialog` y `Tabs`: el estado anunciado a quien
 * no ve la pantalla, la relación entre el control y la región que revela, y el
 * recorrido con flechas y con Inicio y Fin. Escrito a mano son cinco detalles y
 * cada uno se olvida una vez — y se olvida justo para quien no usa el ratón.
 *
 * DESCARTADO, `<details>` y `<summary>` nativos: cero dependencia y accesibles
 * de fábrica, que es un argumento serio. Se descartan porque no se animan de
 * forma consistente entre navegadores y su marcador se estiliza de forma
 * irregular. No por no poder controlar cuántos se abren a la vez, que sí se
 * resuelve.
 *
 * VARIAS ABIERTAS A LA VEZ, y lo decide esta pieza y no quien la coloca. Quien
 * lee unas preguntas frecuentes compara dos respuestas; cerrar la primera al
 * abrir la segunda obliga a recordar lo que decía. Si algún día hace falta el
 * comportamiento contrario, se añade aquí como opción y con su motivo, no se
 * resuelve fuera.
 */
export function Accordion({ items }: AccordionProps): React.ReactElement {
  return (
    <RadixAccordion.Root type="multiple" className="flex flex-col gap-2">
      {items.map((item) => (
        <RadixAccordion.Item
          key={item.value}
          value={item.value}
          className="rounded-card border border-border bg-surface-raised"
        >
          <RadixAccordion.Header className="m-0">
            {/*
              `w-full` y `text-left`: el disparador ocupa la fila entera, así que
              el objetivo de toque es toda la pregunta y no solo sus letras. En
              la escala del niño eso es la diferencia entre acertar y no.
            */}
            <RadixAccordion.Trigger className="group tap-target text-body flex w-full items-center justify-between gap-3 border-0 bg-transparent px-4 text-left font-semibold text-ink">
              {item.lead !== undefined && (
                <span aria-hidden="true" className="shrink-0">
                  {item.lead}
                </span>
              )}

              <span className="flex-1">{item.label}</span>
              {/*
                El signo es DECORATIVO: quien no ve la pantalla ya oye si está
                abierto o cerrado, porque Radix lo anuncia en el propio botón.
                Dibujarlo además en el icono se lo diría dos veces.
              */}
              <Chevron />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>

          <RadixAccordion.Content className="text-body px-4 pb-4 text-ink-muted">
            {item.content}
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}

/**
 * Gira al abrir.
 *
 * El giro va bajo `motion-safe:`, porque girar es movimiento. Y el signo cambia
 * igual sin él: quien pidió no ver movimiento sigue viendo la flecha del revés,
 * solo que sin la transición. Bajar la duración no valdría — el bloque del
 * sistema la deja en un instante, que es un salto y no una mejora.
 */
function Chevron(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      className="size-5 shrink-0 motion-safe:transition-transform motion-safe:duration-normal group-data-[state=open]:rotate-180"
    >
      <path d="M6 9l6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

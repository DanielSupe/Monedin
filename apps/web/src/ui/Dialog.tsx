import * as RadixDialog from "@radix-ui/react-dialog";
import { type ReactNode, useRef } from "react";
import { messages } from "../lib/messages.js";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Se anuncia junto al título. Para confirmar algo irreversible, dilo aquí. */
  description?: string;
  children: ReactNode;
  /** Los botones del pie. La acción destructiva NUNCA es la primera. */
  footer?: ReactNode;
}

/**
 * Diálogo modal, sobre Radix y a conciencia.
 *
 * Un diálogo correcto atrapa el foco, lo devuelve al cerrarse, cierra con
 * Escape, marca el resto del documento como inerte y se anuncia con su título.
 * Nada de eso se escribe bien a mano, y lo peor es que roto no se nota hasta
 * que alguien lo necesita de verdad. Ver decisión 4 del design.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: DialogProps): React.ReactElement {
  /*
   * A quién le devolvemos el foco al cerrar.
   *
   * Radix hace `preventDefault()` sobre el retorno de foco del navegador y se lo
   * da a su `Trigger`. Aquí no hay `Trigger` —el diálogo se abre con `open`
   * controlado, porque en esta app lo dispara la fila de una lista o el
   * resultado de una mutación—, así que sin esto el foco se pierde en el `body`
   * y quien navega con teclado se queda en la nada tras cada confirmación.
   *
   * Se captura DURANTE el render, en la transición de cerrado a abierto: un
   * efecto llegaría tarde, porque los efectos de los hijos corren antes que los
   * del padre y para entonces Radix ya movió el foco dentro del diálogo.
   */
  const estabaAbierto = useRef(open);
  const abridor = useRef<HTMLElement | null>(null);

  if (open && !estabaAbierto.current) {
    abridor.current = document.activeElement as HTMLElement | null;
  }
  estabaAbierto.current = open;

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-ink/40" />
        {/* Centrado con `inset-x` + `mx-auto` y no con una anchura calculada:
            así no hace falta un valor arbitrario y cabe en cualquier pantalla. */}
        <RadixDialog.Content
          onCloseAutoFocus={(evento) => {
            evento.preventDefault();
            abridor.current?.focus();
          }}
          className="rounded-card fixed inset-x-4 top-1/2 mx-auto flex max-w-dialog -translate-y-1/2 flex-col gap-3 border border-border bg-surface-raised p-5 shadow-raised"
        >
          <RadixDialog.Title className="text-title font-bold text-ink">{title}</RadixDialog.Title>

          {description !== undefined ? (
            <RadixDialog.Description className="text-body text-ink-muted">
              {description}
            </RadixDialog.Description>
          ) : (
            /* Radix avisa por consola si falta. Decirle que no hay es explícito. */
            <RadixDialog.Description />
          )}

          <div className="text-body text-ink">{children}</div>

          {footer !== undefined && <div className="flex flex-wrap justify-end gap-2">{footer}</div>}

          <RadixDialog.Close
            aria-label={messages.ui.dismiss}
            className="tap-target rounded-control absolute right-2 top-2 border-transparent bg-transparent px-2 text-ink-muted"
          >
            <span aria-hidden="true">×</span>
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

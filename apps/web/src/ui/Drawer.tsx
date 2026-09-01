import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Qué contiene. Se anuncia a quien no ve la disposición. */
  label: string;
  /** El control que lo abre. Va dentro del `Trigger`, así que Radix le devuelve el foco. */
  trigger: ReactNode;
  children: ReactNode;
}

/**
 * Panel anclado a la izquierda, sobre Radix.
 *
 * Atrapa el foco mientras está abierto, cierra con Escape, deja inerte el resto
 * del documento y devuelve el foco al control que lo abrió. Nada de eso se
 * escribe bien a mano, y lo peor es que roto no se nota hasta que alguien lo
 * necesita de verdad — el mismo argumento con el que se eligió Radix para
 * `Dialog`.
 *
 * NO es `Dialog` colocado a un lado con clases. `cx` no es `twMerge`, así que
 * dos posiciones en la misma cadena las resolvería el orden del CSS generado y
 * no el del código. Y las dos formas difieren de verdad: `Dialog` es título,
 * descripción, cuerpo y pie de botones, y se abre SIN disparador —por eso lleva
 * un baile de `useRef` para devolver el foco—. Este tiene disparador, así que
 * Radix lo devuelve solo.
 *
 * Controlado Y con `Trigger`, las dos cosas a la vez: `open` controlado es lo
 * que permite cerrarlo desde fuera —al cambiar la dirección—, y el `Trigger` es
 * lo que hace que el foco vuelva a su sitio.
 *
 * Sin dominio y sin router: el contenido lo pone quien lo usa, igual que
 * `Pagination` recibe sus enlaces.
 */
export function Drawer({
  open,
  onOpenChange,
  label,
  trigger,
  children,
}: DrawerProps): React.ReactElement {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>

      <RadixDialog.Portal>
        {/* Pulsar fuera cierra: Radix lo hace por su cuenta con la superposición. */}
        <RadixDialog.Overlay className="fixed inset-0 bg-ink/40" />

        <RadixDialog.Content
          aria-label={label}
          className="fixed inset-y-0 left-0 flex w-sidebar max-w-full flex-col border-r border-border bg-surface-raised shadow-raised"
        >
          {/*
            Radix exige un título y avisa por consola si falta. Va OCULTO a la
            vista y no ausente: lo que se ve es la lista, pero quien usa un
            lector de pantalla necesita saber en qué acaba de entrar.
          */}
          <RadixDialog.Title className="sr-only">{label}</RadixDialog.Title>
          <RadixDialog.Description className="sr-only">{label}</RadixDialog.Description>

          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

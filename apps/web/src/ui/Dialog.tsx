import * as RadixDialog from "@radix-ui/react-dialog";
import { type ReactNode, useRef } from "react";
import { messages } from "../lib/messages.js";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;

  description?: string;
  children: ReactNode;

  footer?: ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: DialogProps): React.ReactElement {
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

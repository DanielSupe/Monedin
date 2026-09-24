import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  label: string;

  trigger: ReactNode;
  children: ReactNode;
}

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

        <RadixDialog.Overlay className="fixed inset-0 bg-ink/40" />

        <RadixDialog.Content
          aria-label={label}
          className="fixed inset-y-0 left-0 flex w-sidebar max-w-full flex-col border-r border-border bg-surface-raised shadow-raised"
        >

          <RadixDialog.Title className="sr-only">{label}</RadixDialog.Title>
          <RadixDialog.Description className="sr-only">{label}</RadixDialog.Description>

          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

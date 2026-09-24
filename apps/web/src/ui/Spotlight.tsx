import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cx } from "./cx.js";

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface SpotlightProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;

  description: string;

  rect?: SpotlightRect;

  children?: ReactNode;

  footer: ReactNode;
}

const AIRE = 8;

function colocacion(rect: SpotlightRect | undefined): Record<string, string | number> {
  if (rect === undefined) {
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

        <RadixDialog.Overlay className="fixed inset-0" />

        {rect === undefined ? (
          <div aria-hidden="true" className="fixed inset-0 bg-ink/70" />
        ) : (
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

        <RadixDialog.Content
          style={colocacion(rect)}
          className={cx(
            "rounded-card fixed inset-x-4 mx-auto flex max-w-dialog flex-col gap-3",
            "border border-border bg-surface-raised p-5 shadow-raised",

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

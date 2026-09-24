import * as RadixToast from "@radix-ui/react-toast";
import type { ReactNode } from "react";
import { messages } from "../lib/messages.js";
import { cx } from "./cx.js";

export type ToastTone = "info" | "done" | "conflict" | "danger";

const TONES: Record<ToastTone, string> = {
  info: "border-info bg-info-soft",
  done: "border-done bg-done-soft",
  conflict: "border-conflict bg-conflict-soft",
  danger: "border-danger bg-danger-soft",
};

export function ToastProvider({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <RadixToast.Provider swipeDirection="right">
      {children}
      <RadixToast.Viewport className="fixed bottom-0 right-0 z-toast flex w-full max-w-dialog flex-col gap-2 p-4" />
    </RadixToast.Provider>
  );
}

export interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tone?: ToastTone;
  title: string;
  description?: string;
}

export function Toast({
  open,
  onOpenChange,
  tone = "info",
  title,
  description,
}: ToastProps): React.ReactElement {
  return (
    <RadixToast.Root
      open={open}
      onOpenChange={onOpenChange}
      className={cx("rounded-card border-l-4 p-3 shadow-raised", TONES[tone])}
    >
      <RadixToast.Title className="text-body font-bold text-ink">{title}</RadixToast.Title>
      {description !== undefined && (
        <RadixToast.Description className="text-small text-ink-muted">
          {description}
        </RadixToast.Description>
      )}
      <RadixToast.Close
        aria-label={messages.ui.dismiss}
        className="tap-target rounded-control absolute right-1 top-1 border-transparent bg-transparent px-2 text-ink-muted"
      >
        <span aria-hidden="true">×</span>
      </RadixToast.Close>
    </RadixToast.Root>
  );
}

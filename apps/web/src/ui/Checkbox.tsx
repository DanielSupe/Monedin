import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { useId, type ReactNode } from "react";
import { cx } from "./cx.js";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;

  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  children,
  disabled = false,
  className,
}: CheckboxProps): React.ReactElement {
  const nombre = useId();

  return (
    <label
      className={cx(
        "rounded-control tap-target flex cursor-pointer items-center gap-3 border-2 px-3 py-2 transition duration-quick",
        checked
          ? "border-primary bg-primary-soft"
          : "border-border bg-surface-raised hover:bg-surface-sunken",
        disabled && "cursor-not-allowed opacity-55",
        className,
      )}
    >
      <RadixCheckbox.Root
        checked={checked}
        onCheckedChange={(estado) => onCheckedChange(estado === true)}
        disabled={disabled}
        aria-labelledby={nombre}
        className={cx(
          "rounded-control flex size-6 shrink-0 items-center justify-center border-2 transition duration-quick",
          checked ? "border-primary bg-primary" : "border-border-strong bg-surface-raised",
        )}
      >
        <RadixCheckbox.Indicator className="text-ink-inverted">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>

      <span id={nombre} className="text-body min-w-0 font-semibold">
        {children}
      </span>
    </label>
  );
}

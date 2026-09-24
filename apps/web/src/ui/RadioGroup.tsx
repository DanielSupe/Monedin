import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import { cx } from "./cx.js";

export interface RadioOption {
  value: string;
  label: string;

  hint?: string;
}

export interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function RadioGroup({
  label,
  options,
  value,
  onValueChange,
  className,
}: RadioGroupProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-body font-bold text-ink">{label}</span>

      <RadixRadioGroup.Root
        aria-label={label}
        value={value}
        onValueChange={onValueChange}
        className={cx("flex flex-col gap-2 sm:flex-row", className)}
      >
        {options.map((opcion) => {
          const elegida = opcion.value === value;

          return (
            <label
              key={opcion.value}
              className={cx(
                "rounded-control tap-target flex flex-1 cursor-pointer items-center gap-3 border-2 px-3 py-2 transition duration-quick",
                elegida
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface-raised hover:bg-surface-sunken",
              )}
            >
              <RadixRadioGroup.Item
                value={opcion.value}
                aria-label={opcion.label}
                className={cx(
                  "rounded-pill flex size-5 shrink-0 items-center justify-center border-2",
                  elegida ? "border-primary" : "border-border-strong",
                )}
              >

                <RadixRadioGroup.Indicator className="rounded-pill block size-2.5 bg-primary" />
              </RadixRadioGroup.Item>

              <span className="flex min-w-0 flex-col">
                <span className="text-body font-semibold">{opcion.label}</span>
                {opcion.hint !== undefined && (
                  <span className="text-small text-ink-muted">
                    {opcion.hint}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </RadixRadioGroup.Root>
    </div>
  );
}

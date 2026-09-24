import { type SelectHTMLAttributes, forwardRef } from "react";
import { useField } from "./Field.js";
import { cx } from "./cx.js";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, id, "aria-describedby": describedBy, "aria-invalid": invalid, ...rest },
  ref,
) {
  const field = useField();

  return (
    <select
      {...rest}
      ref={ref}
      id={id ?? field?.controlId}
      aria-describedby={describedBy ?? field?.describedBy}
      aria-invalid={invalid ?? (field?.invalid === true ? true : undefined)}
      className={cx(
        "tap-target rounded-control text-body w-full border bg-surface-raised px-3 text-ink transition-colors duration-quick",
        "disabled:cursor-not-allowed disabled:opacity-55",
        field?.invalid === true ? "border-danger" : "border-border-strong",
        className,
      )}
    />
  );
});

import { type InputHTMLAttributes, forwardRef } from "react";
import { useField } from "./Field.js";
import { cx } from "./cx.js";

export type InputShape = "box" | "pill";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  shape?: InputShape;
}

const SHAPES: Record<InputShape, string> = {
  box: "rounded-control px-3",

  pill: "rounded-pill shadow-card pl-11 pr-4",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, shape = "box", "aria-describedby": describedBy, "aria-invalid": invalid, ...rest },
  ref,
) {
  const field = useField();

  return (
    <input
      {...rest}
      ref={ref}
      id={id ?? field?.controlId}
      aria-describedby={describedBy ?? field?.describedBy}
      aria-invalid={invalid ?? (field?.invalid === true ? true : undefined)}
      className={cx(
        "tap-target text-body w-full border bg-surface-raised text-ink transition-colors duration-quick",
        SHAPES[shape],
        "placeholder:text-ink-muted disabled:cursor-not-allowed disabled:opacity-55",
        field?.invalid === true ? "border-danger" : "border-border-strong",
        className,
      )}
    />
  );
});

import { type InputHTMLAttributes, forwardRef } from "react";
import { useField } from "./Field.js";
import { cx } from "./cx.js";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Entrada de texto. Dentro de un `Field` se cablea sola: id, descripción y
 * estado inválido salen del contexto y no de la pantalla que la usa.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, "aria-describedby": describedBy, "aria-invalid": invalid, ...rest },
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
        "tap-target rounded-control text-body w-full border bg-surface-raised px-3 text-ink transition-colors duration-quick",
        "placeholder:text-ink-muted disabled:cursor-not-allowed disabled:opacity-55",
        field?.invalid === true ? "border-danger" : "border-border-strong",
        className,
      )}
    />
  );
});

import { type InputHTMLAttributes, forwardRef } from "react";
import { useField } from "./Field.js";
import { cx } from "./cx.js";

export type InputShape = "box" | "pill";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * `pill` deja además sitio a la izquierda para un icono.
   *
   * Es una OPCIÓN de la pieza y no una clase desde fuera: `cx` no fusiona
   * utilidades de Tailwind, así que dos radios en la misma cadena los resuelve
   * el orden del CSS generado y no el del código. Ver la decisión 4 del design
   * de `redesign-access`.
   */
  shape?: InputShape;
}

const SHAPES: Record<InputShape, string> = {
  box: "rounded-control px-3",
  // El relleno izquierdo deja hueco al icono, que lo posiciona `Field` con el
  // envoltorio de abajo. El derecho iguala para que el texto no quede pegado.
  /*
   * Con borde y no transparente: sobre una superficie de color, una sombra sola
   * no sostiene el campo. El borde sale de `--color-border`, que la superficie
   * de marca reasigna a su propio tono, así que sobre blanco sigue siendo el
   * gris de siempre.
   */
  pill: "rounded-full shadow-card pl-11 pr-4",
};

/**
 * Entrada de texto. Dentro de un `Field` se cablea sola: id, descripción y
 * estado inválido salen del contexto y no de la pantalla que la usa.
 */
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

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cx } from "./cx.js";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/**
 * El tono no se elige por color sino por lo que la acción SIGNIFICA. Por eso
 * son cuatro nombres y no una paleta: quien usa la pieza no decide un color.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-ink-inverted hover:bg-primary-hover",
  secondary: "border-border-strong bg-surface-raised text-ink hover:bg-surface-sunken",
  ghost: "border-transparent bg-transparent text-primary hover:bg-primary-soft",
  danger: "border-danger bg-danger text-ink-inverted hover:brightness-110",
};

/**
 * Las clases de un botón, para lo que NO es un botón.
 *
 * Navegar es trabajo de un enlace: se abre en otra pestaña, se copia, y un
 * lector de pantalla lo anuncia como enlace. Envolver un `<Button>` en un
 * `<Link>` anida dos elementos interactivos, que es un defecto de accesibilidad
 * — y uno en el que ya se cayó dos veces. Con esto, un enlace se ve igual que un
 * botón sin dejar de ser un enlace.
 */
export function buttonClasses(variant: ButtonVariant = "secondary", block = false): string {
  return cx(
    "tap-target rounded-control text-body inline-flex items-center justify-center gap-2 border px-4 font-semibold no-underline transition-colors duration-normal",
    "disabled:cursor-not-allowed disabled:opacity-55",
    VARIANTS[variant],
    block && "w-full",
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /**
   * La operación está en curso. Deshabilita ademas de anunciar: la spec exige
   * que no admita una segunda activación, y ese es justo el doble tap que la
   * API resuelve con un 409. Que la interfaz no lo provoque es lo barato.
   */
  pending?: boolean;
  /** Ocupa todo el ancho disponible. */
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", pending = false, block = false, className, disabled, type, ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      // Sin `type` explícito, un botón dentro de un formulario lo envía. Es el
      // error más silencioso de React y se corta aquí, no en cada pantalla.
      type={type ?? "button"}
      disabled={disabled === true || pending}
      aria-busy={pending || undefined}
      className={cx(buttonClasses(variant, block), className)}
    />
  );
});

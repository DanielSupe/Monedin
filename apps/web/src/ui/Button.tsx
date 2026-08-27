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

/**
 * Un botón redondo con SOLO un símbolo dentro.
 *
 * Existe para el envío del acceso, que la maqueta dibuja como una flecha. Va
 * aquí y no como clases sueltas en la pantalla porque `cx` no fusiona
 * utilidades: `rounded-full` junto al radio de la pieza lo resolvería el orden
 * del CSS generado.
 *
 * Quien la use TIENE que dar `aria-label`: una flecha sola no dice si envía,
 * avanza o vuelve. El tipo lo exige, así que olvidarlo no compila.
 */
const ICON_ONLY = "size-14 shrink-0 rounded-full px-0";

interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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

/**
 * Redondo y sin texto EXIGE nombre, y lo exige el tipo.
 *
 * Es una unión y no una prop opcional a propósito: con `iconOnly?: true` y
 * `aria-label` suelto, olvidar el nombre compila y el botón se anuncia como
 * «botón» a secas. Así no compila, que es como este proyecto hace cumplir una
 * regla que importa.
 */
export type ButtonProps = ButtonBaseProps &
  ({ iconOnly: true; "aria-label": string } | { iconOnly?: false | undefined });

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", pending = false, block = false, iconOnly, className, disabled, type, ...rest },
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
      className={cx(buttonClasses(variant, block), iconOnly === true && ICON_ONLY, className)}
    />
  );
});

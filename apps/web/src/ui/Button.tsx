import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cx } from "./cx.js";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "contrast";

/**
 * La talla de una acción, y por qué es una OPCIÓN de la pieza.
 *
 * Una llamada a la acción de una página que convence no puede pesar lo mismo
 * que el botón de un formulario que ya se está rellenando: en la primera hay
 * que encontrarla, en el segundo ya se está mirando.
 *
 * Se declara aquí y no desde fuera con utilidades sueltas por lo mismo que la
 * forma del `Avatar`: `cx` no fusiona utilidades de Tailwind, así que un
 * `px-6 text-title` pasado desde la pantalla junto a los de la pieza lo
 * resolvería el orden del CSS generado y no el del código — un fallo que no se
 * ve leyendo y que no tiene por qué ser estable entre compilaciones.
 */
export type ButtonSize = "default" | "large";

const SIZES: Record<ButtonSize, string> = {
  default: "tap-target text-body px-4",
  large: "tap-target-large text-title px-6",
};

/**
 * El tono no se elige por color sino por lo que la acción SIGNIFICA. Por eso
 * son nombres y no una paleta: quien usa la pieza no decide un color.
 *
 * `contrast` es la acción principal cuando el fondo YA es del color de la
 * marca. No se llama `onBrand` ni `inverse` porque eso describiría el color y
 * no el papel; lo que promete es «destaca contra su superficie».
 *
 * Y esa promesa ya se cobró: nació de tinta oscura, cuando la superficie era
 * ámbar claro, y al pasar el acceso a índigo profundo cambió a ámbar sin tocar
 * su nombre ni un solo punto de uso. Eso es exactamente lo que se gana
 * nombrando por el papel y no por el color.
 *
 * Sobre índigo, el ámbar es además el único punto cálido de la pantalla, y
 * significa lo que el producto entero enseña: dinero.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-ink-inverted hover:bg-primary-hover",
  secondary: "border-border-strong bg-surface-raised text-ink hover:bg-surface-sunken",
  ghost: "border-transparent bg-transparent text-primary hover:bg-primary-soft",
  danger: "border-danger bg-danger text-ink-inverted hover:brightness-110",
  contrast: "border-coin bg-coin text-coin-ink hover:brightness-105",
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
export function buttonClasses(
  variant: ButtonVariant = "secondary",
  block = false,
  size: ButtonSize = "default",
): string {
  return cx(
    "rounded-control inline-flex items-center justify-center gap-2 border font-semibold no-underline transition-colors duration-normal",
    "disabled:cursor-not-allowed disabled:opacity-55",
    SIZES[size],
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
  size?: ButtonSize;
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
  { variant = "secondary", size = "default", pending = false, block = false, iconOnly, className, disabled, type, ...rest },
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
      className={cx(buttonClasses(variant, block, size), iconOnly === true && ICON_ONLY, className)}
    />
  );
});

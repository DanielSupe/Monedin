import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cx } from "./cx.js";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "contrast";

export type ButtonSize = "default" | "large" | "keypad";

const SIZES: Record<ButtonSize, string> = {
  default: "tap-target text-body px-4",
  large: "tap-target-large text-title px-6",
  keypad: "text-display size-16",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-ink-inverted hover:bg-primary-hover",
  secondary: "border-border-strong bg-surface-raised text-ink hover:bg-surface-sunken",
  ghost: "border-transparent bg-transparent text-primary hover:bg-primary-soft",

  danger: "border-danger-solid bg-danger-solid text-ink-inverted hover:brightness-110",
  contrast: "border-coin bg-coin text-on-coin hover:brightness-105",
};

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

const ICON_ONLY = "size-14 shrink-0 rounded-pill px-0";

interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;

  pending?: boolean;

  block?: boolean;
}

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

      type={type ?? "button"}
      disabled={disabled === true || pending}
      aria-busy={pending || undefined}
      className={cx(buttonClasses(variant, block, size), iconOnly === true && ICON_ONLY, className)}
    />
  );
});

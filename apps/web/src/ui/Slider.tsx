import * as RadixSlider from "@radix-ui/react-slider";
import { cx } from "./cx.js";

export interface SliderProps {
  /** Qué se está ajustando. Lo oye quien no ve la pantalla. */
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * Ajustar un valor continuo, hoy solo el acercamiento del recortador de fotos.
 *
 * Sobre Radix por la misma razón que la casilla y el grupo de opción: lo que
 * aporta no es la barra, es que funcione con el teclado —flechas, inicio, fin—,
 * que arrastre en táctil sin seleccionar texto por error, y que se anuncie con
 * su valor actual y su rango. Una barra escrita a mano con `onPointerMove` es
 * una barra que solo sirve con ratón.
 *
 * Un valor y no dos: el único uso de hoy es un acercamiento. Aceptar un rango
 * sería una API que nadie pide y que habría que mantener hasta que alguien la
 * necesite.
 */
export function Slider({
  label,
  value,
  onValueChange,
  min = 1,
  max = 3,
  step = 0.1,
  className,
}: SliderProps): React.ReactElement {
  return (
    <RadixSlider.Root
      aria-label={label}
      value={[value]}
      onValueChange={([siguiente]) => onValueChange(siguiente ?? min)}
      min={min}
      max={max}
      step={step}
      className={cx("tap-target relative flex w-full touch-none items-center", className)}
    >
      <RadixSlider.Track className="rounded-pill relative h-2 w-full grow bg-surface-sunken">
        <RadixSlider.Range className="rounded-pill absolute h-full bg-primary" />
      </RadixSlider.Track>

      {/*
        El pulgar es más grande que la barra a propósito: es lo que se agarra, y
        su tamaño es el objetivo de toque real. La barra solo lo enseña.
      */}
      <RadixSlider.Thumb className="rounded-pill block size-6 border-4 border-primary bg-surface-raised shadow-card" />
    </RadixSlider.Root>
  );
}

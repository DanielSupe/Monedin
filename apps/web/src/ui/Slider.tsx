import * as RadixSlider from "@radix-ui/react-slider";
import { cx } from "./cx.js";

export interface SliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

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

      <RadixSlider.Thumb className="rounded-pill block size-6 border-4 border-primary bg-surface-raised shadow-card" />
    </RadixSlider.Root>
  );
}

import { messages } from "../lib/messages.js";
import { cx } from "./cx.js";

export interface ProgressBarProps {
  value: number;
  max: number;

  label?: string;
  className?: string;
}

export function ProgressBar({ value, max, label, className }: ProgressBarProps): React.ReactElement {
  const tope = max > 0 ? max : 1;
  const acotado = Math.min(Math.max(value, 0), tope);
  const porcentaje = Math.round((acotado / tope) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={acotado}
      aria-valuemin={0}
      aria-valuemax={tope}
      aria-label={label ?? messages.ui.progressLabel}
      className={cx("h-2 w-full overflow-hidden rounded-pill bg-surface-sunken", className)}
    >

      <div
        className="h-full rounded-pill bg-coin transition-size duration-slow"
        style={{ inlineSize: `${porcentaje}%` }}
      />
    </div>
  );
}

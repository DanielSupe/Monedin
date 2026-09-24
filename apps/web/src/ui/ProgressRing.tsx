import { messages } from "../lib/messages.js";
import { cx } from "./cx.js";

export interface ProgressRingProps {
  done: number;
  total: number;
  className?: string;
}

const RADIO = 46;
const VUELTA = 2 * Math.PI * RADIO;

export function ProgressRing({ done, total, className }: ProgressRingProps): React.ReactElement {
  const seguro = Math.max(total, 1);
  const parte = Math.min(Math.max(done, 0), seguro) / seguro;

  return (
    <div
      role="meter"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${String(done)} ${messages.ui.progressOf} ${String(total)}`}
      className={cx("relative flex items-center justify-center", className)}
    >
      <svg viewBox="0 0 118 118" aria-hidden="true" focusable="false" className="size-full">
        <circle
          cx="59"
          cy="59"
          r={RADIO}
          className="fill-none stroke-surface-raised/30"
          strokeWidth="13"
        />

        <circle
          cx="59"
          cy="59"
          r={RADIO}
          className="fill-none stroke-surface-raised transition-all duration-slow"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${String(VUELTA * parte)} ${String(VUELTA)}`}
          transform="rotate(-90 59 59)"
        />
      </svg>

      <span
        aria-hidden="true"
        className="absolute flex flex-col items-center text-ink-inverted"
      >
        <span className="text-display font-extrabold leading-none">
          {done}/{total}
        </span>
        <span className="text-micro font-bold">{messages.ui.progressDone}</span>
      </span>
    </div>
  );
}

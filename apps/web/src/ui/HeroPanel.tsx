import type { ReactNode } from "react";
import { cx } from "./cx.js";

export type HeroTone = "action" | "saving";

const TONES: Record<HeroTone, string> = {
  action: "from-primary-hover via-primary to-primary-hover",
  saving: "from-brand-line via-brand to-brand-deep",
};

export interface HeroPanelProps {
  tone?: HeroTone;

  mascot?: ReactNode;

  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function HeroPanel({
  tone = "action",
  mascot,
  aside,
  children,
  className,
}: HeroPanelProps): React.ReactElement {
  return (
    <section
      className={cx(
        "rounded-panel relative flex items-center gap-4 overflow-hidden bg-linear-120 p-5 shadow-raised",
        TONES[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="rounded-pill absolute -top-16 right-1/3 size-52 bg-surface-raised/10"
      />
      <span
        aria-hidden="true"
        className="rounded-pill absolute -bottom-20 right-1/4 size-56 bg-surface-raised/8"
      />

      {mascot !== undefined && <span className="relative shrink-0">{mascot}</span>}

      <div className="relative flex min-w-0 flex-1 flex-col gap-1">{children}</div>

      {aside !== undefined && <span className="relative shrink-0">{aside}</span>}
    </section>
  );
}

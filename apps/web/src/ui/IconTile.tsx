import type { ReactNode } from "react";
import { cx } from "./cx.js";

export type IconTileTone = "action" | "saving" | "coin" | "waiting" | "hero";

const TONES: Record<IconTileTone, string> = {
  action: "bg-primary-soft text-primary-hover",
  saving: "bg-done-soft text-done",
  coin: "bg-coin-soft text-coin-ink",
  waiting: "bg-surface-sunken text-ink-muted",

  hero: "bg-surface-raised/20 text-ink-inverted",
};

export interface IconTileProps {
  tone?: IconTileTone;

  children: ReactNode;
  className?: string;
}

export function IconTile({
  tone = "waiting",
  children,
  className,
}: IconTileProps): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "rounded-control tap-target flex shrink-0 items-center justify-center",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

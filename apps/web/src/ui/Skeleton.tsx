import { messages } from "../lib/messages.js";
import { cx } from "./cx.js";

export interface SkeletonProps {
  lines?: number;
  className?: string;
}

export function Skeleton({ lines = 3, className }: SkeletonProps): React.ReactElement {
  return (
    <div
      role="status"
      aria-label={messages.ui.loading}
      className={cx("flex flex-col gap-2", className)}
    >
      {Array.from({ length: lines }, (_, indice) => (
        <div
          key={indice}
          aria-hidden="true"
          className="rounded-control h-4 animate-pulse bg-surface-sunken"
        />
      ))}
    </div>
  );
}

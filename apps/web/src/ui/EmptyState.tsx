import type { ReactNode } from "react";
import { cx } from "./cx.js";

export interface EmptyStateProps {
  glyph?: string;
  title: string;
  description?: string;

  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  glyph,
  title,
  description,
  action,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className={cx("flex flex-col items-center gap-2 px-4 py-10 text-center", className)}>
      {glyph !== undefined && (
        <span aria-hidden="true" className="text-hero">
          {glyph}
        </span>
      )}
      <p className="text-title font-bold text-ink">{title}</p>
      {description !== undefined && <p className="text-body text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}

import type { ReactNode } from "react";
import { messages } from "../lib/messages.js";
import { cx } from "./cx.js";

export interface PaginationProps {
  page: number;
  totalPages: number;

  previous?: ReactNode;
  next?: ReactNode;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  previous,
  next,
  className,
}: PaginationProps): React.ReactElement | null {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label={messages.ui.paginationLabel}
      className={cx("flex flex-wrap items-center justify-center gap-3", className)}
    >
      {previous}

      <span className="text-small text-ink-muted">
        {page} / {totalPages}
      </span>

      {next}
    </nav>
  );
}

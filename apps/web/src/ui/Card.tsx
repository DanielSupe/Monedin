import type { HTMLAttributes } from "react";
import { cx } from "./cx.js";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
}

export function Card({ raised = false, className, ...rest }: CardProps): React.ReactElement {
  return (
    <div
      {...rest}
      className={cx(
        "rounded-card border border-border bg-surface-raised p-4",
        raised ? "shadow-raised" : "shadow-card",
        className,
      )}
    />
  );
}

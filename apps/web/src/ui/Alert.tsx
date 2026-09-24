import type { ReactNode } from "react";
import { cx } from "./cx.js";

export type AlertTone = "info" | "done" | "conflict" | "danger";

const TONES: Record<AlertTone, string> = {
  info: "border-info bg-info-soft text-info",
  done: "border-done bg-done-soft text-done",
  conflict: "border-conflict bg-conflict-soft text-conflict",
  danger: "border-danger bg-danger-soft text-danger",
};

const ROLES: Record<AlertTone, "alert" | "status"> = {
  info: "status",
  done: "status",
  conflict: "alert",
  danger: "alert",
};

export interface AlertProps {
  tone?: AlertTone;

  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: AlertProps): React.ReactElement {
  return (
    <div
      role={ROLES[tone]}

      data-surface="default"
      className={cx("rounded-card text-body border-l-4 p-3", TONES[tone], className)}
    >
      {title !== undefined && <p className="font-bold">{title}</p>}
      <div className="text-ink">{children}</div>
    </div>
  );
}

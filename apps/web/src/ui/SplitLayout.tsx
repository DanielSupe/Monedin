import type { ReactNode } from "react";
import { cx } from "./cx.js";

export interface SplitLayoutProps {
  children: ReactNode;

  aside: ReactNode;
  className?: string;
}

export function SplitLayout({ children, aside, className }: SplitLayoutProps): React.ReactElement {
  return (
    <div className={cx("grid items-start gap-5 lg:grid-cols-5", className)}>
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-3">{children}</div>
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">{aside}</div>
    </div>
  );
}

import type { ReactNode } from "react";
import { cx } from "./cx.js";
import { POSES, type Pose } from "./mascot-poses.js";

export type MascotaSize = "small" | "medium" | "large";

const SIZES: Record<MascotaSize, string> = {
  small: "w-12",
  medium: "w-20",
  large: "w-32",
};

export interface MascotaProps {
  pose: Pose;
  size?: MascotaSize;

  children?: ReactNode;
  className?: string;
}

export function Mascota({
  pose,
  size = "medium",
  children,
  className,
}: MascotaProps): React.ReactElement {
  const ilustracion = (
    <img src={POSES[pose]} alt="" aria-hidden="true" className={cx("h-auto", SIZES[size])} />
  );

  if (children === undefined) {
    return <span className={cx("inline-flex shrink-0", className)}>{ilustracion}</span>;
  }

  return (
    <span className={cx("flex items-end gap-3", className)}>
      {ilustracion}

      <span className="rounded-panel rounded-bl-none bg-surface-raised px-4 py-3 text-ink shadow-card">
        {children}
      </span>
    </span>
  );
}

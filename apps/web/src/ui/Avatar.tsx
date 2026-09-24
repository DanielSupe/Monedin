import { cx } from "./cx.js";
import { avatarDrawing, isAvatarUrl } from "./avatars.js";

export type AvatarSize = "small" | "medium" | "large" | "xlarge";

export type AvatarShape = "circle" | "rounded";

const SHAPES: Record<AvatarShape, string> = {
  circle: "rounded-pill",
  rounded: "rounded-card",
};

const SIZES: Record<AvatarSize, string> = {
  small: "size-8",
  medium: "size-12",
  large: "size-24",
  xlarge: "size-28",
};

export interface AvatarProps {
  value: string | null | undefined;
  size?: AvatarSize;

  shape?: AvatarShape;
  alt?: string;
  className?: string;
}

export function Avatar({
  value,
  size = "medium",
  shape = "circle",
  alt = "",
  className,
}: AvatarProps): React.ReactElement {
  if (isAvatarUrl(value)) {
    return (
      <img
        src={value ?? ""}
        alt={alt}

        className={cx("shrink-0 object-cover", SHAPES[shape], SIZES[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden={alt === "" ? true : undefined}
      aria-label={alt === "" ? undefined : alt}
      role={alt === "" ? undefined : "img"}
      className={cx(
        "inline-flex shrink-0 items-center justify-center bg-surface-sunken leading-none",
        SHAPES[shape],
        SIZES[size],
        className,
      )}
    >
      {avatarDrawing(value)}
    </span>
  );
}

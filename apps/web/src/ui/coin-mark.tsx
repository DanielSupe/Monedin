import { cx } from "./cx.js";

export function CoinMark({
  withRing = false,
  className,
}: {
  withRing?: boolean;
  className?: string;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cx("shrink-0", className)}
    >
      <circle cx="16" cy="16" r="15" className="fill-coin" />

      {withRing && (
        <circle cx="16" cy="16" r="11.5" className="fill-none stroke-on-coin" strokeWidth="1.5" />
      )}

      <path
        d="M11 21V11l5 6 5-6v10"
        className="fill-none stroke-on-coin"
        strokeWidth={withRing ? 2.5 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

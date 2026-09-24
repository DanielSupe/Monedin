import { messages } from "../lib/messages.js";
import { CoinMark } from "./coin-mark.js";
import { cx } from "./cx.js";

export type LogoSize = "small" | "medium" | "large";

const SIZES: Record<LogoSize, { texto: string; marca: string }> = {
  small: { texto: "text-body", marca: "size-6" },
  medium: { texto: "text-title", marca: "size-8" },
  large: { texto: "text-hero", marca: "size-12" },
};

export interface LogoProps {
  size?: LogoSize;

  markOnly?: boolean;
  className?: string;
}

export function Logo({
  size = "medium",
  markOnly = false,
  className,
}: LogoProps): React.ReactElement {
  const medida = SIZES[size];

  return (
    <span

      role="img"
      aria-label={messages.app.title}
      className={cx("inline-flex items-center gap-2 font-extrabold text-ink", medida.texto, className)}
    >

      <CoinMark withRing className={medida.marca} />

      {!markOnly && <span aria-hidden="true">{messages.app.title}</span>}
    </span>
  );
}

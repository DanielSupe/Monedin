import { messages } from "../lib/messages.js";
import { CoinMark } from "./coin-mark.js";
import { cx } from "./cx.js";

const format = new Intl.NumberFormat(messages.app.locale);

const TALLAS = {
  normal: { texto: "text-body", moneda: "size-4" },
  large: { texto: "text-title", moneda: "size-7" },
  hero: { texto: "text-hero", moneda: "size-12" },
} as const;

export interface CoinsProps {
  amount: number;

  size?: "normal" | "large" | "hero";
  className?: string;
}

export function Coins({
  amount,
  size = "normal",
  className,
}: CoinsProps): React.ReactElement {
  const unidad =
    Math.abs(amount) === 1
      ? messages.ui.coinsUnitSingular
      : messages.ui.coinsUnit;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 font-extrabold text-coin-ink tabular-nums",
        TALLAS[size].texto,
        className,
      )}
    >

      <CoinMark className={TALLAS[size].moneda} />
      <span aria-label={`${format.format(amount)} ${unidad}`}>
        {format.format(amount)}
      </span>
    </span>
  );
}

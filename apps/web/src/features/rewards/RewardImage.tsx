import { messages } from "../../lib/messages.js";

export type RewardImageSize = "tile" | "thumb";

const CAJAS: Record<RewardImageSize, string> = {
  tile: "rounded-card mx-auto aspect-square w-full max-w-tile",
  thumb: "rounded-card aspect-square size-24 shrink-0",
};

export function RewardImage({
  image,
  title,
  size = "tile",
}: {
  image: string | null;
  title: string;
  size?: RewardImageSize;
}): React.ReactElement {
  const CAJA = CAJAS[size];
  if (image !== null) {
    return <img src={image} alt={title} className={`${CAJA} object-cover`} />;
  }

  return (
    <div
      className={`${CAJA} flex items-center justify-center bg-surface-sunken`}
      data-testid="reward-image-fallback"
    >
      <span aria-hidden="true" className="text-hero leading-none">
        {messages.rewards.imageFallbackGlyph}
      </span>
    </div>
  );
}

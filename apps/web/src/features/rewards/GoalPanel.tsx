import type { OwnReward } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import { HeroPanel, Mascota, ProgressBar } from "../../ui/index.js";
import { metaMasCercana } from "../children/home-data.js";

export interface GoalPanelProps {
  rewards: OwnReward[];

  balance: number;
}

export function GoalPanel({ rewards, balance }: GoalPanelProps): React.ReactElement | null {
  if (rewards.length === 0) return null;

  const meta = metaMasCercana(rewards);

  if (meta === null) {
    return (
      <HeroPanel tone="saving" mascot={<Mascota pose="celebra" size="medium" />}>
        <p className="text-title font-extrabold text-ink-inverted">
          {messages.rewards.allAffordableTitle}
        </p>
        <p className="text-body text-ink-inverted opacity-90">
          {messages.rewards.allAffordableBody}
        </p>
      </HeroPanel>
    );
  }

  return (
    <HeroPanel tone="saving" mascot={<Mascota pose="elige" size="medium" />}>
      <p className="text-micro font-extrabold uppercase text-ink-inverted opacity-80">
        {messages.rewards.nextRewardTitle}
      </p>
      <p className="text-title font-extrabold text-ink-inverted">{meta.title}</p>

      <p className="text-body font-bold text-ink-inverted opacity-90">
        {contar(meta.coins, messages.ui.coinsUnitSingular, messages.ui.coinsUnit)}
      </p>
      <p className="text-body text-ink-inverted opacity-90">
        {messages.rewards.missingPrefix}{" "}
        {contar(
          Math.max(meta.coins - balance, 0),
          messages.ui.coinsUnitSingular,
          messages.ui.coinsUnit,
        )}
      </p>

      <div className="flex flex-col gap-1">
        <ProgressBar value={balance} max={meta.coins} label={meta.title} />
        <p className="text-small font-bold text-ink-inverted opacity-90 tabular-nums">
          {balance}
          {messages.rewards.goalOf}
          {meta.coins}
        </p>
      </div>
    </HeroPanel>
  );
}

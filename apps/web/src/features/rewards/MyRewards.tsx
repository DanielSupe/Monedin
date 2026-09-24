import type { OwnReward } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import { RewardImage } from "./RewardImage.js";
import {
  Alert,
  Badge,
  Button,
  Card,
  Coins,
  EmptyState,
  ProgressBar,
  Skeleton,
} from "../../ui/index.js";
import { useSession } from "../auth/use-session.js";
import {
  describeRedemptionsError,
  useCreateRedemption,
  useOwnRedemptions,
} from "../redemptions/use-redemptions.js";
import { describeRewardsError, useOwnRewards } from "./use-rewards.js";
import { metaMasCercana } from "../children/home-data.js";

export function MyRewards(): React.ReactElement {
  const { data, isPending, error } = useOwnRewards();
  const pendientes = useOwnRedemptions({ status: "PENDING" });
  const { session } = useSession();
  const saldo =
    session?.actor?.familyRole === "CHILD" ? session.actor.coins : 0;

  if (isPending) {
    return <Skeleton lines={4} />;
  }

  if (error) {
    return <Alert tone="danger">{describeRewardsError(error)}</Alert>;
  }

  const premios = data?.items ?? [];
  const premiosYaPedidos = new Set(
    (pendientes.data?.items ?? []).map((canje) => canje.reward.id),
  );

  const meta = metaMasCercana(premios);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <div className="flex flex-col gap-1">

          <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
            {messages.rewards.myRewardsLead}
          </span>
          <h2 className="text-display font-extrabold">
            {messages.rewards.myRewardsTitle}
          </h2>
        </div>

        {premios.length > 0 && (
          <p className="text-small text-ink-muted">
            {contar(
              premios.length,
              messages.rewards.countOne,
              messages.rewards.countMany,
            )}
          </p>
        )}
      </div>

      {premios.length === 0 ? (
        <EmptyState glyph="🎁" title={messages.rewards.myRewardsEmpty} />
      ) : (
        <ul className="grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-3">
          {premios.map((premio) => (
            <MyRewardRow
              key={premio.id}
              reward={premio}
              balance={saldo}
              yaPedido={premiosYaPedidos.has(premio.id)}
              esMeta={premio.id === meta?.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function MyRewardRow({
  reward,
  balance,
  yaPedido,
  esMeta,
}: {
  reward: OwnReward;
  balance: number;
  yaPedido: boolean;

  esMeta: boolean;
}): React.ReactElement {
  const faltan = Math.max(0, reward.coins - balance);
  const solicitar = useCreateRedemption();
  const pedido = yaPedido || solicitar.isSuccess;

  return (
    <li className="h-full w-full max-w-tile">

      <Card className={esMeta ? "h-full border-2 border-done" : "h-full"}>
        <div className="flex h-full min-w-0 flex-col gap-3">

          <div className="relative">
            <RewardImage image={reward.image} title={reward.title} />

            {(pedido || reward.affordable || esMeta) && (
              <span className="absolute right-2 top-2">
                {pedido ? (
                  <Badge tone="info">{messages.redemptions.alreadyRequested}</Badge>
                ) : reward.affordable ? (
                  <Badge tone="done">{messages.rewards.affordable}</Badge>
                ) : (
                  <Badge tone="done">{messages.rewards.nextRewardTitle}</Badge>
                )}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-lead font-bold">{reward.title}</p>
            {reward.description !== null && (
              <p className="text-small text-ink-muted">{reward.description}</p>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <Coins amount={reward.coins} />

            {reward.affordable ? (
              <>
                {!pedido && (
                  <Button
                    variant="primary"
                    block
                    pending={solicitar.isPending}
                    onClick={() => solicitar.mutate({ rewardId: reward.id })}
                  >
                    {solicitar.isPending
                      ? messages.redemptions.requesting
                      : messages.redemptions.request}
                  </Button>
                )}

                {solicitar.error !== null && (
                  <Alert tone="danger">
                    {describeRedemptionsError(solicitar.error)}
                  </Alert>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <ProgressBar
                  value={balance}
                  max={reward.coins}
                  label={reward.title}
                />
                <p className="text-small text-ink-muted">
                  {messages.rewards.missingPrefix} {faltan}{" "}
                  {messages.rewards.coins.toLowerCase()}
                </p>

                <p className="text-small font-bold text-ink-muted tabular-nums">
                  {balance}
                  {messages.rewards.goalOf}
                  {reward.coins}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </li>
  );
}

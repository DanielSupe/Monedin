import type { OwnReward } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
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

/**
 * El escaparate de un niño: solo lo que se le ofrece a él, a SU precio.
 *
 * Sin selector de hijo: el perfil sale de la sesión, así que esta pantalla no
 * tiene ningún identificador que pudiera apuntar a otro niño.
 *
 * El botón de pedir cruza en el CLIENTE el escaparate con los canjes propios
 * en `PENDING`: es cómo se sabe "ya lo pediste" sin tocar el contrato de
 * `rewards`. Ver la decisión 8 del design de `add-redemptions`.
 */
export function MyRewards(): React.ReactElement {
  const { data, isPending, error } = useOwnRewards();
  const pendientes = useOwnRedemptions({ status: "PENDING" });
  const { session } = useSession();
  const saldo = session?.actor?.familyRole === "CHILD" ? session.actor.coins : 0;

  if (isPending) {
    return <Skeleton lines={4} />;
  }

  if (error) {
    return <Alert tone="danger">{describeRewardsError(error)}</Alert>;
  }

  const premios = data?.items ?? [];
  const premiosYaPedidos = new Set((pendientes.data?.items ?? []).map((canje) => canje.reward.id));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title font-bold">{messages.rewards.myRewardsTitle}</h2>

      {premios.length === 0 ? (
        <EmptyState glyph="🎁" title={messages.rewards.myRewardsEmpty} />
      ) : (
        <ul className="flex list-none flex-col gap-3 p-0">
          {premios.map((premio) => (
            <MyRewardRow
              key={premio.id}
              reward={premio}
              balance={saldo}
              yaPedido={premiosYaPedidos.has(premio.id)}
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
}: {
  reward: OwnReward;
  balance: number;
  yaPedido: boolean;
}): React.ReactElement {
  // `affordable` decide el mensaje; la diferencia es solo para mostrar cuánto
  // falta, y se calcula contra el saldo de la SESIÓN, no contra uno propio del
  // ítem: el contrato no lo lleva a propósito, para no duplicar el saldo en
  // cada fila. Ver la decisión 5 del design de `add-rewards`.
  const faltan = Math.max(0, reward.coins - balance);
  const solicitar = useCreateRedemption();
  const pedido = yaPedido || solicitar.isSuccess;

  return (
    <li>
      <Card>
        <div className="flex min-w-0 flex-col gap-3">
          <RewardImage image={reward.image} title={reward.title} />

          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-body font-bold">{reward.title}</p>
              {reward.description !== null && (
                <p className="text-small text-ink-muted">{reward.description}</p>
              )}
            </div>
            {/* «Ya lo pediste» es un ESTADO, no un párrafo al final: lo que se
                ve y lo que se puede hacer van juntos. */}
            {pedido && <Badge tone="info">{messages.redemptions.alreadyRequested}</Badge>}
          </div>

          <Coins amount={reward.coins} />

          {reward.affordable ? (
            <>
              <p className="text-small font-semibold text-success">{messages.rewards.affordable}</p>

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
                <Alert tone="danger">{describeRedemptionsError(solicitar.error)}</Alert>
              )}
            </>
          ) : (
            /*
              Aquí se ESTRENA `ProgressBar`, que es lo que su propia cabecera
              dice desde `add-design-system` y hasta hoy solo hacía el catálogo.
              Es la mitad del ciclo que el producto enseña: ver cuánto falta
              para una meta es lo que convierte un saldo en una decisión de
              ahorro.

              La cifra se queda junto a la barra. La barra dice «estás por
              aquí» y el número dice cuánto exactamente; quitarlo sería cambiar
              precisión por gráfico.
            */
            <div className="flex flex-col gap-1">
              <ProgressBar value={balance} max={reward.coins} label={reward.title} />
              <p className="text-small text-ink-muted">
                {messages.rewards.missingPrefix} {faltan} {messages.rewards.coins.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </Card>
    </li>
  );
}

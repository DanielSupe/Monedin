import type { OwnReward } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { useSession } from "../auth/use-session.js";
import { describeRewardsError, useOwnRewards } from "./use-rewards.js";

/**
 * El escaparate de un niño: solo lo que se le ofrece a él, a SU precio.
 *
 * Sin selector de hijo: el perfil sale de la sesión, así que esta pantalla no
 * tiene ningún identificador que pudiera apuntar a otro niño.
 */
export function MyRewards({ onDone }: { onDone: () => void }): React.ReactElement {
  const { data, isPending, error } = useOwnRewards();
  const { session } = useSession();
  const saldo = session?.actor?.familyRole === "CHILD" ? session.actor.coins : 0;

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  if (error) {
    return (
      <p role="alert" style={{ color: "#b00020" }}>
        {describeRewardsError(error)}
      </p>
    );
  }

  const premios = data?.items ?? [];

  return (
    <section>
      <h2>{messages.rewards.myRewardsTitle}</h2>

      {premios.length === 0 ? (
        <p>{messages.rewards.myRewardsEmpty}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}>
          {premios.map((premio) => (
            <MyRewardRow key={premio.id} reward={premio} balance={saldo} />
          ))}
        </ul>
      )}

      <button type="button" onClick={onDone} style={{ marginTop: "1rem" }}>
        {messages.rewards.back}
      </button>
    </section>
  );
}

function MyRewardRow({
  reward,
  balance,
}: {
  reward: OwnReward;
  balance: number;
}): React.ReactElement {
  // `affordable` decide el mensaje; la diferencia es solo para mostrar cuánto
  // falta, y se calcula contra el saldo de la SESIÓN, no contra uno propio del
  // ítem: el contrato no lo lleva a propósito, para no duplicar el saldo en
  // cada fila. Ver la decisión 5 del design.
  const faltan = Math.max(0, reward.coins - balance);

  return (
    <li style={{ border: "1px solid #ccc", padding: "0.75rem" }}>
      <strong>{reward.title}</strong>
      {reward.description !== null && <p>{reward.description}</p>}

      <p>
        {reward.coins} {messages.rewards.coins.toLowerCase()}
      </p>

      {reward.affordable ? (
        <p>{messages.rewards.affordable}</p>
      ) : (
        <p>
          {messages.rewards.missingPrefix} {faltan} {messages.rewards.coins.toLowerCase()}
        </p>
      )}
    </li>
  );
}

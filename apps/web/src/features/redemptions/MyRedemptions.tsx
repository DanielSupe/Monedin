import { Link } from "@tanstack/react-router";
import type { OwnRedemption } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { describeRedemptionStatus, describeRedemptionsError, useOwnRedemptions } from "./use-redemptions.js";

/**
 * Los canjes de un niño: sus propias solicitudes, con su estado.
 *
 * Sin selector de hijo: el perfil sale de la sesión, así que esta pantalla no
 * tiene ningún identificador que pudiera apuntar a otro niño.
 */
export function MyRedemptions(): React.ReactElement {
  const { data, isPending, error } = useOwnRedemptions();

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  if (error) {
    return (
      <p role="alert" style={{ color: "#b00020" }}>
        {describeRedemptionsError(error)}
      </p>
    );
  }

  const canjes = data?.items ?? [];

  return (
    <section>
      <h2>{messages.redemptions.myRedemptionsTitle}</h2>

      {canjes.length === 0 ? (
        <p>{messages.redemptions.myRedemptionsEmpty}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}>
          {canjes.map((canje) => (
            <MyRedemptionRow key={canje.id} redemption={canje} />
          ))}
        </ul>
      )}

      <Link to="/" style={{ display: "inline-block", marginTop: "1rem" }}>
        {messages.redemptions.back}
      </Link>
    </section>
  );
}

function MyRedemptionRow({ redemption }: { redemption: OwnRedemption }): React.ReactElement {
  return (
    <li style={{ border: "1px solid #ccc", padding: "0.75rem" }}>
      <strong>{redemption.reward.title}</strong>
      <p>
        {redemption.coins} {messages.redemptions.coins.toLowerCase()} ·{" "}
        {describeRedemptionStatus(redemption.status)}
      </p>
    </li>
  );
}

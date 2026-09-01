import type { OwnRedemption } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { Alert, Badge, Card, Coins, EmptyState, Skeleton } from "../../ui/index.js";
import type { BadgeTone } from "../../ui/index.js";
import {
  describeRedemptionStatus,
  describeRedemptionsError,
  useOwnRedemptions,
} from "./use-redemptions.js";

/**
 * Los canjes de un niño: sus propias solicitudes, con su estado.
 *
 * Sin selector de hijo: el perfil sale de la sesión, así que esta pantalla no
 * tiene ningún identificador que pudiera apuntar a otro niño.
 */
export function MyRedemptions(): React.ReactElement {
  const { data, isPending, error } = useOwnRedemptions();

  if (isPending) {
    return <Skeleton lines={3} />;
  }

  if (error) {
    return <Alert tone="danger">{describeRedemptionsError(error)}</Alert>;
  }

  const canjes = data?.items ?? [];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title font-bold">{messages.redemptions.myRedemptionsTitle}</h2>

      {canjes.length === 0 ? (
        <EmptyState glyph="🎟️" title={messages.redemptions.myRedemptionsEmpty} />
      ) : (
        <ul className="flex list-none flex-col gap-3 p-0">
          {canjes.map((canje) => (
            <MyRedemptionRow key={canje.id} redemption={canje} />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Cómo se lee cada estado de un canje.
 *
 * No son tres variantes de lo mismo: aprobar DESCUENTA y rechazar es terminal
 * y no devuelve nada, porque el descuento solo ocurre al aprobar. Esa asimetría
 * es justo lo que un niño tiene que poder ver.
 *
 * Rechazado va en ADVERTENCIA y no en peligro, por la misma razón por la que
 * `Alert` pinta un conflicto en ámbar: nadie hizo nada mal. Que su padre diga
 * que no a un premio no es un error del niño, y el rojo se lo diría.
 */
const TONO: Record<OwnRedemption["status"], BadgeTone> = {
  PENDING: "neutral",
  APPROVED: "success",
  REJECTED: "warning",
};

function MyRedemptionRow({ redemption }: { redemption: OwnRedemption }): React.ReactElement {
  return (
    <li>
      <Card>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-body font-bold">{redemption.reward.title}</p>
            <Coins amount={redemption.coins} />
          </div>
          <Badge tone={TONO[redemption.status]}>
            {describeRedemptionStatus(redemption.status)}
          </Badge>
        </div>
      </Card>
    </li>
  );
}

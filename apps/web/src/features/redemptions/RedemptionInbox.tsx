import type { Redemption, RedemptionStatus } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { alertToneFor } from "../../lib/alert-tone.js";
import { messages } from "../../lib/messages.js";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Coins,
  EmptyState,
  Pagination,
  Skeleton,
  buttonClasses,
  tabLinkClasses,
} from "../../ui/index.js";
import type { BadgeTone } from "../../ui/index.js";
import {
  describeRedemptionStatus,
  describeRedemptionsError,
  useApproveRedemption,
  useRedemptions,
  useRejectRedemption,
} from "./use-redemptions.js";

/**
 * La bandeja del padre: las solicitudes de canje de todos sus hijos.
 *
 * A diferencia de `TaskBatchList`, aquí no hay reparto que agrupar: cada canje
 * es una fila independiente. Todo lo demás —el filtro, la paginación, el tono
 * de un conflicto— es deliberadamente igual: son el mismo trabajo, y
 * `redesign-parent-inbox` las vistió juntas para que no acabaran distintas.
 */
const FILTROS: Array<{ valor: RedemptionStatus | "ALL"; texto: string }> = [
  { valor: "ALL", texto: messages.redemptions.filterAll },
  { valor: "PENDING", texto: messages.redemptions.filterPending },
  { valor: "APPROVED", texto: messages.redemptions.filterApproved },
  { valor: "REJECTED", texto: messages.redemptions.filterRejected },
];

/**
 * Los mismos tonos que ve el niño en sus canjes.
 *
 * Rechazado en ADVERTENCIA y no en peligro, como decidió `redesign-child-shop`:
 * decir que no a un premio no es un error de nadie.
 */
const TONO: Record<RedemptionStatus, BadgeTone> = {
  PENDING: "neutral",
  APPROVED: "success",
  REJECTED: "warning",
};

export function RedemptionInbox({
  page,
  status,
}: {
  page: number;
  status: RedemptionStatus | "ALL";
}): React.ReactElement {
  const { data, isPending, error } = useRedemptions(
    status === "ALL" ? { page } : { page, status },
  );

  const canjes = data?.items ?? [];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title font-bold">{messages.redemptions.title}</h2>

      <nav
        aria-label={messages.redemptions.filterLabel}
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {FILTROS.map((opcion) => (
          // Cambiar de filtro vuelve a la página 1: cambia cuántos hay, y
          // quedarse en la 4 enseñaría una lista vacía sin explicar por qué.
          <Link
            key={opcion.valor}
            to="/redemptions"
            search={{ page: 1, status: opcion.valor }}
            aria-current={status === opcion.valor ? "page" : undefined}
            className={tabLinkClasses(status === opcion.valor)}
          >
            {opcion.texto}
          </Link>
        ))}
      </nav>

      {isPending ? (
        <Skeleton lines={4} />
      ) : error ? (
        <Alert tone={alertToneFor(error)}>{describeRedemptionsError(error)}</Alert>
      ) : canjes.length === 0 ? (
        <EmptyState glyph="🎟️" title={messages.redemptions.empty} />
      ) : (
        <ul className="flex list-none flex-col gap-3 p-0">
          {canjes.map((canje) => (
            <RedemptionRow key={canje.id} redemption={canje} />
          ))}
        </ul>
      )}

      {data !== undefined && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          {...(page > 1
            ? {
                previous: (
                  <Link
                    to="/redemptions"
                    search={{ page: page - 1, status }}
                    className={buttonClasses("secondary")}
                  >
                    {messages.ui.previousPage}
                  </Link>
                ),
              }
            : {})}
          {...(page < data.totalPages
            ? {
                next: (
                  <Link
                    to="/redemptions"
                    search={{ page: page + 1, status }}
                    className={buttonClasses("secondary")}
                  >
                    {messages.ui.nextPage}
                  </Link>
                ),
              }
            : {})}
        />
      )}
    </section>
  );
}

function RedemptionRow({ redemption }: { redemption: Redemption }): React.ReactElement {
  const approve = useApproveRedemption();
  const reject = useRejectRedemption();

  const trabajando = approve.isPending || reject.isPending;
  const fallo = approve.error ?? reject.error;

  return (
    <li>
      <Card>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Avatar value={redemption.child.avatar} size="small" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-body font-semibold">{redemption.child.name}</p>
              <p className="truncate text-small text-ink-muted">{redemption.reward.title}</p>
            </div>
            <Coins amount={redemption.coins} />
            <Badge tone={TONO[redemption.status]}>
              {describeRedemptionStatus(redemption.status)}
            </Badge>
          </div>

          {/* Resolver solo lo que está sin resolver: aprobar DESCUENTA y
              rechazar es terminal, así que un segundo intento acaba en 409. */}
          {redemption.status === "PENDING" && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                disabled={trabajando}
                onClick={() => approve.mutate(redemption.id)}
              >
                {messages.redemptions.approve}
              </Button>
              <Button
                variant="secondary"
                disabled={trabajando}
                onClick={() => reject.mutate(redemption.id)}
              >
                {messages.redemptions.reject}
              </Button>
            </div>
          )}

          {/* Mismo criterio que en la bandeja de tareas: el 409 es advertencia. */}
          {fallo != null && (
            <Alert tone={alertToneFor(fallo)}>{describeRedemptionsError(fallo)}</Alert>
          )}
        </div>
      </Card>
    </li>
  );
}

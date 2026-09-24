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
  IconTile,
  Pagination,
  Skeleton,
  buttonClasses,
  tabLinkClasses,
} from "../../ui/index.js";
import type { BadgeTone } from "../../ui/index.js";
import { fechaLarga } from "../../lib/dates.js";
import {
  describeRedemptionStatus,
  describeRedemptionsError,
  useApproveRedemption,
  useRedemptions,
  useRejectRedemption,
} from "./use-redemptions.js";

const FILTROS: Array<{ valor: RedemptionStatus | "ALL"; texto: string }> = [
  { valor: "ALL", texto: messages.redemptions.filterAll },
  { valor: "PENDING", texto: messages.redemptions.filterPending },
  { valor: "APPROVED", texto: messages.redemptions.filterApproved },
  { valor: "REJECTED", texto: messages.redemptions.filterRejected },
];

const TONO: Record<RedemptionStatus, BadgeTone> = {
  PENDING: "neutral",
  APPROVED: "done",
  REJECTED: "conflict",
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
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.redemptions.inboxLead}
        </span>
        <h2 className="text-display font-extrabold">{messages.redemptions.title}</h2>
      </div>

      <nav
        aria-label={messages.redemptions.filterLabel}
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {FILTROS.map((opcion) => (
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

      {canjes.some((canje) => canje.status === "PENDING") && (
        <p className="text-small flex flex-wrap gap-x-1 text-ink-muted">
          <span>{messages.redemptions.ruleDiscountOnApprove}</span>
          <span>{messages.redemptions.rulePriceFrozen}</span>
          <span>{messages.redemptions.ruleRejectFree}</span>
        </p>
      )}

      {isPending ? (
        <Skeleton lines={4} />
      ) : error ? (
        <Alert tone={alertToneFor(error)}>{describeRedemptionsError(error)}</Alert>
      ) : canjes.length === 0 ? (
        <EmptyState glyph="🎟️" title={messages.redemptions.empty} />
      ) : (
        <Card>
          <ul className="flex list-none flex-col p-0">
            {canjes.map((canje) => (
              <RedemptionRow key={canje.id} redemption={canje} />
            ))}
          </ul>
        </Card>
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
    <li className="flex min-w-0 flex-col gap-2 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Avatar value={redemption.child.avatar} size="small" />

        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-body font-bold">{redemption.child.name}</p>
          <p className="truncate text-small font-bold text-ink-muted">
            {messages.redemptions.requestedLabel} {fechaLarga(redemption.createdAt)}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <IconTile tone="saving">
            <IconoPremio />
          </IconTile>
          <span className="truncate text-body font-bold">{redemption.reward.title}</span>
        </div>

        <Coins amount={redemption.coins} />

        {redemption.status === "PENDING" ? (
          <div className="flex shrink-0 flex-wrap gap-2">

            <Button
              variant="primary"
              aria-label={sobreQue(messages.redemptions.approve, redemption)}
              disabled={trabajando}
              onClick={() => approve.mutate(redemption.id)}
            >
              <IconoVisto />
              {messages.redemptions.approve}
            </Button>

            <Button
              variant="secondary"
              aria-label={sobreQue(messages.redemptions.reject, redemption)}
              disabled={trabajando}
              onClick={() => reject.mutate(redemption.id)}
            >
              <IconoCruz />
              {messages.redemptions.reject}
            </Button>
          </div>
        ) : (
          <Badge tone={TONO[redemption.status]}>
            {describeRedemptionStatus(redemption.status)}
          </Badge>
        )}
      </div>

      {fallo != null && (
        <Alert tone={alertToneFor(fallo)}>{describeRedemptionsError(fallo)}</Alert>
      )}
    </li>
  );
}

function sobreQue(accion: string, redemption: Redemption): string {
  return `${accion}: ${redemption.reward.title}, ${redemption.child.name}`;
}

function IconoPremio(): React.ReactElement {
  return (
    <Glifo grosor="2">
      <path d="M3.5 9.5h17v3h-17z" />
      <path d="M5 12.5v8h14v-8" />
      <path d="M12 9.5v11" />
      <path d="M12 9.5C10.5 6 9 5 7.5 5a2.5 2.5 0 000 4.5z" />
      <path d="M12 9.5C13.5 6 15 5 16.5 5a2.5 2.5 0 010 4.5z" />
    </Glifo>
  );
}

function IconoVisto(): React.ReactElement {
  return (
    <Glifo>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Glifo>
  );
}

function IconoCruz(): React.ReactElement {
  return (
    <Glifo>
      <path d="M7 7l10 10" />
      <path d="M17 7L7 17" />
    </Glifo>
  );
}

function Glifo({
  children,
  grosor = "2.8",
}: {
  children: React.ReactNode;
  grosor?: string;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

import type {
  CoinReason,
  CoinTransaction,
  CoinTransactionsPage,
} from "@monedin/contracts";
import type { ReactNode } from "react";
import { alertToneFor } from "../../lib/alert-tone.js";
import { fechaCorta } from "../../lib/dates.js";
import { messages } from "../../lib/messages.js";
import {
  Alert,
  Card,
  Coins,
  EmptyState,
  IconTile,
  Pagination,
  Skeleton,
} from "../../ui/index.js";
import { describeCoinsError } from "./use-coins.js";

const RAZON: Record<CoinReason, string> = {
  TASK_APPROVED: messages.coins.reasonTaskApproved,
  REDEMPTION_APPROVED: messages.coins.reasonRedemptionApproved,
  MANUAL_ADJUSTMENT: messages.coins.reasonManualAdjustment,
};

export function CoinHistory({
  title,
  note,
  page,
  isPending,
  error,
  previous,
  next,
}: {
  title: string;

  note?: string;
  page: CoinTransactionsPage | undefined;
  isPending: boolean;
  error: unknown;
  previous?: ReactNode;
  next?: ReactNode;
}): React.ReactElement {
  const movimientos = page?.items ?? [];

  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-display font-extrabold">{title}</h2>

      {note !== undefined && (
        <p className="text-small text-ink-muted">{note}</p>
      )}

      {isPending ? (
        <Skeleton lines={4} />
      ) : error != null ? (
        <Alert tone={alertToneFor(error)}>{describeCoinsError(error)}</Alert>
      ) : movimientos.length === 0 ? (
        <EmptyState glyph="🪙" title={messages.coins.empty} />
      ) : (
        <Card>
          <ul className="flex list-none flex-col p-0">
            {movimientos.map((movimiento) => (
              <MovementRow key={movimiento.id} movement={movimiento} />
            ))}
          </ul>
        </Card>
      )}

      {page !== undefined && (
        <Pagination
          page={page.page}
          totalPages={page.totalPages}
          {...(previous === undefined ? {} : { previous })}
          {...(next === undefined ? {} : { next })}
        />
      )}
    </section>
  );
}

export function MovementRow({
  movement,
  compact = false,
}: {
  movement: CoinTransaction;

  compact?: boolean;
}): React.ReactElement {
  const acredita = movement.amount > 0;

  return (
    <li className="flex min-w-0 flex-wrap items-center gap-4 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <IconTile tone={acredita ? "coin" : "saving"}>
        <Flecha hacia={acredita ? "arriba" : "abajo"} />
      </IconTile>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">

        <p className="text-lead font-extrabold">
          {acredita ? messages.coins.earned : messages.coins.spent}{" "}
          {Math.abs(movement.amount)}
        </p>
        <p className="text-small font-bold text-ink-muted">
          {RAZON[movement.reason]}
        </p>
      </div>

      {!compact && (
        <span className="shrink-0 text-small font-bold text-ink-muted">
          {fechaCorta(movement.createdAt)}
        </span>
      )}

      <div className="flex shrink-0 flex-col items-end">
        {!compact && (
          <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
            {messages.coins.balanceAfter}
          </span>
        )}
        <Coins amount={movement.balanceAfter} />
      </div>
    </li>
  );
}

function Flecha({ hacia }: { hacia: "arriba" | "abajo" }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {hacia === "arriba" ? (
        <>
          <path d="M12 19V5" />
          <path d="M6 11l6-6 6 6" />
        </>
      ) : (
        <>
          <path d="M12 5v14" />
          <path d="M6 13l6 6 6-6" />
        </>
      )}
    </svg>
  );
}

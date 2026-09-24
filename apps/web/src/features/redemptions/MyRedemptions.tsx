import type { OwnRedemption } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import {
  Alert,
  Badge,
  Card,
  Coins,
  DataTable,
  EmptyState,
  HeroPanel,
  Mascota,
  Skeleton,
  SplitLayout,
} from "../../ui/index.js";
import type { BadgeTone, DataColumn } from "../../ui/index.js";
import { fechaCorta } from "../../lib/dates.js";
import {
  describeRedemptionStatus,
  describeRedemptionsError,
  useOwnRedemptions,
} from "./use-redemptions.js";

const COLUMNAS: DataColumn[] = [
  { key: "premio", header: messages.redemptions.columnReward },

  { key: "monedas", header: messages.redemptions.columnCoins, align: "end" },
  { key: "estado", header: messages.redemptions.columnStatus },
  { key: "cuando", header: messages.redemptions.columnWhen, align: "end" },
];

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
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-display font-extrabold">
          {messages.redemptions.myRedemptionsTitle}
        </h2>

        {canjes.length > 0 && (
          <p className="text-small text-ink-muted">
            {contar(
              data?.total ?? canjes.length,
              messages.redemptions.countOne,
              messages.redemptions.countMany,
            )}
          </p>
        )}
      </div>

      {canjes.length > 0 && (
        <SplitLayout aside={<ResumenPorEstado canjes={canjes} />}>

          <HeroPanel
            tone="saving"
            mascot={<Mascota pose="explica" size="medium" />}
          >
            <p className="text-lead font-extrabold text-ink-inverted">
              {messages.redemptions.myRedemptionsExplainTitle}
            </p>
            <p className="text-body text-ink-inverted opacity-90">
              {messages.redemptions.myRedemptionsExplainBody}
            </p>
          </HeroPanel>
        </SplitLayout>
      )}

      {canjes.length === 0 ? (
        <EmptyState
          glyph="🎟️"
          title={messages.redemptions.myRedemptionsEmpty}
        />
      ) : (
        <DataTable
          caption={messages.redemptions.historyCaption}
          columns={COLUMNAS}
          rows={canjes.map((canje) => ({
            key: canje.id,
            cells: {
              premio: (
                <span className="text-body font-bold">
                  {canje.reward.title}
                </span>
              ),
              monedas: <Coins amount={canje.coins} />,
              estado: (
                <Badge tone={TONO[canje.status]}>

                  <IconoEstado status={canje.status} />
                  {describeRedemptionStatus(canje.status)}
                </Badge>
              ),
              cuando: (
                <span className="text-small text-ink-muted">
                  {fechaCorta(canje.createdAt)}
                </span>
              ),
            },
          }))}
        />
      )}
    </section>
  );
}

function ResumenPorEstado({
  canjes,
}: {
  canjes: OwnRedemption[];
}): React.ReactElement {
  const cuantos = (estado: OwnRedemption["status"]): number =>
    canjes.filter((canje) => canje.status === estado).length;

  const estados = [
    { estado: "PENDING" as const, rotulo: messages.redemptions.summaryPending },
    {
      estado: "APPROVED" as const,
      rotulo: messages.redemptions.summaryApproved,
    },
    {
      estado: "REJECTED" as const,
      rotulo: messages.redemptions.summaryRejected,
    },
  ];

  return (
    <Card>
      <div className="flex flex-col gap-2">
        <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.redemptions.summaryScope}
        </span>

        <ul className="grid list-none grid-cols-3 gap-2 p-0">
          {estados.map(({ estado, rotulo }) => (
            <li
              key={estado}
              className="flex flex-col items-center gap-1 text-center"
            >

              <Badge tone={TONO[estado]}>
                <IconoEstado status={estado} />
                {String(cuantos(estado))}
              </Badge>
              <span className="text-small text-ink-muted">{rotulo}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

const TONO: Record<OwnRedemption["status"], BadgeTone> = {
  PENDING: "neutral",
  APPROVED: "done",
  REJECTED: "conflict",
};

function IconoEstado({
  status,
}: {
  status: OwnRedemption["status"];
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {status === "PENDING" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </>
      )}
      {status === "APPROVED" && <path d="M5 12.5l4.5 4.5L19 7.5" />}
      {status === "REJECTED" && (
        <>
          <path d="M7 7l10 10" />
          <path d="M17 7L7 17" />
        </>
      )}
    </svg>
  );
}

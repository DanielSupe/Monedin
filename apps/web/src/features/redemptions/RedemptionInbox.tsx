import type { Redemption, RedemptionStatus } from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { avatarGlyph } from "../auth/avatars.js";
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
 * A diferencia de `TaskBatchList`, aquí no hay reparto que agrupar: cada
 * canje es una fila independiente.
 */
const FILTROS: Array<{ valor: RedemptionStatus | "ALL"; texto: string }> = [
  { valor: "ALL", texto: messages.redemptions.filterAll },
  { valor: "PENDING", texto: messages.redemptions.filterPending },
  { valor: "APPROVED", texto: messages.redemptions.filterApproved },
  { valor: "REJECTED", texto: messages.redemptions.filterRejected },
];

export function RedemptionInbox(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [filtro, setFiltro] = useState<RedemptionStatus | "ALL">("ALL");

  const { data, isPending, error } = useRedemptions(
    filtro === "ALL" ? { page } : { page, status: filtro },
  );

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
      <h2>{messages.redemptions.title}</h2>

      <nav style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {FILTROS.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            disabled={filtro === opcion.valor}
            onClick={() => {
              setFiltro(opcion.valor);
              // Cambiar de filtro cambia cuántas páginas hay: quedarse en la 4
              // enseñaría una lista vacía sin explicar por qué.
              setPage(1);
            }}
          >
            {opcion.texto}
          </button>
        ))}
      </nav>

      {canjes.length === 0 ? (
        <p>{messages.redemptions.empty}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
          {canjes.map((canje) => (
            <RedemptionRow key={canje.id} redemption={canje} />
          ))}
        </ul>
      )}

      {data !== undefined && data.totalPages > 1 && (
        <nav style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", alignItems: "center" }}>
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {messages.redemptions.previousPage}
          </button>
          <span>
            {data.page} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            {messages.redemptions.nextPage}
          </button>
        </nav>
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
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        flexWrap: "wrap",
        border: "1px solid #ccc",
        padding: "0.75rem",
      }}
    >
      <span style={{ fontSize: "1.5rem" }}>{avatarGlyph(redemption.child.avatar)}</span>
      <span style={{ flex: 1 }}>
        {redemption.child.name} · {redemption.reward.title} · {redemption.coins}{" "}
        {messages.redemptions.coins.toLowerCase()} · {describeRedemptionStatus(redemption.status)}
      </span>

      {redemption.status === "PENDING" && (
        <>
          <button type="button" disabled={trabajando} onClick={() => approve.mutate(redemption.id)}>
            {messages.redemptions.approve}
          </button>
          <button type="button" disabled={trabajando} onClick={() => reject.mutate(redemption.id)}>
            {messages.redemptions.reject}
          </button>
        </>
      )}

      {fallo != null && (
        <p role="alert" style={{ color: "#b00020", width: "100%" }}>
          {describeRedemptionsError(fallo)}
        </p>
      )}
    </li>
  );
}

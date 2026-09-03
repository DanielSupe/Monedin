import type { CoinReason, CoinTransaction, CoinTransactionsPage } from "@monedin/contracts";
import type { ReactNode } from "react";
import { alertToneFor } from "../../lib/alert-tone.js";
import { messages } from "../../lib/messages.js";
import { Alert, Badge, Card, Coins, EmptyState, Pagination, Skeleton } from "../../ui/index.js";
import { describeCoinsError } from "./use-coins.js";

/**
 * El historial de movimientos, para quien sea que lo mire.
 *
 * UNA pieza y no dos: lo que cambia entre el niño y el padre es el título y a
 * dónde llevan sus enlaces de paginación, no cómo se lee un movimiento. Si
 * aparecieran dos componentes cuya única diferencia es la audiencia, sería un
 * defecto —es la misma regla que gobierna la doble escala—.
 *
 * Los enlaces de paginación entran como CONTENIDO, igual que en `Pagination`:
 * esta pieza no sabe a qué ruta pertenece.
 */
const RAZON: Record<CoinReason, string> = {
  TASK_APPROVED: messages.coins.reasonTaskApproved,
  REDEMPTION_APPROVED: messages.coins.reasonRedemptionApproved,
  MANUAL_ADJUSTMENT: messages.coins.reasonManualAdjustment,
};

export function CoinHistory({
  title,
  page,
  isPending,
  error,
  previous,
  next,
}: {
  title: string;
  page: CoinTransactionsPage | undefined;
  isPending: boolean;
  error: unknown;
  previous?: ReactNode;
  next?: ReactNode;
}): React.ReactElement {
  const movimientos = page?.items ?? [];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title font-bold">{title}</h2>

      {isPending ? (
        <Skeleton lines={4} />
      ) : error != null ? (
        <Alert tone={alertToneFor(error)}>{describeCoinsError(error)}</Alert>
      ) : movimientos.length === 0 ? (
        <EmptyState glyph="🪙" title={messages.coins.empty} />
      ) : (
        <ul className="flex list-none flex-col gap-3 p-0">
          {movimientos.map((movimiento) => (
            <MovementRow key={movimiento.id} movement={movimiento} />
          ))}
        </ul>
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

function MovementRow({ movement }: { movement: CoinTransaction }): React.ReactElement {
  /*
   * Que sume o reste es la información MÁS importante de la fila, y `-60` frente
   * a `60` la deja colgando de un solo carácter. Se dice con palabra y con tono.
   *
   * Gastar va en NEUTRO y no en peligro: es el niño usando sus monedas en algo
   * que quería, que es justo el ciclo que el producto enseña. Pintarlo de rojo
   * le diría que hizo algo mal.
   */
  const acredita = movement.amount > 0;

  return (
    <li>
      <Card>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <Badge tone={acredita ? "success" : "neutral"}>
              {acredita ? messages.coins.earned : messages.coins.spent}
            </Badge>
            <p className="text-small text-ink-muted">{RAZON[movement.reason]}</p>
          </div>

          <div className="flex flex-col items-end gap-1">
            {/* El importe en valor absoluto: el signo ya lo dice la etiqueta. */}
            <Coins amount={Math.abs(movement.amount)} />
            {/*
              El saldo viene GUARDADO en la fila y no se acumula aquí. La columna
              es redundante desde `add-data-model` con una razón escrita, y sumar
              en el cliente sería además incorrecto en cuanto haya paginación: la
              segunda página no sabe con qué saldo empezó.
            */}
            <p className="text-small text-ink-muted">
              {messages.coins.balanceAfter} {movement.balanceAfter}
            </p>
          </div>
        </div>
      </Card>
    </li>
  );
}

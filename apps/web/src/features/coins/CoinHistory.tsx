import type { CoinReason, CoinTransaction, CoinTransactionsPage } from "@monedin/contracts";
import type { ReactNode } from "react";
import { alertToneFor } from "../../lib/alert-tone.js";
import { messages } from "../../lib/messages.js";
import { Alert, Card, Coins, EmptyState, IconTile, Pagination, Skeleton } from "../../ui/index.js";
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
    <section className="flex flex-col gap-5">
      <h2 className="text-display font-extrabold">{title}</h2>

      {isPending ? (
        <Skeleton lines={4} />
      ) : error != null ? (
        <Alert tone={alertToneFor(error)}>{describeCoinsError(error)}</Alert>
      ) : movimientos.length === 0 ? (
        <EmptyState glyph="🪙" title={messages.coins.empty} />
      ) : (
        /*
          UNA tarjeta con las filas divididas, y no una tarjeta por fila. Un
          movimiento no es una cosa que se mire por separado —no se pulsa, no se
          edita, no se puede ni borrar—: es un renglón de un libro mayor, y lo
          que se hace con él es recorrerlo de arriba abajo. Cada fila en su
          propia tarjeta convierte esa lectura en doce objetos sueltos.

          Es además lo que distingue esta pantalla de las otras tres del niño,
          que ya son una rejilla, una columna ancha y una tabla.
        */
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

function MovementRow({ movement }: { movement: CoinTransaction }): React.ReactElement {
  /*
   * Que sume o reste es la información MÁS importante de la fila, y `-60` frente
   * a `60` la deja colgando de un solo carácter. Se dice con palabra y con tono.
   *
   * Gastar NO va en peligro: es el niño usando sus monedas en algo que quería,
   * que es justo el ciclo que el producto enseña. Pintarlo de rojo le diría que
   * hizo algo mal.
   *
   * Desde `redesign-child-screens` los dos llevan además el color de lo que son:
   * ganar el de la MONEDA, porque es dinero entrando, y gastar el del AHORRO,
   * porque lo que sale se convirtió en un premio. Antes compartían forma y solo
   * cambiaba la palabra, y son lo contrario.
   */
  const acredita = movement.amount > 0;

  return (
    <li className="flex min-w-0 flex-wrap items-center gap-4 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <IconTile tone={acredita ? "coin" : "saving"}>
        <Flecha hacia={acredita ? "arriba" : "abajo"} />
      </IconTile>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/*
          La cantidad va DENTRO de la frase y no en una columna aparte: «Ganó 5»
          se lee de una vez, y separarla obligaría a cruzar la fila para saber
          cuánto fue ese «Ganó».
        */}
        <p className="text-lead font-extrabold">
          {acredita ? messages.coins.earned : messages.coins.spent}{" "}
          {Math.abs(movement.amount)}
        </p>
        <p className="text-small font-bold text-ink-muted">{RAZON[movement.reason]}</p>
      </div>

      {/*
        El saldo viene GUARDADO en la fila y no se acumula aquí. La columna es
        redundante desde `add-data-model` con una razón escrita, y sumar en el
        cliente sería además incorrecto en cuanto haya paginación: la segunda
        página no sabe con qué saldo empezó.
      */}
      <div className="flex shrink-0 flex-col items-end">
        <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.coins.balanceAfter}
        </span>
        <Coins amount={movement.balanceAfter} />
      </div>
    </li>
  );
}

/**
 * Entrar o salir, dibujado. Decorativa: lo que lo dice es «Ganó» o «Gastó».
 *
 * Las dos flechas y no un signo: un `-60` frente a un `60` deja la información
 * más importante de la fila colgando de un solo carácter, y esa es justamente la
 * razón por la que existen esas dos palabras.
 */
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

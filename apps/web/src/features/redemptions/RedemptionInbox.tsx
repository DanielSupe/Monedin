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

      {/*
        LAS TRES REGLAS, DONDE SE DECIDE.

        Solo cuando hay algo que resolver: son las respuestas a lo que un padre
        se pregunta ANTES de pulsar, y sin ninguna solicitud pendiente no hay
        nada que preguntarse. Es el mismo criterio que la nota de los repartos,
        que tampoco sale cuando no explica nada.

        Tres tramos y no una frase: es lo que permite comprobar que están LAS
        TRES. Con un solo texto, perder una regla no se notaría.
      */}
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
        /*
          UNA tarjeta con las filas divididas, y no una tarjeta por canje. Es la
          misma forma que el historial de monedas y por la misma razón: lo que se
          hace aquí es recorrer una lista de renglones iguales, y una tarjeta por
          fila convierte esa lectura en doce objetos sueltos.
        */
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
            {messages.redemptions.requestedLabel} {formatearFecha(redemption.createdAt)}
          </p>
        </div>

        {/*
          El premio, con su tesela. La misma en todas las filas: un canje solo
          trae el identificador y el título de su premio, así que dibujar algo
          distinto por fila exigiría un dato que el contrato no da.
        */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <IconTile tone="saving">
            <IconoPremio />
          </IconTile>
          <span className="truncate text-body font-bold">{redemption.reward.title}</span>
        </div>

        <Coins amount={redemption.coins} />

        {/* Resolver solo lo que está sin resolver: aprobar DESCUENTA y
            rechazar es terminal, así que un segundo intento acaba en 409. */}
        {redemption.status === "PENDING" ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {/*
              Cada acción dice sobre QUÉ actúa: cuatro «Aprobar» seguidos suenan
              idénticos para quien no ve la pantalla, que no tiene el orden para
              distinguirlos. Mismo criterio que la bandeja de tareas.
            */}
            <Button
              variant="primary"
              aria-label={sobreQue(messages.redemptions.approve, redemption)}
              disabled={trabajando}
              onClick={() => approve.mutate(redemption.id)}
            >
              <IconoVisto />
              {messages.redemptions.approve}
            </Button>

            {/*
              Rechazar ACOMPAÑA y no va en peligro: no descuenta nada y no
              destruye nada. Es el mismo argumento por el que el niño lo ve en
              advertencia — decir que no a un premio no es un error de nadie.
            */}
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

      {/* Mismo criterio que en la bandeja de tareas: el 409 es advertencia. */}
      {fallo != null && (
        <Alert tone={alertToneFor(fallo)}>{describeRedemptionsError(fallo)}</Alert>
      )}
    </li>
  );
}

/** Cuándo se pidió. En corto: es contexto, no una cuenta atrás. */
function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/**
 * «Aprobar: Helado, Mateo».
 *
 * Se compone aquí y no en el catálogo porque las tres partes son datos —la
 * acción sí sale del catálogo— y lo que las une son dos signos de puntuación,
 * que no se traducen.
 */
function sobreQue(accion: string, redemption: Redemption): string {
  return `${accion}: ${redemption.reward.title}, ${redemption.child.name}`;
}

/** El regalo de la fila. Decorativo: lo nombra su título, al lado. */
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

/** El visto de aprobar. Decorativo: lo nombra el botón. */
function IconoVisto(): React.ReactElement {
  return (
    <Glifo>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Glifo>
  );
}

/** La cruz de rechazar. Decorativa: lo nombra el botón. */
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

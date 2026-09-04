import type { OwnRedemption } from "@monedin/contracts";
import { messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import { Alert, Badge, Coins, DataTable, EmptyState, Skeleton } from "../../ui/index.js";
import type { BadgeTone, DataColumn } from "../../ui/index.js";
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
 *
 * Es un HISTORIAL, y desde `redesign-child-surfaces` se ve como tal: filas con
 * las mismas columnas en vez de tarjetas independientes. Un historial no se
 * explora, se repasa —cuánto costó cada cosa, cómo acabó cada una—, y para eso
 * recorrer una columna gana a leer cada tarjeta entera.
 *
 * Es además el único de los tres destinos del niño donde NO hay nada que hacer:
 * un canje no se cancela ni se repite. Por eso es el que menos sitio necesita
 * por fila, y el que puede permitirse esta forma.
 *
 * Que sea una tabla de verdad y no una rejilla de cajas es lo que hace que quien
 * no ve la pantalla pueda saltar de celda en celda sabiendo en qué columna está.
 * Ver la decisión 2 del design.
 */

const COLUMNAS: DataColumn[] = [
  { key: "premio", header: messages.redemptions.columnReward },
  // A la derecha: una columna de cantidades se lee comparando, y para eso los
  // dígitos tienen que caer unos sobre otros.
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
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-title font-bold">{messages.redemptions.myRedemptionsTitle}</h2>

        {/*
          La cuenta sale del `total` del listado, y aquí eso SÍ es la cifra:
          `GET /redemptions` pagina por FILA. No vale copiar esto a las tareas
          del padre, que paginan por reparto y cuyo total cuenta repartos.
        */}
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

      {canjes.length === 0 ? (
        <EmptyState glyph="🎟️" title={messages.redemptions.myRedemptionsEmpty} />
      ) : (
        <DataTable
          caption={messages.redemptions.historyCaption}
          columns={COLUMNAS}
          rows={canjes.map((canje) => ({
            key: canje.id,
            cells: {
              premio: canje.reward.title,
              monedas: <Coins amount={canje.coins} />,
              estado: (
                <Badge tone={TONO[canje.status]}>{describeRedemptionStatus(canje.status)}</Badge>
              ),
              cuando: <span className="text-small text-ink-muted">{corta(canje.createdAt)}</span>,
            },
          }))}
        />
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
 *
 * Cambiar de tarjetas a filas NO se lleva esto por delante: es lo que
 * `redesign-child-shop` estableció y sigue valiendo con otra forma.
 */
const TONO: Record<OwnRedemption["status"], BadgeTone> = {
  PENDING: "neutral",
  APPROVED: "success",
  REJECTED: "warning",
};

/**
 * Día y mes, sin año.
 *
 * En un historial que el niño mira cada pocos días, el año no aporta nada y sí
 * ocupa la columna que hace que las cuatro quepan en su escala.
 */
function corta(fecha: string): string {
  return new Date(fecha).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

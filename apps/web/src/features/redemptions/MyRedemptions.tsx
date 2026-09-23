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
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-display font-extrabold">
          {messages.redemptions.myRedemptionsTitle}
        </h2>

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

      {/*
        LA BANDA QUE FALTABA ENTERA, y no solo su forma.

        Esta pantalla era un título y una tabla. Su maqueta abre con Monedín
        explicando lo que la tabla no dice —cuándo se van las monedas— y tres
        contadores por estado para repasar de un vistazo. Las dos cosas existen
        en la maqueta desde el principio y no llegaron a implementarse.
      */}
      {canjes.length > 0 && (
        <SplitLayout aside={<ResumenPorEstado canjes={canjes} />}>
          {/* En VIOLETA, el tono de lo conseguido y lo ahorrado: aquí se habla de
              monedas que salen, no de una acción que hacer. Es el color que la
              maqueta le da a esta banda. */}
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
              /*
                SIN TESELA, y es una reversión medida.

                La maqueta dibuja un regalo delante del título, y con él la tabla
                ocupa 396px en una pantalla de 390: la cuarta columna —«Cuándo»—
                se sale y el título parte en tres renglones. La maqueta está
                dibujada a 1440 y ahí sobra sitio; el requisito dice que las
                cuatro columnas quepan en la escala del NIÑO, que es quien mira
                esto en una tablet o un teléfono.

                Lo que se va es lo que menos cuesta: la tesela era la misma en
                todas las filas —un canje solo trae el identificador y el título
                de su premio, sin imagen—, así que no distinguía nada. Sin ella la
                tabla mide 340 y cabe con holgura.

                Lo cazó abrir la aplicación a 390px, que es exactamente para lo
                que esa tarea existe: jsdom no aplica CSS y ningún test lo veía.
              */
              premio: (
                <span className="text-body font-bold">
                  {canje.reward.title}
                </span>
              ),
              monedas: <Coins amount={canje.coins} />,
              estado: (
                <Badge tone={TONO[canje.status]}>
                  {/*
                    El icono acompaña, no sustituye: el tono y la forma son las
                    dos maneras de leer el estado sin depender del color, y la
                    palabra sigue ahí para quien no ve ninguno de los dos.
                  */}
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

/**
 * CUÁNTOS HAY DE CADA ESTADO, contados donde ya están.
 *
 * NO se le piden al servidor, y por eso cuentan lo de la PÁGINA:
 * `GET /redemptions/mine` pagina por fila, así que su `total` es el número de
 * canjes y no el de cada estado. Un contador que dijera «3 aprobados» sobre un
 * total mayor estaría afirmando algo que no ha contado, así que el rótulo dice de
 * qué página habla.
 *
 * Los tres se dibujan SIEMPRE, incluido el que vale cero. Un estado que
 * desaparece al quedarse vacío convierte el resumen en tres cajas que cambian de
 * sitio, y hay que volver a leer cuál es cuál en cada visita.
 */
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
              {/* El icono y el tono son las dos maneras de leerlo sin color; el
                  rótulo sigue ahí para quien no ve ninguno de los dos. */}
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
  APPROVED: "done",
  REJECTED: "conflict",
};

/*
 * El «día y mes, sin año» que esta pantalla decidía —y su razón, que las cuatro
 * columnas quepan en la escala del niño— vive ahora en `lib/dates`, con las dos
 * formas que el producto usa y con el idioma declarado. Aquí pasaba `undefined`
 * como configuración regional, o sea la del dispositivo.
 */

/**
 * La forma de cada estado, dentro de su insignia.
 *
 * Son tres formas distintas y no tres tintes de una: el reloj espera, el visto
 * cerró bien y la cruz cerró sin dar nada. Quien no distingue el coral del
 * violeta sigue viendo tres dibujos distintos.
 */
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

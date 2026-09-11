import type { Task, TaskStatus } from "@monedin/contracts";
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
  describeTaskStatus,
  describeTasksError,
  useApproveTask,
  useDeleteTask,
  useRejectTask,
  useTaskBatches,
} from "./use-tasks.js";

/**
 * Las tareas del padre, agrupadas por reparto.
 *
 * Filtrar por «por aprobar» es la bandeja de lo que le toca resolver: no hay un
 * endpoint aparte para eso, es el mismo listado con su filtro.
 *
 * Un reparto filtrado por estado se enseña ENTERO, así que aquí pueden aparecer
 * tareas que no casan con el filtro. Es deliberado —el padre quiere ver el
 * reparto completo aunque solo una esté para aprobar— y desde
 * `redesign-parent-inbox` se DICE en pantalla: una decisión de producto que no
 * se explica es indistinguible de un defecto.
 */
const FILTROS: Array<{ valor: TaskStatus | "ALL"; texto: string }> = [
  { valor: "ALL", texto: messages.tasks.filterAll },
  { valor: "PENDING", texto: messages.tasks.filterPending },
  { valor: "COMPLETED", texto: messages.tasks.filterCompleted },
  { valor: "APPROVED", texto: messages.tasks.filterApproved },
];

/** Los mismos tonos que ve el niño en sus tareas: un estado se lee igual en las dos pantallas. */
const TONO: Record<TaskStatus, BadgeTone> = {
  PENDING: "neutral",
  COMPLETED: "info",
  APPROVED: "done",
};

export function TaskBatchList({
  page,
  status,
}: {
  page: number;
  status: TaskStatus | "ALL";
}): React.ReactElement {
  const { data, isPending, error } = useTaskBatches(
    status === "ALL" ? { page } : { page, status },
  );

  const repartos = data?.items ?? [];

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
            {messages.tasks.inboxLead}
          </span>
          <h2 className="text-display font-extrabold">{messages.tasks.title}</h2>
        </div>

        <Link to="/tasks/new" className={buttonClasses("primary")}>
          {messages.tasks.newTask}
        </Link>
      </div>

      {/*
        El filtro es un NAV DE ENLACES y no `Tabs`: vive en la dirección, así que
        cada opción ES una dirección. Convertirlo en botones perdería abrirlo en
        otra pestaña y copiar el enlace de lo que se está mirando, sin ganar
        nada. El aspecto sale de la pieza, igual que `buttonClasses`. Ver la
        decisión 3 del design.
      */}
      <nav aria-label={messages.tasks.filterLabel} className="flex flex-wrap gap-1 border-b border-border">
        {FILTROS.map((opcion) => (
          // Cambiar de filtro vuelve a la página 1: cambia cuántas hay, y
          // quedarse en la 4 enseñaría una lista vacía sin explicar por qué.
          <Link
            key={opcion.valor}
            to="/tasks"
            search={{ page: 1, status: opcion.valor }}
            aria-current={status === opcion.valor ? "page" : undefined}
            className={tabLinkClasses(status === opcion.valor)}
          >
            {opcion.texto}
          </Link>
        ))}
      </nav>

      {/* Sin filtro no hay nada que explicar, y la frase sería ruido. */}
      {status !== "ALL" && (
        <p className="text-small text-ink-muted">{messages.tasks.wholeBatchNote}</p>
      )}

      {isPending ? (
        <Skeleton lines={5} />
      ) : error ? (
        <Alert tone={alertToneFor(error)}>{describeTasksError(error)}</Alert>
      ) : repartos.length === 0 ? (
        <EmptyState glyph="🧹" title={messages.tasks.empty} />
      ) : (
        <ul className="flex list-none flex-col gap-4 p-0">
          {repartos.map((reparto) => (
            <li key={reparto.batchId}>
              <Card>
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile tone="action">
                      <IconoReparto />
                    </IconTile>

                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="text-lead font-extrabold">{reparto.title}</p>
                      {reparto.description !== null && (
                        <p className="text-small text-ink-muted">{reparto.description}</p>
                      )}
                      <p className="text-small font-bold text-ink-muted">
                        {messages.tasks.handedOutLabel} {formatearFecha(reparto.createdAt)}
                        {reparto.dueDate !== null &&
                          ` · ${messages.tasks.dueLabel} ${formatearFecha(reparto.dueDate)}`}
                      </p>
                    </div>

                    {/*
                      LO QUE VALE VA EN LA CABECERA DEL REPARTO Y NO EN CADA FILA.

                      Un reparto puede dar distinto a cada hijo, así que solo se
                      enseña aquí cuando todos cobran lo MISMO — que es el caso
                      normal—. Repetir la misma cifra en cuatro renglones era
                      ruido; cuando no coinciden, cada fila lo dice.
                    */}
                    {valorComun(reparto.tasks) !== null && (
                      <Coins amount={valorComun(reparto.tasks) ?? 0} className="shrink-0" />
                    )}
                  </div>

                  <ul className="flex list-none flex-col gap-0 p-0">
                    {reparto.tasks.map((tarea) => (
                      <TaskRow
                        key={tarea.id}
                        task={tarea}
                        conValorPropio={valorComun(reparto.tasks) === null}
                      />
                    ))}
                  </ul>
                </div>
              </Card>
            </li>
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
                    to="/tasks"
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
                    to="/tasks"
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

/**
 * Lo que vale el reparto, si vale lo mismo para todos.
 *
 * `null` cuando no coinciden: el alta permite «un valor para cada uno», así que
 * una sola cifra en la cabecera sería falsa justo en el caso que el producto
 * ofrece a propósito.
 */
function valorComun(tareas: Task[]): number | null {
  const primera = tareas[0];
  if (primera === undefined) return null;

  return tareas.every((tarea) => tarea.coins === primera.coins) ? primera.coins : null;
}

function TaskRow({
  task,
  conValorPropio,
}: {
  task: Task;
  /** Cuando el reparto NO paga lo mismo a todos, la cifra baja a la fila. */
  conValorPropio: boolean;
}): React.ReactElement {
  const approve = useApproveTask();
  const reject = useRejectTask();
  const remove = useDeleteTask();

  const trabajando = approve.isPending || reject.isPending || remove.isPending;
  const fallo = approve.error ?? reject.error ?? remove.error;

  return (
    <li className="flex min-w-0 flex-col gap-2 border-t border-border py-3 last:pb-0">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Avatar value={task.child.avatar} size="small" />
        <span className="min-w-0 flex-1 truncate text-body font-bold">{task.child.name}</span>
        {conValorPropio && <Coins amount={task.coins} />}
        <Badge tone={TONO[task.status]}>{describeTaskStatus(task.status)}</Badge>
      </div>

      {/* La evidencia va ANTES de los botones: es para decidir con ella, no
          después de haber decidido. Aprobar acredita, y deshacerlo exige un
          movimiento compensatorio. */}
      {task.evidence !== null && (
        <a href={task.evidence} target="_blank" rel="noreferrer" className="self-start">
          <img
            src={task.evidence}
            alt={messages.tasks.evidenceAlt}
            className="rounded-card max-h-32 object-cover"
          />
        </a>
      )}

      {/* Lo que se ve y lo que se puede hacer van juntos: ofrecer una acción que
          la API va a rechazar con 409 es prometer algo que no se cumple. */}
      {task.status === "COMPLETED" && (
        <div className="flex flex-wrap gap-2">
          {/*
            CADA ACCIÓN DICE SOBRE QUÉ ACTÚA.

            Un reparto con cuatro hijos esperando pone cuatro botones «Aprobar»
            seguidos, y de viva voz suenan idénticos: quien no ve la pantalla no
            tiene el orden para distinguirlos. El nombre visible se queda corto
            —repetir la tarea y el hijo en cada botón llenaría la fila— así que
            el nombre COMPLETO va en `aria-label`, que es donde hace falta.
          */}
          <Button
            variant="primary"
            aria-label={sobreQue(messages.tasks.approve, task)}
            disabled={trabajando}
            onClick={() => approve.mutate(task.id)}
          >
            <IconoVisto />
            {messages.tasks.approve}
          </Button>

          {/*
            Rechazar ACOMPAÑA y no va en peligro: devuelve la tarea a pendiente y
            no destruye nada. El rojo le diría al padre que hizo algo grave por
            pedirle a su hijo que la repita.
          */}
          <Button
            variant="secondary"
            aria-label={sobreQue(messages.tasks.reject, task)}
            disabled={trabajando}
            onClick={() => reject.mutate(task.id)}
          >
            <IconoCruz />
            {messages.tasks.reject}
          </Button>
        </div>
      )}

      {task.status === "PENDING" && (
        <div className="flex flex-wrap gap-2">
          {/*
            Borrar SÍ va en peligro, y no contradice lo de arriba: rechazar
            devuelve una tarea a pendiente y esto la hace desaparecer.
          */}
          <Button
            variant="danger"
            aria-label={sobreQue(messages.tasks.remove, task)}
            disabled={trabajando}
            onClick={() => remove.mutate(task.id)}
          >
            {messages.tasks.remove}
          </Button>
        </div>
      )}

      {/*
        El tono lo decide el CÓDIGO del error: un 409 es «alguien se adelantó» y
        va en advertencia, no en rojo. Es la distinción que `Alert` declara desde
        que se escribió y que esta pantalla tiraba.
      */}
      {fallo != null && <Alert tone={alertToneFor(fallo)}>{describeTasksError(fallo)}</Alert>}
    </li>
  );
}

/** La fecha límite se enseña en corto: es informativa, no una cuenta atrás. */
function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/**
 * «Aprobar: Tender la cama, Mateo».
 *
 * Se compone aquí y no en el catálogo porque las tres partes son datos —la
 * acción sí sale del catálogo— y lo que las une son dos signos de puntuación,
 * que no se traducen.
 */
function sobreQue(accion: string, task: Task): string {
  return `${accion}: ${task.title}, ${task.child.name}`;
}

/** El reparto, dibujado. Decorativo: lo nombra su título. */
function IconoReparto(): React.ReactElement {
  return (
    <Glifo>
      <path d="M4 7.5l2.5 2.5L11 5" />
      <path d="M13.5 8h7" />
      <path d="M4 17.5L6.5 20 11 15" />
      <path d="M13.5 18h7" />
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

function Glifo({ children }: { children: React.ReactNode }): React.ReactElement {
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
      {children}
    </svg>
  );
}

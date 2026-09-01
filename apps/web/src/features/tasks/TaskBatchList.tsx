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
  APPROVED: "success",
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
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-title font-bold">{messages.tasks.title}</h2>
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
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-body font-bold">{reparto.title}</p>
                    {reparto.description !== null && (
                      <p className="text-small text-ink-muted">{reparto.description}</p>
                    )}
                    {reparto.dueDate !== null && (
                      <p className="text-small text-ink-muted">
                        {messages.tasks.dueLabel} {formatearFecha(reparto.dueDate)}
                      </p>
                    )}
                  </div>

                  <ul className="flex list-none flex-col gap-3 p-0">
                    {reparto.tasks.map((tarea) => (
                      <TaskRow key={tarea.id} task={tarea} />
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

function TaskRow({ task }: { task: Task }): React.ReactElement {
  const approve = useApproveTask();
  const reject = useRejectTask();
  const remove = useDeleteTask();

  const trabajando = approve.isPending || reject.isPending || remove.isPending;
  const fallo = approve.error ?? reject.error ?? remove.error;

  return (
    <li className="flex min-w-0 flex-col gap-2 border-t border-border pt-3 first:border-0 first:pt-0">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Avatar value={task.child.avatar} size="small" />
        <span className="min-w-0 flex-1 truncate text-body font-semibold">{task.child.name}</span>
        <Coins amount={task.coins} />
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
          <Button variant="primary" disabled={trabajando} onClick={() => approve.mutate(task.id)}>
            {messages.tasks.approve}
          </Button>
          <Button variant="secondary" disabled={trabajando} onClick={() => reject.mutate(task.id)}>
            {messages.tasks.reject}
          </Button>
        </div>
      )}

      {task.status === "PENDING" && (
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" disabled={trabajando} onClick={() => remove.mutate(task.id)}>
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

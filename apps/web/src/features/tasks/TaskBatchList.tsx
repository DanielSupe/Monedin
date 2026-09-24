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
import { fechaLarga } from "../../lib/dates.js";
import {
  describeTaskStatus,
  describeTasksError,
  useApproveTask,
  useDeleteTask,
  useRejectTask,
  useTaskBatches,
} from "./use-tasks.js";

const FILTROS: Array<{ valor: TaskStatus | "ALL"; texto: string }> = [
  { valor: "ALL", texto: messages.tasks.filterAll },
  { valor: "PENDING", texto: messages.tasks.filterPending },
  { valor: "COMPLETED", texto: messages.tasks.filterCompleted },
  { valor: "APPROVED", texto: messages.tasks.filterApproved },
];

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

      <nav aria-label={messages.tasks.filterLabel} className="flex flex-wrap gap-1 border-b border-border">
        {FILTROS.map((opcion) => (
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
                        {messages.tasks.handedOutLabel} {fechaLarga(reparto.createdAt)}
                        {reparto.dueDate !== null &&
                          ` · ${messages.tasks.dueLabel} ${fechaLarga(reparto.dueDate)}`}
                      </p>
                    </div>

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

        {task.status === "COMPLETED" && (
          <span className="flex shrink-0 flex-wrap gap-2">

            <Button
              variant="primary"
              aria-label={sobreQue(messages.tasks.approve, task)}
              disabled={trabajando}
              onClick={() => approve.mutate(task.id)}
            >
              <IconoVisto />
              {messages.tasks.approve}
            </Button>

            <Button
              variant="secondary"
              aria-label={sobreQue(messages.tasks.reject, task)}
              disabled={trabajando}
              onClick={() => reject.mutate(task.id)}
            >
              <IconoCruz />
              {messages.tasks.reject}
            </Button>
          </span>
        )}

        {task.status === "PENDING" && (
          <span className="flex shrink-0 flex-wrap gap-2">

            <Button
              variant="danger"
              aria-label={sobreQue(messages.tasks.remove, task)}
              disabled={trabajando}
              onClick={() => remove.mutate(task.id)}
            >
              {messages.tasks.remove}
            </Button>
          </span>
        )}
      </div>

      {task.evidence !== null && (
        <a href={task.evidence} target="_blank" rel="noreferrer" className="self-start">
          <img
            src={task.evidence}
            alt={messages.tasks.evidenceAlt}
            className="rounded-card max-h-32 object-cover"
          />
        </a>
      )}

      {fallo != null && <Alert tone={alertToneFor(fallo)}>{describeTasksError(fallo)}</Alert>}
    </li>
  );
}

function sobreQue(accion: string, task: Task): string {
  return `${accion}: ${task.title}, ${task.child.name}`;
}

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

function IconoVisto(): React.ReactElement {
  return (
    <Glifo>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Glifo>
  );
}

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

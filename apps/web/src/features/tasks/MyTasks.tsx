import { PHOTO_MAX_DIMENSION, type OwnTask } from "@monedin/contracts";
import { useState } from "react";
import * as api from "../../api/tasks.js";
import { messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import {
  Alert,
  Badge,
  Button,
  Card,
  Coins,
  EmptyState,
  Skeleton,
} from "../../ui/index.js";
import type { BadgeTone } from "../../ui/index.js";
import { ImageUploadField } from "../uploads/ImageUploadField.js";
import { avanceDeTareas, porEtapa, type Etapa } from "../children/home-data.js";
import {
  ProgressRing,
  HeroPanel,
  Mascota,
  IconTile,
  SplitLayout,
} from "../../ui/index.js";
import { fechaLarga } from "../../lib/dates.js";
import {
  describeTasksError,
  useCompleteTask,
  useOwnTasks,
} from "./use-tasks.js";

export function MyTasks(): React.ReactElement {
  const { data, isPending, error } = useOwnTasks();

  if (isPending) {
    return <Skeleton lines={4} />;
  }

  if (error) {
    return <Alert tone="danger">{describeTasksError(error)}</Alert>;
  }

  const tareas = data?.items ?? [];
  const pendientes = tareas.filter(
    (tarea) => tarea.status === "PENDING",
  ).length;
  const grupos = porEtapa(tareas);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-display font-extrabold">
          {messages.tasks.myTasksTitle}
        </h2>

        {tareas.length > 0 && (
          <p className="text-small text-ink-muted">
            {pendientes === 0
              ? messages.tasks.nothingPending
              : contar(
                  pendientes,
                  messages.tasks.pendingCountOne,
                  messages.tasks.pendingCountMany,
                )}
          </p>
        )}
      </div>

      <SplitLayout
        aside={
          <>

            {tareas.length > 0 && (
              <AvanceDelCiclo tareas={tareas} pendientes={pendientes} />
            )}

            <ComoFunciona />
          </>
        }
      >
        {tareas.length === 0 ? (
          <EmptyState glyph="🧹" title={messages.tasks.myTasksEmpty} />
        ) : (
          <div className="flex flex-col gap-6">
            {grupos.map((grupo) => (
              <section key={grupo.etapa} className="flex flex-col gap-3">
                <h3 className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
                  {TITULO_GRUPO[grupo.etapa]} · {grupo.tasks.length}
                </h3>

                <ul className="flex list-none flex-col gap-3 p-0">
                  {grupo.tasks.map((tarea) => (
                    <MyTaskRow key={tarea.id} task={tarea} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </SplitLayout>
    </section>
  );
}

function AvanceDelCiclo({
  tareas,
  pendientes,
}: {
  tareas: OwnTask[];
  pendientes: number;
}): React.ReactElement {
  const avance = avanceDeTareas(tareas);

  return (
    <HeroPanel
      mascot={
        <Mascota pose={pendientes === 0 ? "celebra" : "corre"} size="medium" />
      }
      aside={
        <ProgressRing
          done={avance.done}
          total={avance.total}
          className="size-24"
        />
      }
    >

      <p className="text-lead font-extrabold text-ink-inverted">
        {pendientes === 0
          ? messages.children.homeAllDone
          : messages.children.homeMarkExplains}
      </p>
    </HeroPanel>
  );
}

function ComoFunciona(): React.ReactElement {
  const pasos = [
    `${messages.tasks.howDoLead}${messages.tasks.markDone}${messages.tasks.howDoTail}`,
    messages.tasks.howReview,
    messages.tasks.howApproved,
  ];

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <h3 className="text-title font-extrabold">{messages.tasks.howTitle}</h3>

        <ol className="flex list-none flex-col gap-3 p-0">
          {pasos.map((paso, indice) => (
            <li key={paso} className="flex items-center gap-3">
              <span className="rounded-pill text-body grid size-8 shrink-0 place-items-center bg-primary-soft font-extrabold text-primary-hover">
                {indice + 1}
              </span>
              <span className="text-body text-ink">{paso}</span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

const TITULO_GRUPO: Record<Etapa, string> = {
  PENDING: messages.tasks.groupPending,
  COMPLETED: messages.tasks.groupCompleted,
  APPROVED: messages.tasks.groupApproved,
};

const TONO: Record<OwnTask["status"], BadgeTone> = {
  PENDING: "neutral",
  COMPLETED: "info",
  APPROVED: "done",
};

const ETIQUETA: Record<OwnTask["status"], string> = {
  PENDING: messages.tasks.statusPending,
  COMPLETED: messages.tasks.statusCompleted,
  APPROVED: messages.tasks.statusApproved,
};

function MyTaskRow({ task }: { task: OwnTask }): React.ReactElement {
  const complete = useCompleteTask();

  const [evidencia, setEvidencia] = useState<string | undefined>();

  return (
    <li>
      <Card>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <IconTile tone={TONO_TESELA[task.status]}>
              <IconoEtapa status={task.status} />
            </IconTile>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-lead font-bold">{task.title}</p>
              {task.description !== null && (
                <p className="text-small text-ink-muted">{task.description}</p>
              )}
            </div>
            <Badge tone={TONO[task.status]}>{ETIQUETA[task.status]}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Coins amount={task.coins} />
            {task.dueDate !== null && (
              <span className="text-small text-ink-muted">
                {messages.tasks.dueLabel} {fechaLarga(task.dueDate)}
              </span>
            )}
          </div>

          {task.status === "PENDING" && (
            <div className="flex flex-col gap-2">

              <ImageUploadField
                requestUploadUrl={(contentType) =>
                  api.requestEvidenceUploadUrl(task.id, contentType)
                }
                onUploaded={setEvidencia}

                maxDimension={PHOTO_MAX_DIMENSION}
                label={messages.tasks.addEvidence}
              />
              {evidencia !== undefined && (
                <p className="text-small text-done">
                  {messages.tasks.evidenceReady}
                </p>
              )}

              <Button
                variant="primary"
                block
                pending={complete.isPending}
                onClick={() =>
                  complete.mutate({
                    taskId: task.id,
                    ...(evidencia === undefined
                      ? {}
                      : { evidenceUploadKey: evidencia }),
                  })
                }
              >
                {messages.tasks.markDone}
              </Button>
            </div>
          )}

          {task.evidence !== null && (
            <img
              src={task.evidence}
              alt={messages.tasks.evidenceAlt}
              className="rounded-card max-w-full self-start object-cover"
            />
          )}

          {task.status === "COMPLETED" && (
            <p className="text-small text-ink-muted">
              {messages.tasks.waitingReview}
            </p>
          )}

          {task.status === "APPROVED" && (
            <p className="text-small font-semibold text-done">
              {messages.tasks.earned}
            </p>
          )}

          {complete.error !== null && (
            <Alert tone="danger">{describeTasksError(complete.error)}</Alert>
          )}
        </div>
      </Card>
    </li>
  );
}

const TONO_TESELA: Record<OwnTask["status"], "action" | "waiting" | "saving"> =
  {
    PENDING: "action",
    COMPLETED: "waiting",
    APPROVED: "saving",
  };

function IconoEtapa({
  status,
}: {
  status: OwnTask["status"];
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {status === "PENDING" && (
        <>
          <path d="M4 20l6-6" />
          <path d="M12 12l4-4" />
          <path d="M14.5 4.5l5 5-6 2-1-1z" />
        </>
      )}
      {status === "COMPLETED" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </>
      )}
      {status === "APPROVED" && <path d="M5 12.5l4.5 4.5L19 7.5" />}
    </svg>
  );
}

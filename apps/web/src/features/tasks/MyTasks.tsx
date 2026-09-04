import type { OwnTask } from "@monedin/contracts";
import { useState } from "react";
import * as api from "../../api/tasks.js";
import { messages } from "../../lib/messages.js";
import { contar } from "../../lib/plural.js";
import { Alert, Badge, Button, Card, Coins, EmptyState, Skeleton } from "../../ui/index.js";
import type { BadgeTone } from "../../ui/index.js";
import { ImageUploadField } from "../uploads/ImageUploadField.js";
import { describeTasksError, useCompleteTask, useOwnTasks } from "./use-tasks.js";

/**
 * Las tareas de un niño.
 *
 * Sin repartos y sin hermanos: el reparto es una noción de la gestión del padre
 * y no significa nada aquí. El perfil sale de la sesión, así que esta pantalla
 * no tiene ningún identificador que pudiera apuntar a otro niño.
 */
export function MyTasks(): React.ReactElement {
  const { data, isPending, error } = useOwnTasks();

  if (isPending) {
    return <Skeleton lines={4} />;
  }

  if (error) {
    return <Alert tone="danger">{describeTasksError(error)}</Alert>;
  }

  const tareas = data?.items ?? [];
  const pendientes = tareas.filter((tarea) => tarea.status === "PENDING").length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-title font-bold">{messages.tasks.myTasksTitle}</h2>

        {/*
          Se cuentan las PENDIENTES, no las tareas.

          Una lista con ocho tareas de las que siete están aprobadas no es una
          lista de ocho cosas por hacer, y esta pantalla responde a «¿qué hago
          ahora?». Se cuentan las filas con ese estado y NUNCA el total.
        */}
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

      {tareas.length === 0 ? (
        <EmptyState glyph="🧹" title={messages.tasks.myTasksEmpty} />
      ) : (
        <ul className="flex list-none flex-col gap-3 p-0">
          {tareas.map((tarea) => (
            <MyTaskRow key={tarea.id} task={tarea} />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Cómo se lee cada etapa del ciclo.
 *
 * Los tres estados ya tienen tono en el sistema y no se inventa paleta:
 * pendiente es neutro —está por hacer—, esperando revisión es información —no
 * hay nada que hacer, solo esperar— y aprobada es éxito.
 *
 * Antes las tres se veían igual: un rectángulo con borde gris y un párrafo. La
 * máquina de estados que el producto protege con transiciones condicionales y
 * pruebas de doble tap no se veía por ninguna parte.
 */
const TONO: Record<OwnTask["status"], BadgeTone> = {
  PENDING: "neutral",
  COMPLETED: "info",
  APPROVED: "success",
};

const ETIQUETA: Record<OwnTask["status"], string> = {
  PENDING: messages.tasks.statusPending,
  COMPLETED: messages.tasks.statusCompleted,
  APPROVED: messages.tasks.statusApproved,
};

function MyTaskRow({ task }: { task: OwnTask }): React.ReactElement {
  const complete = useCompleteTask();
  // La foto se sube ANTES de marcar: aquí solo se guarda su clave hasta que el
  // niño pulsa. Si nunca la sube, se marca igual y `evidenceUploadKey` no viaja.
  const [evidencia, setEvidencia] = useState<string | undefined>();

  return (
    <li>
      <Card>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-body font-bold">{task.title}</p>
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
                {messages.tasks.dueLabel} {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/*
            Solo una tarea PENDIENTE ofrece marcarla, que es exactamente lo que
            la API permite: la transición sale de `PENDING` y cualquier otra
            cosa acaba en 409. Lo que se ve y lo que se puede hacer van juntos.
          */}
          {task.status === "PENDING" && (
            <div className="flex flex-col gap-2">
              {/* Opcional a propósito: enseñar el trabajo, no un peaje para
                  declararlo hecho. */}
              <ImageUploadField
                requestUploadUrl={(contentType) =>
                  api.requestEvidenceUploadUrl(task.id, contentType)
                }
                onUploaded={setEvidencia}
                label={messages.tasks.addEvidence}
              />
              {evidencia !== undefined && (
                <p className="text-small text-success">{messages.tasks.evidenceReady}</p>
              )}

              <Button
                variant="primary"
                block
                pending={complete.isPending}
                onClick={() =>
                  complete.mutate({
                    taskId: task.id,
                    ...(evidencia === undefined ? {} : { evidenceUploadKey: evidencia }),
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

          {/* Marcarla no paga: lo que sigue es que su padre la revise. */}
          {task.status === "COMPLETED" && (
            <p className="text-small text-ink-muted">{messages.tasks.waitingReview}</p>
          )}

          {task.status === "APPROVED" && (
            <p className="text-small font-semibold text-success">{messages.tasks.earned}</p>
          )}

          {complete.error !== null && (
            <Alert tone="danger">{describeTasksError(complete.error)}</Alert>
          )}
        </div>
      </Card>
    </li>
  );
}

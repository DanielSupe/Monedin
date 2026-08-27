import type { OwnTask } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import * as api from "../../api/tasks.js";
import { messages } from "../../lib/messages.js";
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
    return <p>{messages.health.loading}</p>;
  }

  if (error) {
    return (
      <p role="alert" style={{ color: "#b00020" }}>
        {describeTasksError(error)}
      </p>
    );
  }

  const tareas = data?.items ?? [];

  return (
    <section>
      <h2>{messages.tasks.myTasksTitle}</h2>

      {tareas.length === 0 ? (
        <p>{messages.tasks.myTasksEmpty}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}>
          {tareas.map((tarea) => (
            <MyTaskRow key={tarea.id} task={tarea} />
          ))}
        </ul>
      )}

      <Link to="/" style={{ display: "inline-block", marginTop: "1rem" }}>
        {messages.tasks.back}
      </Link>
    </section>
  );
}

function MyTaskRow({ task }: { task: OwnTask }): React.ReactElement {
  const complete = useCompleteTask();
  // La foto se sube ANTES de marcar: aquí solo se guarda su clave hasta que el
  // niño pulsa. Si nunca la sube, se marca igual y `evidenceUploadKey` no viaja.
  const [evidencia, setEvidencia] = useState<string | undefined>();

  return (
    <li style={{ border: "1px solid #ccc", padding: "0.75rem" }}>
      <strong>{task.title}</strong>
      {task.description !== null && <p>{task.description}</p>}

      <p>
        {task.coins} {messages.tasks.coins.toLowerCase()}
        {task.dueDate !== null && (
          <span>
            {" · "}
            {messages.tasks.dueLabel} {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </p>

      {task.status === "PENDING" && (
        <>
          {/* Opcional a propósito: enseñar el trabajo, no un peaje para
              declararlo hecho. */}
          <ImageUploadField
            requestUploadUrl={(contentType) => api.requestEvidenceUploadUrl(task.id, contentType)}
            onUploaded={setEvidencia}
            label={messages.tasks.addEvidence}
          />
          {evidencia !== undefined && <p>{messages.tasks.evidenceReady}</p>}

          <button
            type="button"
            disabled={complete.isPending}
            onClick={() =>
              complete.mutate({
                taskId: task.id,
                ...(evidencia === undefined ? {} : { evidenceUploadKey: evidencia }),
              })
            }
          >
            {messages.tasks.markDone}
          </button>
        </>
      )}

      {task.evidence !== null && (
        <p>
          <img
            src={task.evidence}
            alt={messages.tasks.evidenceAlt}
            style={{ maxWidth: "12rem", borderRadius: "0.25rem" }}
          />
        </p>
      )}

      {/* Marcarla no paga: lo que sigue es que su padre la revise. */}
      {task.status === "COMPLETED" && <p>{messages.tasks.waitingReview}</p>}

      {task.status === "APPROVED" && (
        <p>
          {messages.tasks.earned} 🪙 {task.coins}
        </p>
      )}

      {complete.error !== null && (
        <p role="alert" style={{ color: "#b00020" }}>
          {describeTasksError(complete.error)}
        </p>
      )}
    </li>
  );
}

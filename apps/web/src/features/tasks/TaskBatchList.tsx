import type { Task, TaskStatus } from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Avatar } from "../auth/Avatar.js";
import { TaskForm } from "./TaskForm.js";
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
 * tareas que no casan con el filtro. Es deliberado: el padre quiere ver el
 * reparto completo aunque solo una esté para aprobar.
 */
type Vista = { name: "list" } | { name: "new" };

const FILTROS: Array<{ valor: TaskStatus | "ALL"; texto: string }> = [
  { valor: "ALL", texto: messages.tasks.filterAll },
  { valor: "PENDING", texto: messages.tasks.filterPending },
  { valor: "COMPLETED", texto: messages.tasks.filterCompleted },
  { valor: "APPROVED", texto: messages.tasks.filterApproved },
];

export function TaskBatchList(): React.ReactElement {
  const [vista, setVista] = useState<Vista>({ name: "list" });
  const [page, setPage] = useState(1);
  const [filtro, setFiltro] = useState<TaskStatus | "ALL">("ALL");

  const { data, isPending, error } = useTaskBatches(
    filtro === "ALL" ? { page } : { page, status: filtro },
  );

  if (vista.name === "new") {
    return (
      <TaskForm
        onDone={() => setVista({ name: "list" })}
        onCancel={() => setVista({ name: "list" })}
      />
    );
  }

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

  const repartos = data?.items ?? [];

  return (
    <section>
      <h2>{messages.tasks.title}</h2>

      <nav style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {FILTROS.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            disabled={filtro === opcion.valor}
            onClick={() => {
              setFiltro(opcion.valor);
              // Cambiar de filtro cambia cuántas páginas hay: quedarse en la 4
              // enseñaría una lista vacía sin explicar por qué.
              setPage(1);
            }}
          >
            {opcion.texto}
          </button>
        ))}
      </nav>

      {repartos.length === 0 ? (
        <p>{messages.tasks.empty}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "1rem" }}>
          {repartos.map((reparto) => (
            <li key={reparto.batchId} style={{ border: "1px solid #ccc", padding: "0.75rem" }}>
              <strong>{reparto.title}</strong>
              {reparto.dueDate !== null && (
                <span> · {messages.tasks.dueLabel} {formatearFecha(reparto.dueDate)}</span>
              )}
              {reparto.description !== null && <p>{reparto.description}</p>}

              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
                {reparto.tasks.map((tarea) => (
                  <TaskRow key={tarea.id} task={tarea} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {data !== undefined && data.totalPages > 1 && (
        <nav style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", alignItems: "center" }}>
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {messages.tasks.previousPage}
          </button>
          <span>
            {data.page} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            {messages.tasks.nextPage}
          </button>
        </nav>
      )}

      <button type="button" onClick={() => setVista({ name: "new" })} style={{ marginTop: "1rem" }}>
        {messages.tasks.newTask}
      </button>
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
    <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <Avatar value={task.child.avatar} size={24} />
      <span style={{ flex: 1 }}>
        {task.child.name} · {task.coins} {messages.tasks.coins.toLowerCase()} ·{" "}
        {describeTaskStatus(task.status)}
      </span>

      {/* La evidencia va ANTES de los botones: es para decidir con ella, no
          después de haber decidido. */}
      {task.evidence !== null && (
        <a href={task.evidence} target="_blank" rel="noreferrer" style={{ width: "100%" }}>
          <img
            src={task.evidence}
            alt={messages.tasks.evidenceAlt}
            style={{ maxWidth: "8rem", borderRadius: "0.25rem", display: "block" }}
          />
        </a>
      )}

      {task.status === "COMPLETED" && (
        <>
          <button type="button" disabled={trabajando} onClick={() => approve.mutate(task.id)}>
            {messages.tasks.approve}
          </button>
          <button type="button" disabled={trabajando} onClick={() => reject.mutate(task.id)}>
            {messages.tasks.reject}
          </button>
        </>
      )}

      {task.status === "PENDING" && (
        <button type="button" disabled={trabajando} onClick={() => remove.mutate(task.id)}>
          {messages.tasks.remove}
        </button>
      )}

      {fallo != null && (
        <p role="alert" style={{ color: "#b00020", width: "100%" }}>
          {describeTasksError(fallo)}
        </p>
      )}
    </li>
  );
}

/** La fecha límite se enseña en corto: es informativa, no una cuenta atrás. */
function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

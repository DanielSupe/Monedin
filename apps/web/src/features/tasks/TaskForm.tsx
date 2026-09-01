import { TITLE_MAX_LENGTH, type CreateTaskInput, createTaskSchema } from "@monedin/contracts";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Card, EmptyState, Field, Input, buttonClasses } from "../../ui/index.js";
import {
  ChildrenPicker,
  PICKER_MISSING,
  useChildrenPicker,
} from "../children/ChildrenPicker.js";
import { describeTasksError, useCreateTasks } from "./use-tasks.js";

/**
 * Reparto de una tarea entre uno o varios hijos.
 *
 * Las DOS formas del valor —el mismo para todos, o uno por hijo— las resuelve
 * `ChildrenPicker`, compartido con el alta de un premio y con el catálogo. El
 * esquema del contrato valida ANTES de enviar, así que el error sale sin viaje
 * al servidor y con el mismo criterio que aplicará la API.
 *
 * NAVEGA ella misma al cancelar. Hasta `redesign-parent-authoring` recibía un
 * `onCancel`, que es «ciérrame» con otro nombre: empuja la navegación a quien
 * llama y ata la pantalla a su punto de uso. `onSaved` se queda, porque «esto
 * ocurrió» sí es un evento de dominio y quien lo escucha decide a dónde ir.
 */
export function TaskForm({ onSaved }: { onSaved: () => void }): React.ReactElement {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [problema, setProblema] = useState<string | null>(null);

  const navigate = useNavigate();
  const picker = useChildrenPicker({ defaultCoins: "10" });
  const create = useCreateTasks();

  const alListado = (): void =>
    void navigate({ to: "/tasks", search: { page: 1, status: "ALL" } });

  function enviar(evento: React.FormEvent): void {
    // Es un `<form>` de verdad desde `redesign-parent-authoring`: escribir el
    // título y pulsar Enter es lo que hace cualquiera, y antes no hacía nada.
    evento.preventDefault();
    setProblema(null);

    const seleccion = picker.build();

    if (seleccion === null) {
      setProblema(PICKER_MISSING);
      return;
    }

    const entrada: Record<string, unknown> = { title, ...seleccion };

    if (description.trim() !== "") entrada.description = description;
    // Un `<input type="date">` da un día suelto. Se toma como el final de ese
    // día en la zona de quien lo escribe, que es lo que significa «para el 24».
    if (dueDate !== "") entrada.dueDate = new Date(`${dueDate}T23:59:59`).toISOString();

    const validado = createTaskSchema.safeParse(entrada);

    if (!validado.success) {
      setProblema(validado.error.issues[0]?.message ?? messages.tasks.invalidData);
      return;
    }

    create.mutate(validado.data as CreateTaskInput, { onSuccess: onSaved });
  }

  if (!picker.isPending && picker.hijos.length === 0) {
    return (
      <EmptyState
        glyph="🧒"
        title={messages.tasks.noChildren}
        action={
          <Link to="/children" search={{ page: 1 }} className={buttonClasses("primary")}>
            {messages.children.addChild}
          </Link>
        }
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title font-bold">{messages.tasks.newTaskTitle}</h2>

      <Card>
        <form onSubmit={enviar} className="flex max-w-2xl flex-col gap-4">
          <Field label={messages.tasks.taskTitle}>
            <Input
              type="text"
              maxLength={TITLE_MAX_LENGTH}
              value={title}
              onChange={(evento) => setTitle(evento.target.value)}
            />
          </Field>

          <Field label={messages.tasks.description}>
            <textarea
              value={description}
              onChange={(evento) => setDescription(evento.target.value)}
              className="rounded-control text-body min-h-24 w-full border border-border-strong bg-surface-raised px-3 py-2 text-ink"
            />
          </Field>

          <Field label={messages.tasks.dueDate} help={messages.tasks.dueDateHelp}>
            <Input
              type="date"
              value={dueDate}
              onChange={(evento) => setDueDate(evento.target.value)}
              className="w-52"
            />
          </Field>

          <ChildrenPicker
            picker={picker}
            labels={{
              legend: messages.tasks.forWhom,
              sameCoins: messages.tasks.sameCoins,
              coinsPerChild: messages.tasks.coinsPerChild,
              coins: messages.tasks.coins,
            }}
          />

          {problema !== null && <Alert tone="danger">{problema}</Alert>}

          {create.error !== null && (
            <Alert tone="danger">{describeTasksError(create.error)}</Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" pending={create.isPending}>
              {create.isPending ? messages.tasks.working : messages.tasks.create}
            </Button>
            <Button type="button" variant="secondary" onClick={alListado}>
              {messages.tasks.cancel}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

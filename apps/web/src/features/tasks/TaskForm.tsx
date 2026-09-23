import {
  TITLE_MAX_LENGTH,
  type CreateTaskInput,
  createTaskSchema,
} from "@monedin/contracts";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  SplitLayout,
  buttonClasses,
} from "../../ui/index.js";
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
export function TaskForm({
  onSaved,
}: {
  onSaved: () => void;
}): React.ReactElement {
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
    if (dueDate !== "")
      entrada.dueDate = new Date(`${dueDate}T23:59:59`).toISOString();

    const validado = createTaskSchema.safeParse(entrada);

    if (!validado.success) {
      setProblema(
        validado.error.issues[0]?.message ?? messages.tasks.invalidData,
      );
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
          <Link
            to="/children"
            search={{ page: 1 }}
            className={buttonClasses("primary")}
          >
            {messages.children.addChild}
          </Link>
        }
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.tasks.newTaskLead}
        </span>
        <h2 className="text-display font-extrabold">
          {messages.tasks.newTaskTitle}
        </h2>
      </div>

      {/*
        LA BANDA: el formulario a la izquierda y, a la derecha, lo que pasa al
        enviarlo. Es el reparto de su maqueta, y el `aside` sigue yendo DESPUÉS en
        el documento — quien lo recorre con teclado llega primero al formulario.
      */}
      <SplitLayout aside={<ComoFunciona />}>
        <Card>
          <form onSubmit={enviar} className="flex flex-col gap-4">
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

            <Field
              label={messages.tasks.dueDate}
              help={messages.tasks.dueDateHelp}
            >
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
                valueLegend: messages.tasks.valueLegend,
              }}
            />

            {problema !== null && <Alert tone="danger">{problema}</Alert>}

            {create.error !== null && (
              <Alert tone="danger">{describeTasksError(create.error)}</Alert>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                variant="primary"
                pending={create.isPending}
              >
                {create.isPending
                  ? messages.tasks.working
                  : messages.tasks.create}
              </Button>
              <Button type="button" variant="secondary" onClick={alListado}>
                {messages.tasks.cancel}
              </Button>
            </div>
          </form>
        </Card>
      </SplitLayout>
    </section>
  );
}

/**
 * EL CICLO DE UNA TAREA, DICHO DONDE SE REPARTE.
 *
 * Es el mecanismo central del producto y el que más se malinterpreta: que un
 * hijo marque una tarea NO le paga nada, y las monedas salen solo al aprobarla.
 * Un padre que no lo sepa cuenta con que ya cobró — o al revés, sospecha que el
 * saldo no sube cuando debería.
 *
 * Va aquí y no en la ayuda, porque aquí es donde alguien está decidiendo cuánto
 * vale algo. Es la misma razón por la que la bandeja explica su filtro en la
 * pantalla: una decisión de producto que no se explica es indistinguible de un
 * defecto.
 *
 * Y es una LISTA ORDENADA, no tres párrafos: los tres pasos ocurren en ese
 * orden, y el orden es justo lo que hay que entender.
 */
function ComoFunciona(): React.ReactElement {
  const pasos = [
    messages.tasks.handOutEach,
    `${messages.tasks.handOutMarkLead}${messages.tasks.filterCompleted}${messages.tasks.handOutMarkTail}`,
    messages.tasks.handOutApprove,
  ];

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <h3 className="text-lead font-extrabold">
          {messages.tasks.handOutTitle}
        </h3>

        <ol className="flex list-none flex-col gap-3 p-0">
          {pasos.map((paso, indice) => (
            <li key={paso} className="flex items-start gap-3">
              <span className="rounded-pill text-small grid size-6 shrink-0 place-items-center bg-primary-soft font-extrabold text-primary-hover">
                {indice + 1}
              </span>
              <span className="text-small text-ink">{paso}</span>
            </li>
          ))}
        </ol>

        <p className="text-small text-ink-muted">
          {messages.tasks.handOutEditable}
        </p>
      </div>
    </Card>
  );
}

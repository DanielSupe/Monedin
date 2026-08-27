import {
  COINS_MAX,
  COINS_MIN,
  MAX_CHILDREN_PER_FAMILY,
  TITLE_MAX_LENGTH,
  type CreateTaskInput,
  createTaskSchema,
} from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Avatar } from "../../ui/Avatar.js";
import { useChildren } from "../children/use-children.js";
import { describeTasksError, useCreateTasks } from "./use-tasks.js";

/**
 * Reparto de una tarea entre uno o varios hijos.
 *
 * Las DOS formas del valor están aquí, y la que se envía se decide con un
 * selector: el mismo para todos, o uno por hijo. El esquema compartido exige
 * exactamente una, así que el formulario valida con él ANTES de enviar y el
 * error sale sin viaje al servidor, con el mismo criterio que aplicará la API.
 */
export function TaskForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}): React.ReactElement {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [mismoValor, setMismoValor] = useState(true);
  const [coins, setCoins] = useState("10");
  const [porHijo, setPorHijo] = useState<Record<string, string>>({});
  const [problema, setProblema] = useState<string | null>(null);

  // Todos los hijos caben en una página: el tope por familia es el tamaño.
  const { data, isPending } = useChildren(1, MAX_CHILDREN_PER_FAMILY);
  const create = useCreateTasks();

  const hijos = data?.items ?? [];

  function alternar(childId: string): void {
    setElegidos((previos) =>
      previos.includes(childId)
        ? previos.filter((uno) => uno !== childId)
        : [...previos, childId],
    );
  }

  function enviar(): void {
    setProblema(null);

    const entrada: Record<string, unknown> = { title };

    if (description.trim() !== "") entrada.description = description;
    // Un `<input type="date">` da un día suelto. Se toma como el final de ese
    // día en la zona de quien lo escribe, que es lo que significa «para el 24».
    if (dueDate !== "") entrada.dueDate = new Date(`${dueDate}T23:59:59`).toISOString();

    if (mismoValor) {
      entrada.childIds = elegidos;
      entrada.coins = Number(coins);
    } else {
      entrada.assignments = elegidos.map((childId) => ({
        childId,
        coins: Number(porHijo[childId] ?? ""),
      }));
    }

    const validado = createTaskSchema.safeParse(entrada);

    if (!validado.success) {
      setProblema(validado.error.issues[0]?.message ?? messages.tasks.invalidData);
      return;
    }

    create.mutate(validado.data as CreateTaskInput, { onSuccess: onDone });
  }

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  if (hijos.length === 0) {
    return (
      <section>
        <h2>{messages.tasks.newTaskTitle}</h2>
        <p>{messages.tasks.noChildren}</p>
        <button type="button" onClick={onCancel}>
          {messages.tasks.back}
        </button>
      </section>
    );
  }

  return (
    <section>
      <h2>{messages.tasks.newTaskTitle}</h2>

      <label>
        {messages.tasks.taskTitle}
        <input
          type="text"
          maxLength={TITLE_MAX_LENGTH}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <label>
        {messages.tasks.description}
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <label>
        {messages.tasks.dueDate}
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          style={{ display: "block" }}
        />
      </label>
      <small>{messages.tasks.dueDateHelp}</small>

      <fieldset style={{ marginTop: "1rem" }}>
        <legend>{messages.tasks.forWhom}</legend>

        {hijos.map((hijo) => (
          <div key={hijo.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ flex: 1 }}>
              <input
                type="checkbox"
                checked={elegidos.includes(hijo.id)}
                onChange={() => alternar(hijo.id)}
              />
              <Avatar value={hijo.avatar} size="small" /> {hijo.name}
            </label>

            {!mismoValor && elegidos.includes(hijo.id) && (
              <input
                type="number"
                min={COINS_MIN}
                max={COINS_MAX}
                value={porHijo[hijo.id] ?? ""}
                onChange={(event) =>
                  setPorHijo((previos) => ({ ...previos, [hijo.id]: event.target.value }))
                }
                style={{ width: "6rem" }}
                aria-label={`${messages.tasks.coins} · ${hijo.name}`}
              />
            )}
          </div>
        ))}
      </fieldset>

      <div style={{ marginTop: "1rem" }}>
        <label>
          <input type="radio" checked={mismoValor} onChange={() => setMismoValor(true)} />
          {messages.tasks.sameCoins}
        </label>
        <label style={{ marginLeft: "1rem" }}>
          <input type="radio" checked={!mismoValor} onChange={() => setMismoValor(false)} />
          {messages.tasks.coinsPerChild}
        </label>
      </div>

      {mismoValor && (
        <label>
          {messages.tasks.coins}
          <input
            type="number"
            min={COINS_MIN}
            max={COINS_MAX}
            value={coins}
            onChange={(event) => setCoins(event.target.value)}
            style={{ display: "block", width: "8rem" }}
          />
        </label>
      )}

      {problema !== null && (
        <p role="alert" style={{ color: "#b00020" }}>
          {problema}
        </p>
      )}

      {create.error !== null && (
        <p role="alert" style={{ color: "#b00020" }}>
          {describeTasksError(create.error)}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <button type="button" onClick={enviar} disabled={create.isPending}>
          {create.isPending ? messages.tasks.working : messages.tasks.create}
        </button>
        <button type="button" onClick={onCancel}>
          {messages.tasks.cancel}
        </button>
      </div>
    </section>
  );
}

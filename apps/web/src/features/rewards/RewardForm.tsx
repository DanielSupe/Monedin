import {
  COINS_MAX,
  COINS_MIN,
  MAX_CHILDREN_PER_FAMILY,
  TITLE_MAX_LENGTH,
  type CreateRewardInput,
  createRewardSchema,
} from "@monedin/contracts";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { avatarGlyph } from "../auth/avatars.js";
import { useChildren } from "../children/use-children.js";
import { describeRewardsError, useCreateReward } from "./use-rewards.js";

/**
 * Alta de un premio para uno o varios hijos.
 *
 * Mismo patrón que `TaskForm`: las DOS formas del precio están aquí, con un
 * selector que decide cuál se envía, y el esquema compartido valida ANTES de
 * mandar nada al servidor.
 */
export function RewardForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}): React.ReactElement {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [mismoValor, setMismoValor] = useState(true);
  const [coins, setCoins] = useState("100");
  const [porHijo, setPorHijo] = useState<Record<string, string>>({});
  const [problema, setProblema] = useState<string | null>(null);

  // Todos los hijos caben en una página: el tope por familia es el tamaño.
  const { data, isPending } = useChildren(1, MAX_CHILDREN_PER_FAMILY);
  const create = useCreateReward();

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

    if (mismoValor) {
      entrada.childIds = elegidos;
      entrada.coins = Number(coins);
    } else {
      entrada.assignments = elegidos.map((childId) => ({
        childId,
        coins: Number(porHijo[childId] ?? ""),
      }));
    }

    const validado = createRewardSchema.safeParse(entrada);

    if (!validado.success) {
      setProblema(validado.error.issues[0]?.message ?? messages.rewards.invalidData);
      return;
    }

    create.mutate(validado.data as CreateRewardInput, { onSuccess: onDone });
  }

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  if (hijos.length === 0) {
    return (
      <section>
        <h2>{messages.rewards.newRewardTitle}</h2>
        <p>{messages.rewards.noChildren}</p>
        <button type="button" onClick={onCancel}>
          {messages.rewards.back}
        </button>
      </section>
    );
  }

  return (
    <section>
      <h2>{messages.rewards.newRewardTitle}</h2>

      <label>
        {messages.rewards.rewardTitle}
        <input
          type="text"
          maxLength={TITLE_MAX_LENGTH}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <label>
        {messages.rewards.description}
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <fieldset style={{ marginTop: "1rem" }}>
        <legend>{messages.rewards.forWhom}</legend>

        {hijos.map((hijo) => (
          <div key={hijo.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ flex: 1 }}>
              <input
                type="checkbox"
                checked={elegidos.includes(hijo.id)}
                onChange={() => alternar(hijo.id)}
              />
              <span style={{ fontSize: "1.5rem" }}>{avatarGlyph(hijo.avatar)}</span> {hijo.name}
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
                aria-label={`${messages.rewards.coins} · ${hijo.name}`}
              />
            )}
          </div>
        ))}
      </fieldset>

      <div style={{ marginTop: "1rem" }}>
        <label>
          <input type="radio" checked={mismoValor} onChange={() => setMismoValor(true)} />
          {messages.rewards.sameCoins}
        </label>
        <label style={{ marginLeft: "1rem" }}>
          <input type="radio" checked={!mismoValor} onChange={() => setMismoValor(false)} />
          {messages.rewards.coinsPerChild}
        </label>
      </div>

      {mismoValor && (
        <label>
          {messages.rewards.coins}
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
          {describeRewardsError(create.error)}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <button type="button" onClick={enviar} disabled={create.isPending}>
          {create.isPending ? messages.rewards.working : messages.rewards.create}
        </button>
        <button type="button" onClick={onCancel}>
          {messages.rewards.cancel}
        </button>
      </div>
    </section>
  );
}

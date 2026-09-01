import { TITLE_MAX_LENGTH, type CreateRewardInput, createRewardSchema } from "@monedin/contracts";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import { Alert, Button, Card, EmptyState, Field, Input, buttonClasses } from "../../ui/index.js";
import {
  ChildrenPicker,
  PICKER_MISSING,
  useChildrenPicker,
} from "../children/ChildrenPicker.js";
import { describeRewardsError, useCreateReward } from "./use-rewards.js";

/**
 * Alta de un premio para uno o varios hijos.
 *
 * Mismo patrón que `TaskForm`, y desde `redesign-parent-authoring` mismo CÓDIGO
 * en la parte que de verdad era idéntica: `ChildrenPicker`. Lo que no se funde
 * es el resto —esta tiene foto y aquella fecha de vencimiento—, porque fundir
 * dos pantallas legibles en una con banderas no arregla nada.
 *
 * La FOTO no está aquí: su clave de subida lleva dentro el identificador del
 * premio, que no existe mientras se está creando. Se añade después, desde el
 * catálogo. Es la misma deuda declarada que impide subir una foto al crear un
 * perfil de hijo.
 *
 * NAVEGA ella misma al cancelar, como su gemela.
 */
export function RewardForm({ onSaved }: { onSaved: () => void }): React.ReactElement {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problema, setProblema] = useState<string | null>(null);

  const navigate = useNavigate();
  const picker = useChildrenPicker({ defaultCoins: "100" });
  const create = useCreateReward();

  const alCatalogo = (): void =>
    void navigate({ to: "/rewards", search: { page: 1, status: "ACTIVE" } });

  function enviar(evento: React.FormEvent): void {
    evento.preventDefault();
    setProblema(null);

    const seleccion = picker.build();

    if (seleccion === null) {
      setProblema(PICKER_MISSING);
      return;
    }

    const entrada: Record<string, unknown> = { title, ...seleccion };

    if (description.trim() !== "") entrada.description = description;

    const validado = createRewardSchema.safeParse(entrada);

    if (!validado.success) {
      setProblema(validado.error.issues[0]?.message ?? messages.rewards.invalidData);
      return;
    }

    create.mutate(validado.data as CreateRewardInput, { onSuccess: onSaved });
  }

  if (!picker.isPending && picker.hijos.length === 0) {
    return (
      <EmptyState
        glyph="🧒"
        title={messages.rewards.noChildren}
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
      <h2 className="text-title font-bold">{messages.rewards.newRewardTitle}</h2>

      <Card>
        <form onSubmit={enviar} className="flex max-w-2xl flex-col gap-4">
          <Field label={messages.rewards.rewardTitle}>
            <Input
              type="text"
              maxLength={TITLE_MAX_LENGTH}
              value={title}
              onChange={(evento) => setTitle(evento.target.value)}
            />
          </Field>

          <Field label={messages.rewards.description}>
            <textarea
              value={description}
              onChange={(evento) => setDescription(evento.target.value)}
              className="rounded-control text-body min-h-24 w-full border border-border-strong bg-surface-raised px-3 py-2 text-ink"
            />
          </Field>

          <ChildrenPicker
            picker={picker}
            labels={{
              legend: messages.rewards.forWhom,
              sameCoins: messages.rewards.sameCoins,
              coinsPerChild: messages.rewards.coinsPerChild,
              coins: messages.rewards.coins,
            }}
          />

          {problema !== null && <Alert tone="danger">{problema}</Alert>}

          {create.error !== null && (
            <Alert tone="danger">{describeRewardsError(create.error)}</Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" pending={create.isPending}>
              {create.isPending ? messages.rewards.working : messages.rewards.create}
            </Button>
            <Button type="button" variant="secondary" onClick={alCatalogo}>
              {messages.rewards.cancel}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

import {
  PHOTO_MAX_DIMENSION,
  TITLE_MAX_LENGTH,
  type CreateRewardInput,
  createRewardSchema,
} from "@monedin/contracts";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import * as rewardsApi from "../../api/rewards.js";
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
import { ImageUploadField } from "../uploads/ImageUploadField.js";
import { describeRewardsError, useCreateReward } from "./use-rewards.js";

export function RewardForm({
  onSaved,
}: {
  onSaved: () => void;
}): React.ReactElement {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUploadKey, setImageUploadKey] = useState<string | null>(null);
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
    if (imageUploadKey !== null) entrada.imageUploadKey = imageUploadKey;

    const validado = createRewardSchema.safeParse(entrada);

    if (!validado.success) {
      setProblema(
        validado.error.issues[0]?.message ?? messages.rewards.invalidData,
      );
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
          {messages.rewards.newRewardLead}
        </span>
        <h2 className="text-display font-extrabold">
          {messages.rewards.newRewardTitle}
        </h2>
      </div>

      <SplitLayout aside={<ComoFunciona />}>
        <Card>
          <form onSubmit={enviar} className="flex flex-col gap-4">
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

            <ImageUploadField
              label={messages.rewards.optionalImage}

              aspect={1}
              maxDimension={PHOTO_MAX_DIMENSION}
              cropNote={messages.uploads.cropLead}
              requestUploadUrl={rewardsApi.requestPendingRewardImageUploadUrl}
              onUploaded={setImageUploadKey}
            />

            <p className="text-small text-ink-muted">
              {messages.rewards.imageSquare}
            </p>

            {imageUploadKey !== null && (
              <Alert tone="done">{messages.rewards.imageReady}</Alert>
            )}

            <ChildrenPicker
              picker={picker}
              labels={{
                legend: messages.rewards.forWhom,
                sameCoins: messages.rewards.sameCoins,
                coinsPerChild: messages.rewards.coinsPerChild,
                coins: messages.rewards.coins,
                valueLegend: messages.rewards.valueLegend,
              }}
            />

            {problema !== null && <Alert tone="danger">{problema}</Alert>}

            {create.error !== null && (
              <Alert tone="danger">{describeRewardsError(create.error)}</Alert>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                variant="primary"
                pending={create.isPending}
              >
                {create.isPending
                  ? messages.rewards.working
                  : messages.rewards.create}
              </Button>
              <Button type="button" variant="secondary" onClick={alCatalogo}>
                {messages.rewards.cancel}
              </Button>
            </div>
          </form>
        </Card>
      </SplitLayout>
    </section>
  );
}

function ComoFunciona(): React.ReactElement {
  const pasos = [
    messages.rewards.publishShows,
    messages.rewards.publishSaving,
    messages.rewards.publishFrozen,
  ];

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <h3 className="text-lead font-extrabold">
          {messages.rewards.publishTitle}
        </h3>

        <ol className="flex list-none flex-col gap-3 p-0">
          {pasos.map((paso, indice) => (
            <li key={paso} className="flex items-start gap-3">
              <span className="rounded-pill text-small grid size-6 shrink-0 place-items-center bg-brand-soft font-extrabold text-brand">
                {indice + 1}
              </span>
              <span className="text-small text-ink">{paso}</span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

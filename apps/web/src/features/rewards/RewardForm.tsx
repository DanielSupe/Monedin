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
import { Alert, Button, Card, EmptyState, Field, Input, buttonClasses } from "../../ui/index.js";
import {
  ChildrenPicker,
  PICKER_MISSING,
  useChildrenPicker,
} from "../children/ChildrenPicker.js";
import { ImageUploadField } from "../uploads/ImageUploadField.js";
import { describeRewardsError, useCreateReward } from "./use-rewards.js";

/**
 * Alta de un premio para uno o varios hijos.
 *
 * Mismo patrón que `TaskForm`, y desde `redesign-parent-authoring` mismo CÓDIGO
 * en la parte que de verdad era idéntica: `ChildrenPicker`. Lo que no se funde
 * es el resto —esta tiene foto y aquella fecha de vencimiento—, porque fundir
 * dos pantallas legibles en una con banderas no arregla nada.
 *
 * La FOTO sí está aquí desde `polish-profile-and-reward-image`, y es opcional.
 * Antes no podía: su clave llevaba dentro el identificador del premio, que no
 * existe mientras se crea. Ahora la vía del alta pide una clave que cuelga del
 * PADRE, que sí existe, porque publicar ya exige su perfil.
 *
 * La subida ocurre ANTES de publicar, así que quien elija una foto y luego
 * cancele deja un objeto huérfano. Está aceptado por la decisión cerrada de no
 * borrarlos: equivocarse borrando pesa más que guardar de más.
 *
 * Sigue SIN resolver la foto al crear un perfil de HIJO, y no de rebote: aquella
 * alta ocurre sin perfil activo, que es justo lo que aquí no pasa.
 *
 * NAVEGA ella misma al cancelar, como su gemela.
 */
export function RewardForm({ onSaved }: { onSaved: () => void }): React.ReactElement {
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

          {/*
            Los tres estados de la subida —elegir, subiendo, error— los pone
            `ImageUploadField`, que ya existía. Aquí solo se guarda la clave
            hasta que se publica.

            Sin `aspect`: recortar a cuadrado la foto de un premio quitaría justo
            lo que hay que ver, que es el juguete entero.
          */}
          <ImageUploadField
            label={messages.rewards.optionalImage}
            /*
              RECORTA en cuadrado y guarda con detalle de FOTO, no de avatar.
              Las dos cosas por separado: atadas, pedir recorte le habría
              encogido la imagen a 512 px para una tesela que ocupa media
              tablet. Ver la decisión 2 del design de `crop-reward-images`.
            */
            aspect={1}
            maxDimension={PHOTO_MAX_DIMENSION}
            requestUploadUrl={rewardsApi.requestPendingRewardImageUploadUrl}
            onUploaded={setImageUploadKey}
          />

          {imageUploadKey !== null && (
            <Alert tone="success">{messages.rewards.imageReady}</Alert>
          )}

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

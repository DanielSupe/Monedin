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
      <div className="flex flex-col gap-1">
        <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
          {messages.rewards.newRewardLead}
        </span>
        <h2 className="text-display font-extrabold">{messages.rewards.newRewardTitle}</h2>
      </div>

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

            ESTE COMENTARIO DECÍA «sin `aspect`», y debajo hay un `aspect={1}`.
            Era cierto hasta `crop-reward-images`, que lo cambió con su razón
            escrita —las fotos van en rejilla en el escaparate y sin recortar la
            dentean, y el recortador es interactivo, así que quien sube encuadra
            hasta que el juguete cabe—. La frase se quedó afirmando lo contrario
            de la línea siguiente, que es la clase de comentario que manda al
            próximo a «arreglar» algo que está bien.
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
            cropNote={messages.uploads.cropLead}
            requestUploadUrl={rewardsApi.requestPendingRewardImageUploadUrl}
            onUploaded={setImageUploadKey}
          />

          {/*
            POR QUÉ SE RECORTA CUADRADA, dicho donde se sube.

            El recorte es interactivo, así que quien sube ve un marco cuadrado y
            no sabe por qué. La razón está en el escaparate del niño, que es otra
            pantalla: van en rejilla, y sin recortar la dentean. Sin esta línea,
            el marco parece un capricho del subidor.
          */}
          <p className="text-small text-ink-muted">{messages.rewards.imageSquare}</p>

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
            <Button type="submit" variant="primary" pending={create.isPending}>
              {create.isPending ? messages.rewards.working : messages.rewards.create}
            </Button>
            <Button type="button" variant="secondary" onClick={alCatalogo}>
              {messages.rewards.cancel}
            </Button>
          </div>
        </form>
      </Card>

      <ComoFunciona />
    </section>
  );
}

/**
 * EL CICLO DE UN PREMIO, DICHO DONDE SE PUBLICA.
 *
 * Dos cosas que la API hace desde el principio y la interfaz no contaba en
 * ninguna parte. Que un hijo VE lo que todavía no puede pagar, con cuánto le
 * falta — que es lo que convierte un saldo en una decisión de ahorro y es de lo
 * que va el producto. Y que el precio se CONGELA al pedirlo: si se sube después,
 * un canje pendiente mantiene el suyo, y sin saberlo eso parece un descuadre.
 *
 * Gemela de la del reparto de tareas y deliberadamente NO la misma pieza: lo que
 * comparten es la forma —tres pasos y una nota—, no el contenido, y una pieza
 * común con dos juegos de textos sería un contenedor con un nombre que no dice
 * nada. Si aparece una tercera, entonces sí.
 */
function ComoFunciona(): React.ReactElement {
  const pasos = [
    messages.rewards.publishShows,
    messages.rewards.publishSaving,
    messages.rewards.publishFrozen,
  ];

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <h3 className="text-lead font-extrabold">{messages.rewards.publishTitle}</h3>

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

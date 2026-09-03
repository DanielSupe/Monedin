import type { Reward } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import * as rewardsApi from "../../api/rewards.js";
import { alertToneFor } from "../../lib/alert-tone.js";
import { messages } from "../../lib/messages.js";
import { RewardImage } from "./RewardImage.js";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Coins,
  Dialog,
  EmptyState,
  Field,
  Input,
  Pagination,
  Skeleton,
  buttonClasses,
  tabLinkClasses,
} from "../../ui/index.js";
import {
  ChildrenPicker,
  PICKER_MISSING,
  useChildrenPicker,
} from "../children/ChildrenPicker.js";
import { ImageUploadField } from "../uploads/ImageUploadField.js";
import {
  describeRewardsError,
  useReplaceAssignments,
  useRetireReward,
  useRewards,
  useUpdateReward,
} from "./use-rewards.js";

/**
 * El catálogo del padre: sus premios, con las ofertas de cada uno.
 *
 * El precio no se edita junto al título: es la oferta a cada hijo, y tiene su
 * propio editor, que reemplaza el conjunto ENTERO de una vez. Ver el requisito
 * «El precio no vive en el premio» y la decisión 3 del design de `add-rewards`.
 *
 * Se edita EN LÍNEA y no en una ruta propia, decidido en
 * `redesign-parent-authoring`: es un retoque pequeño y frecuente —subir un
 * precio, cambiar una foto— y sacarlo a otra pantalla obliga a ir y volver por
 * cada cambio. Queda anotada la asimetría con los perfiles de hijo, que sí se
 * editan en su propia ruta; la mira `redesign-parent-children`.
 */
const FILTROS: Array<{ valor: "ACTIVE" | "RETIRED"; texto: string }> = [
  { valor: "ACTIVE", texto: messages.rewards.filterActive },
  { valor: "RETIRED", texto: messages.rewards.filterRetired },
];

export function RewardCatalog({
  page,
  status,
}: {
  page: number;
  status: "ACTIVE" | "RETIRED";
}): React.ReactElement {
  const { data, isPending, error } = useRewards({ page, status });

  const premios = data?.items ?? [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-title font-bold">{messages.rewards.title}</h2>
        <Link to="/rewards/new" className={buttonClasses("primary")}>
          {messages.rewards.newReward}
        </Link>
      </div>

      {/* Mismo filtro que las dos bandejas: un nav de ENLACES, porque vive en la
          dirección. Ver la decisión 3 del design de `redesign-parent-inbox`. */}
      <nav
        aria-label={messages.rewards.filterLabel}
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {FILTROS.map((opcion) => (
          // Cambiar de filtro vuelve a la página 1: cambia cuántas hay, y
          // quedarse en la 4 enseñaría una lista vacía sin explicar por qué.
          <Link
            key={opcion.valor}
            to="/rewards"
            search={{ page: 1, status: opcion.valor }}
            className={tabLinkClasses(status === opcion.valor)}
          >
            {opcion.texto}
          </Link>
        ))}
      </nav>

      {isPending ? (
        <Skeleton lines={5} />
      ) : error ? (
        <Alert tone={alertToneFor(error)}>{describeRewardsError(error)}</Alert>
      ) : premios.length === 0 ? (
        <EmptyState glyph="🎁" title={messages.rewards.empty} />
      ) : (
        <ul className="flex list-none flex-col gap-4 p-0">
          {premios.map((premio) => (
            <RewardCard key={premio.id} reward={premio} />
          ))}
        </ul>
      )}

      {data !== undefined && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          {...(page > 1
            ? {
                previous: (
                  <Link
                    to="/rewards"
                    search={{ page: page - 1, status }}
                    className={buttonClasses("secondary")}
                  >
                    {messages.ui.previousPage}
                  </Link>
                ),
              }
            : {})}
          {...(page < data.totalPages
            ? {
                next: (
                  <Link
                    to="/rewards"
                    search={{ page: page + 1, status }}
                    className={buttonClasses("secondary")}
                  >
                    {messages.ui.nextPage}
                  </Link>
                ),
              }
            : {})}
        />
      )}
    </section>
  );
}

function RewardCard({ reward }: { reward: Reward }): React.ReactElement {
  /*
   * Tres estados de REVELACIÓN, no de navegación: ninguno decide qué PANTALLA
   * se enseña, que es lo que la regla prohíbe. Editar en el sitio y confirmar
   * una baja son aperturas, y su gemela en el sistema —`Dialog`— funciona igual.
   */
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [editandoOfertas, setEditandoOfertas] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const [title, setTitle] = useState(reward.title);
  const [description, setDescription] = useState(reward.description ?? "");

  const update = useUpdateReward();
  const retire = useRetireReward();

  function guardarTitulo(evento: React.FormEvent): void {
    evento.preventDefault();
    update.mutate(
      { rewardId: reward.id, input: { title, description: description || null } },
      { onSuccess: () => setEditandoTitulo(false) },
    );
  }

  return (
    <li>
      <Card>
        <div className="flex min-w-0 flex-col gap-3">
          {editandoTitulo ? (
            <form onSubmit={guardarTitulo} className="flex flex-col gap-3">
              <Field label={messages.rewards.rewardTitle}>
                <Input
                  type="text"
                  value={title}
                  onChange={(evento) => setTitle(evento.target.value)}
                />
              </Field>

              <Field label={messages.rewards.description}>
                <textarea
                  value={description}
                  onChange={(evento) => setDescription(evento.target.value)}
                  className="rounded-control text-body min-h-20 w-full border border-border-strong bg-surface-raised px-3 py-2 text-ink"
                />
              </Field>

              {/* La foto se añade AQUÍ y no al publicar: su clave lleva dentro el
                  identificador del premio, que no existe mientras se está creando. */}
              <ImageUploadField
                requestUploadUrl={(contentType) =>
                  rewardsApi.requestRewardImageUploadUrl(reward.id, contentType)
                }
                onUploaded={(key) =>
                  update.mutate({ rewardId: reward.id, input: { imageUploadKey: key } })
                }
                label={messages.rewards.addImage}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="primary" pending={update.isPending}>
                  {messages.rewards.save}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditandoTitulo(false)}
                >
                  {messages.rewards.cancel}
                </Button>
                {reward.image !== null && (
                  <Button
                    type="button"
                    variant="danger"
                    disabled={update.isPending}
                    onClick={() =>
                      update.mutate({ rewardId: reward.id, input: { imageUploadKey: null } })
                    }
                  >
                    {messages.rewards.removeImage}
                  </Button>
                )}
              </div>
            </form>
          ) : (
            <>
              <RewardImage image={reward.image} title={reward.title} />

              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-body font-bold">{reward.title}</p>
                  {reward.description !== null && (
                    <p className="text-small text-ink-muted">{reward.description}</p>
                  )}
                </div>
                {reward.status === "RETIRED" && (
                  <Badge tone="neutral">{messages.rewards.filterRetired}</Badge>
                )}
              </div>
            </>
          )}

          {update.error !== null && (
            <Alert tone={alertToneFor(update.error)}>{describeRewardsError(update.error)}</Alert>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-small font-semibold text-ink-muted">
              {messages.rewards.offeredTo}
            </p>

            {reward.offers.length === 0 ? (
              <p className="text-small text-ink-muted">{messages.rewards.noOffers}</p>
            ) : (
              <ul className="flex list-none flex-col gap-2 p-0">
                {reward.offers.map((offer) => (
                  <li key={offer.child.id} className="flex min-w-0 items-center gap-3">
                    <Avatar value={offer.child.avatar} size="small" />
                    <span className="min-w-0 flex-1 truncate text-body">{offer.child.name}</span>
                    <Coins amount={offer.coins} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {editandoOfertas && (
            <OffersEditor reward={reward} onOpenChange={setEditandoOfertas} />
          )}

          <div className="flex flex-wrap gap-2">
            {!editandoTitulo && (
              <Button type="button" variant="secondary" onClick={() => setEditandoTitulo(true)}>
                {messages.rewards.edit}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditandoOfertas((abierto) => !abierto)}
            >
              {messages.rewards.editOffers}
            </Button>
            {reward.status === "ACTIVE" && (
              <Button type="button" variant="danger" onClick={() => setConfirmando(true)}>
                {messages.rewards.retire}
              </Button>
            )}
          </div>

          {/* Retirar es lógico, pero la interfaz lo dice ANTES y no después. */}
          <Dialog
            open={confirmando}
            onOpenChange={setConfirmando}
            title={messages.rewards.retire}
            description={messages.rewards.retireConfirm}
            footer={
              <>
                <Button type="button" variant="secondary" onClick={() => setConfirmando(false)}>
                  {messages.rewards.cancel}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  pending={retire.isPending}
                  onClick={() =>
                    retire.mutate(reward.id, { onSuccess: () => setConfirmando(false) })
                  }
                >
                  {messages.rewards.retireSubmit}
                </Button>
              </>
            }
          >
            {retire.error !== null && (
              <Alert tone={alertToneFor(retire.error)}>{describeRewardsError(retire.error)}</Alert>
            )}
          </Dialog>
        </div>
      </Card>
    </li>
  );
}

/**
 * Reemplaza el conjunto COMPLETO de ofertas de un premio, en una sola decisión:
 * quién puede pedirlo y a qué precio, todo junto. Ver la decisión 3 del design
 * de `add-rewards`.
 *
 * Usa `ChildrenPicker` **sin selector de modo**: reasignar precios es siempre
 * uno por hijo, y ofrecer aquí «el mismo para todos» sería ofrecer algo que no
 * significa nada.
 *
 * Recibe `onOpenChange` y no `onClose`, y no es cosmética: una prop sin
 * argumentos que significa «ciérrame» empuja la navegación a quien llama, y hay
 * un test que las prohíbe. La forma correcta para una revelación es la que ya
 * usan `Dialog` y `Drawer` — lleva el estado dentro, así que dice lo que pasó y
 * no lo que hay que hacer.
 */
function OffersEditor({
  reward,
  onOpenChange,
}: {
  reward: Reward;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const [problema, setProblema] = useState<string | null>(null);
  const picker = useChildrenPicker({
    mode: "perChild",
    initial: Object.fromEntries(
      reward.offers.map((offer) => [offer.child.id, String(offer.coins)]),
    ),
  });
  const replace = useReplaceAssignments();

  function enviar(evento: React.FormEvent): void {
    evento.preventDefault();
    setProblema(null);

    const seleccion = picker.build();

    if (seleccion === null || !("assignments" in seleccion)) {
      setProblema(PICKER_MISSING);
      return;
    }

    replace.mutate(
      { rewardId: reward.id, input: { assignments: seleccion.assignments } },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 border-t border-border pt-3">
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

      {replace.error !== null && (
        <Alert tone={alertToneFor(replace.error)}>{describeRewardsError(replace.error)}</Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" pending={replace.isPending}>
          {messages.rewards.saveOffers}
        </Button>
        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
          {messages.rewards.cancel}
        </Button>
      </div>
    </form>
  );
}

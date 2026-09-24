import { PHOTO_MAX_DIMENSION, type Reward } from "@monedin/contracts";
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
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-micro font-extrabold uppercase tracking-wide text-ink-muted">
            {messages.rewards.catalogLead}
          </span>
          <h2 className="text-display font-extrabold">{messages.rewards.title}</h2>
        </div>

        <Link to="/rewards/new" className={buttonClasses("primary")}>
          {messages.rewards.newReward}
        </Link>
      </div>

      <nav
        aria-label={messages.rewards.filterLabel}
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {FILTROS.map((opcion) => (
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
        <ul className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
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
      {
        rewardId: reward.id,
        input: { title, description: description || null },
      },
      { onSuccess: () => setEditandoTitulo(false) },
    );
  }

  return (
    <li className="h-full w-full max-w-card">
      <Card className="h-full">
        <div className="flex h-full min-w-0 flex-col gap-3">
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

              <ImageUploadField
                requestUploadUrl={(contentType) =>
                  rewardsApi.requestRewardImageUploadUrl(reward.id, contentType)
                }
                onUploaded={(key) =>
                  update.mutate({
                    rewardId: reward.id,
                    input: { imageUploadKey: key },
                  })
                }
                aspect={1}
                cropNote={messages.uploads.cropLead}
                maxDimension={PHOTO_MAX_DIMENSION}
                label={messages.rewards.addImage}
              />

          <div className="mt-auto flex flex-nowrap gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  pending={update.isPending}
                >
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
                      update.mutate({
                        rewardId: reward.id,
                        input: { imageUploadKey: null },
                      })
                    }
                  >
                    {messages.rewards.removeImage}
                  </Button>
                )}
              </div>
            </form>
          ) : (
            <div className="flex min-w-0 gap-3">
              <RewardImage
                image={reward.image}
                title={reward.title}
                size="thumb"
              />

              <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-lead font-extrabold">{reward.title}</p>
                  {reward.description !== null && (
                    <p className="text-small text-ink-muted">
                      {reward.description}
                    </p>
                  )}
                </div>
                {reward.status === "RETIRED" && (
                  <Badge tone="neutral">{messages.rewards.filterRetired}</Badge>
                )}
              </div>
            </div>
          )}

          {update.error !== null && (
            <Alert tone={alertToneFor(update.error)}>
              {describeRewardsError(update.error)}
            </Alert>
          )}

          {reward.offers.length === 0 ? (
            <p className="text-small text-ink-muted">{messages.rewards.noOffers}</p>
          ) : (
            <ul
              aria-label={messages.rewards.offeredTo}
              className="flex list-none flex-wrap gap-2 p-0"
            >
              {reward.offers.map((offer) => (
                <li
                  key={offer.child.id}
                  className="rounded-pill flex min-w-0 items-center gap-2 bg-surface-sunken py-1 pr-3 pl-1"
                >
                  <Avatar value={offer.child.avatar} size="small" />
                  <span className="text-small min-w-0 truncate font-bold">
                    {offer.child.name}
                  </span>
                  <Coins amount={offer.coins} />
                </li>
              ))}
            </ul>
          )}

          {editandoOfertas && (
            <OffersEditor reward={reward} onOpenChange={setEditandoOfertas} />
          )}

          <div className="flex flex-wrap gap-2">
            {!editandoTitulo && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditandoTitulo(true)}
              >
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
              <Button
                type="button"
                variant="danger"
                onClick={() => setConfirmando(true)}
              >
                {messages.rewards.retire}
              </Button>
            )}
          </div>

          <Dialog
            open={confirmando}
            onOpenChange={setConfirmando}
            title={messages.rewards.retire}
            description={messages.rewards.retireConfirm}
            footer={
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmando(false)}
                >
                  {messages.rewards.cancel}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  pending={retire.isPending}
                  onClick={() =>
                    retire.mutate(reward.id, {
                      onSuccess: () => setConfirmando(false),
                    })
                  }
                >
                  {messages.rewards.retireSubmit}
                </Button>
              </>
            }
          >
            {retire.error !== null && (
              <Alert tone={alertToneFor(retire.error)}>
                {describeRewardsError(retire.error)}
              </Alert>
            )}
          </Dialog>
        </div>
      </Card>
    </li>
  );
}

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
    <form
      onSubmit={enviar}
      className="flex flex-col gap-3 border-t border-border pt-3"
    >
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

      {replace.error !== null && (
        <Alert tone={alertToneFor(replace.error)}>
          {describeRewardsError(replace.error)}
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" pending={replace.isPending}>
          {messages.rewards.saveOffers}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          {messages.rewards.cancel}
        </Button>
      </div>
    </form>
  );
}

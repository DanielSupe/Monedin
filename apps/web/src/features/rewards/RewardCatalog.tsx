import { COINS_MAX, COINS_MIN, MAX_CHILDREN_PER_FAMILY, type Reward } from "@monedin/contracts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { messages } from "../../lib/messages.js";
import * as rewardsApi from "../../api/rewards.js";
import { Avatar } from "../../ui/Avatar.js";
import { ImageUploadField } from "../uploads/ImageUploadField.js";
import { useChildren } from "../children/use-children.js";
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
 * El precio no se edita aquí junto al título: es la oferta a cada hijo, y
 * tiene su propio editor (`OffersEditor`), que reemplaza el conjunto entero
 * de una vez. Ver el requisito «El precio no vive en el premio».
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

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  if (error) {
    return (
      <p role="alert" style={{ color: "#b00020" }}>
        {describeRewardsError(error)}
      </p>
    );
  }

  const premios = data?.items ?? [];

  return (
    <section>
      <h2>{messages.rewards.title}</h2>

      <nav style={{ display: "flex", gap: "0.5rem" }}>
        {FILTROS.map((opcion) => (
          // Cambiar de filtro vuelve a la página 1: cambia cuántas hay, y
          // quedarse en la 4 enseñaría una lista vacía sin explicar por qué.
          <Link
            key={opcion.valor}
            to="/rewards"
            search={{ page: 1, status: opcion.valor }}
            aria-current={status === opcion.valor ? "page" : undefined}
          >
            {opcion.texto}
          </Link>
        ))}
      </nav>

      {premios.length === 0 ? (
        <p>{messages.rewards.empty}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "1rem" }}>
          {premios.map((premio) => (
            <RewardCard key={premio.id} reward={premio} />
          ))}
        </ul>
      )}

      {data !== undefined && data.totalPages > 1 && (
        <nav style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", alignItems: "center" }}>
          {page > 1 && (
            <Link to="/rewards" search={{ page: page - 1, status }}>
              {messages.ui.previousPage}
            </Link>
          )}
          <span>
            {data.page} / {data.totalPages}
          </span>
          {page < data.totalPages && (
            <Link to="/rewards" search={{ page: page + 1, status }}>
              {messages.ui.nextPage}
            </Link>
          )}
        </nav>
      )}

      <p style={{ marginTop: "1rem" }}>
        <Link to="/rewards/new">{messages.rewards.newReward}</Link>
      </p>
    </section>
  );
}

function RewardCard({ reward }: { reward: Reward }): React.ReactElement {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingOffers, setEditingOffers] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState(reward.title);
  const [description, setDescription] = useState(reward.description ?? "");

  const update = useUpdateReward();
  const retire = useRetireReward();

  return (
    <li style={{ border: "1px solid #ccc", padding: "0.75rem" }}>
      {editingTitle ? (
        <div>
          <label>
            {messages.rewards.rewardTitle}
            <input
              type="text"
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
          <button
            type="button"
            disabled={update.isPending}
            onClick={() =>
              update.mutate(
                { rewardId: reward.id, input: { title, description: description || null } },
                { onSuccess: () => setEditingTitle(false) },
              )
            }
          >
            {messages.rewards.save}
          </button>
          <button type="button" onClick={() => setEditingTitle(false)}>
            {messages.rewards.cancel}
          </button>

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

          {reward.image !== null && (
            <button
              type="button"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({ rewardId: reward.id, input: { imageUploadKey: null } })
              }
            >
              {messages.rewards.removeImage}
            </button>
          )}
        </div>
      ) : (
        <>
          {reward.image !== null && (
            <img
              src={reward.image}
              alt={reward.title}
              style={{ maxWidth: "10rem", borderRadius: "0.25rem", display: "block" }}
            />
          )}
          <strong>{reward.title}</strong>
          {reward.description !== null && <p>{reward.description}</p>}
        </>
      )}

      {update.error !== null && (
        <p role="alert" style={{ color: "#b00020" }}>
          {describeRewardsError(update.error)}
        </p>
      )}

      <p>{messages.rewards.offeredTo}</p>
      {reward.offers.length === 0 ? (
        <p>{messages.rewards.noOffers}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.25rem" }}>
          {reward.offers.map((offer) => (
            <li key={offer.child.id}>
              <Avatar value={offer.child.avatar} size="small" />{" "}
              {offer.child.name} · {offer.coins} {messages.rewards.coins.toLowerCase()}
            </li>
          ))}
        </ul>
      )}

      {editingOffers && (
        <OffersEditor reward={reward} onClose={() => setEditingOffers(false)} />
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        {!editingTitle && (
          <button type="button" onClick={() => setEditingTitle(true)}>
            {messages.rewards.edit}
          </button>
        )}
        <button type="button" onClick={() => setEditingOffers((abierto) => !abierto)}>
          {messages.rewards.editOffers}
        </button>
        {reward.status === "ACTIVE" && !confirming && (
          <button type="button" onClick={() => setConfirming(true)}>
            {messages.rewards.retire}
          </button>
        )}
      </div>

      {confirming && (
        <div style={{ marginTop: "0.5rem" }}>
          {/* Retirar es lógico, pero la interfaz lo dice antes y no después. */}
          <p role="alert">{messages.rewards.retireConfirm}</p>
          <button
            type="button"
            disabled={retire.isPending}
            onClick={() => retire.mutate(reward.id, { onSuccess: () => setConfirming(false) })}
          >
            {messages.rewards.retireSubmit}
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            {messages.rewards.cancel}
          </button>
          {retire.error !== null && (
            <p role="alert" style={{ color: "#b00020" }}>
              {describeRewardsError(retire.error)}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Reemplaza el conjunto COMPLETO de ofertas de un premio, en una sola
 * decisión: quién puede pedirlo y a qué precio, todo junto. Ver la decisión 3
 * del design de `add-rewards`.
 */
function OffersEditor({
  reward,
  onClose,
}: {
  reward: Reward;
  /** Cierra el editor EN LÍNEA. No navega: no es una pantalla. */
  onClose: () => void;
}): React.ReactElement {
  const { data, isPending } = useChildren(1, MAX_CHILDREN_PER_FAMILY);
  const replace = useReplaceAssignmentsForm(reward);

  const hijos = data?.items ?? [];

  if (isPending) {
    return <p>{messages.health.loading}</p>;
  }

  return (
    <div style={{ marginTop: "0.5rem", borderTop: "1px dashed #ccc", paddingTop: "0.5rem" }}>
      {hijos.map((hijo) => (
        <div key={hijo.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ flex: 1 }}>
            <input
              type="checkbox"
              checked={replace.elegidos.includes(hijo.id)}
              onChange={() => replace.alternar(hijo.id)}
            />
            <Avatar value={hijo.avatar} size="small" /> {hijo.name}
          </label>

          {replace.elegidos.includes(hijo.id) && (
            <input
              type="number"
              min={COINS_MIN}
              max={COINS_MAX}
              value={replace.precios[hijo.id] ?? ""}
              onChange={(event) => replace.fijarPrecio(hijo.id, event.target.value)}
              style={{ width: "6rem" }}
              aria-label={`${messages.rewards.coins} · ${hijo.name}`}
            />
          )}
        </div>
      ))}

      <button
        type="button"
        disabled={replace.mutation.isPending}
        onClick={() => replace.enviar(onClose)}
        style={{ marginTop: "0.5rem" }}
      >
        {messages.rewards.saveOffers}
      </button>
      <button type="button" onClick={onClose}>
        {messages.rewards.cancel}
      </button>

      {replace.mutation.error !== null && (
        <p role="alert" style={{ color: "#b00020" }}>
          {describeRewardsError(replace.mutation.error)}
        </p>
      )}
    </div>
  );
}

/** El estado local del editor de ofertas, ya conectado a la mutación. */
function useReplaceAssignmentsForm(reward: Reward): {
  elegidos: string[];
  precios: Record<string, string>;
  alternar: (childId: string) => void;
  fijarPrecio: (childId: string, valor: string) => void;
  enviar: (alCerrar: () => void) => void;
  mutation: ReturnType<typeof useReplaceAssignments>;
} {
  const [elegidos, setElegidos] = useState<string[]>(
    reward.offers.map((offer) => offer.child.id),
  );
  const [precios, setPrecios] = useState<Record<string, string>>(
    Object.fromEntries(reward.offers.map((offer) => [offer.child.id, String(offer.coins)])),
  );
  const mutation = useReplaceAssignments();

  function alternar(childId: string): void {
    setElegidos((previos) =>
      previos.includes(childId) ? previos.filter((uno) => uno !== childId) : [...previos, childId],
    );
  }

  function fijarPrecio(childId: string, valor: string): void {
    setPrecios((previos) => ({ ...previos, [childId]: valor }));
  }

  function enviar(alCerrar: () => void): void {
    mutation.mutate(
      {
        rewardId: reward.id,
        input: {
          assignments: elegidos.map((childId) => ({
            childId,
            coins: Number(precios[childId] ?? "0"),
          })),
        },
      },
      { onSuccess: alCerrar },
    );
  }

  return { elegidos, precios, alternar, fijarPrecio, enviar, mutation };
}

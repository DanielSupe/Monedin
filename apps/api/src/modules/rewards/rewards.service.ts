import {
  type CreateRewardInput,
  type ListOwnRewardsQuery,
  type ListRewardsQuery,
  type OwnReward,
  type Page,
  type ReplaceAssignmentsInput,
  type Reward,
  type UpdateRewardInput,
  normalizeCoinsPerChild,
  type ImageContentType,
  type UploadUrl,
} from "@monedin/contracts";
import { randomUUID } from "node:crypto";
import type { Actor } from "../../shared/actor.js";
import { resolveAvatarForResponse, resolveImageForResponse } from "../../shared/avatar/resolve-avatar.js";
import {
  extensionForContentType,
  getStorageProvider,
  isConfirmableUpload,
} from "../../shared/storage/index.js";
import { toPage, toSkipTake } from "../../shared/pagination.js";
// El hijo ajeno, el inexistente y el dado de baja son el mismo error que ya
// tiene `children`, con el mismo texto: es la misma razón por la que `tasks`
// lo reutiliza en vez de definir el suyo.
import { ChildNotFoundError } from "../children/children.errors.js";
import {
  ChildRoleRequiredError,
  InvalidImageUploadError,
  ParentRoleRequiredError,
  RewardNotFoundError,
} from "./rewards.errors.js";
import * as repository from "./rewards.repository.js";
import type { OwnRewardRow, RewardOfferRow, RewardRow } from "./rewards.repository.js";

/**
 * Reglas de negocio Y autorización de los premios.
 *
 * `requireParent` y `requireChild` filtran el rol antes de llegar aquí, pero
 * son filtros GRUESOS: que alguien sea padre no dice si el premio es suyo. Eso
 * se comprueba en cada método, y por eso el actor es un parámetro obligatorio.
 *
 * El reparto de responsabilidades con el repositorio es el mismo que en
 * `tasks`: aquí se decide QUIÉN puede operar y sobre QUÉ —lo que no es tuyo es
 * 404—, allí si una operación condicional encontró el estado del que partía.
 */

// ---------------------------------------------------------------------------
// Alta
// ---------------------------------------------------------------------------

/**
 * Publica un premio y lo ofrece a uno o varios hijos, cada uno con su precio.
 *
 * Es TODO O NADA: se comprueban todos los hijos antes de crear nada. Un
 * premio publicado a medias es peor que uno fallido, porque el padre creería
 * que sus tres hijos pueden pedirlo cuando solo pueden dos.
 */
export async function createReward(actor: Actor, input: CreateRewardInput): Promise<Reward> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const assignments = normalizeCoinsPerChild(input);
  const childIds = assignments.map((assignment) => assignment.childId);

  // Una sola consulta para los hijos del conjunto entero. Si falta uno, no se
  // crea nada: ni siquiera con las ofertas de los que sí son suyos.
  const owned = new Set(await repository.findChildIdsOwnedBy(actor.userId, childIds));
  if (childIds.some((childId) => !owned.has(childId))) {
    throw new ChildNotFoundError();
  }

  const row = await repository.createReward({
    parentId: actor.userId,
    title: input.title,
    assignments,
    ...(input.description === undefined ? {} : { description: input.description }),
  });

  return toReward(row);
}

// ---------------------------------------------------------------------------
// Lecturas del padre
// ---------------------------------------------------------------------------

export async function listRewards(actor: Actor, query: ListRewardsQuery): Promise<Page<Reward>> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const result = await repository.findRewardsPage(
    actor.userId,
    { isActive: query.status === "ACTIVE" },
    toSkipTake(query),
  );

  return toPage(query, {
    items: await Promise.all(result.items.map(toReward)),
    total: result.total,
  });
}

export async function getReward(actor: Actor, rewardId: string): Promise<Reward> {
  return toReward(await ownedReward(actor, rewardId));
}

/**
 * El detalle de un premio, para quien sea que lo pida.
 *
 * `GET /rewards/:rewardId` es la única ruta del módulo que sirve a los dos
 * roles, y la rama por rol vive AQUÍ y no en el controlador: un `if` sobre el
 * rol en la capa de HTTP estaría en el sitio equivocado. Cada rama devuelve la
 * vista que le corresponde, y las dos acaban en 404 sobre lo que no es suyo.
 */
export async function getRewardForActor(actor: Actor, rewardId: string): Promise<Reward | OwnReward> {
  return actor.familyRole === "PARENT" ? getReward(actor, rewardId) : getOwnReward(actor, rewardId);
}

// ---------------------------------------------------------------------------
// Lecturas del niño
// ---------------------------------------------------------------------------

export async function listOwnRewards(
  actor: Actor,
  query: ListOwnRewardsQuery,
): Promise<Page<OwnReward>> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

  // El perfil sale del ACTOR y nunca de la petición: es lo que hace cierto por
  // construcción que un niño no vea el precio de su hermano.
  const result = await repository.findOwnRewardsPage(actor.childProfileId, toSkipTake(query));

  return toPage(query, {
    items: await Promise.all(result.items.map((row) => toOwnReward(row, result.balance))),
    total: result.total,
  });
}

export async function getOwnReward(actor: Actor, rewardId: string): Promise<OwnReward> {
  const { reward, coins, balance } = await ownReward(actor, rewardId);

  return toOwnReward(
    {
      id: reward.id,
      title: reward.title,
      description: reward.description,
      image: reward.image,
      coins,
      createdAt: reward.createdAt,
    },
    balance,
  );
}

// ---------------------------------------------------------------------------
// Edición
// ---------------------------------------------------------------------------

export async function updateReward(
  actor: Actor,
  rewardId: string,
  input: UpdateRewardInput,
): Promise<Reward> {
  const found = await ownedReward(actor, rewardId);

  // `null` explícito quita la foto; una clave la confirma. No mandar el campo
  // deja la que hubiera.
  const image =
    input.imageUploadKey === undefined
      ? {}
      : { image: input.imageUploadKey === null ? null : await confirmedImageKey(found.id, input.imageUploadKey) };

  const updated = await repository.updateReward(found.id, {
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...image,
  });

  return toReward(updated);
}

/**
 * Una URL para subir la foto de un premio.
 *
 * Solo existe para un premio YA CREADO: la clave lleva su identificador dentro,
 * y ese identificador no existe mientras el premio se está creando. Ver la
 * decisión 7 del design de `add-file-storage`.
 */
export async function requestRewardImageUploadUrl(
  actor: Actor,
  rewardId: string,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  const found = await ownedReward(actor, rewardId);

  const key = `${imagePrefix(found.id)}${randomUUID()}.${extensionForContentType(contentType)}`;

  const { uploadUrl, expiresAt } = await getStorageProvider().createUploadUrl({ key, contentType });

  return { uploadUrl, key, expiresAt: expiresAt.toISOString() };
}

function imagePrefix(rewardId: string): string {
  return `rewards/${rewardId}/`;
}

async function confirmedImageKey(rewardId: string, key: string): Promise<string> {
  if (!(await isConfirmableUpload(getStorageProvider(), key, imagePrefix(rewardId)))) {
    throw new InvalidImageUploadError();
  }

  return key;
}

/**
 * Fija de una vez el conjunto completo de hijos a los que se ofrece el
 * premio, cada uno con su precio.
 *
 * TODO O NADA, igual que el alta: se comprueban todos los hijos del conjunto
 * ANTES de tocar ninguna fila, para que un hijo ajeno deje las ofertas
 * exactamente como estaban.
 */
export async function replaceAssignments(
  actor: Actor,
  rewardId: string,
  input: ReplaceAssignmentsInput,
): Promise<Reward> {
  // Repetido a propósito: `ownedReward` ya lo comprueba, pero devuelve un
  // premio y no estrecha el tipo de `actor` para lo que viene después.
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const found = await ownedReward(actor, rewardId);

  const childIds = input.assignments.map((assignment) => assignment.childId);
  if (childIds.length > 0) {
    const owned = new Set(await repository.findChildIdsOwnedBy(actor.userId, childIds));
    if (childIds.some((childId) => !owned.has(childId))) {
      throw new ChildNotFoundError();
    }
  }

  return toReward(await repository.replaceAssignments(found.id, input.assignments));
}

/**
 * Retira un premio: deja de poder pedirse y desaparece del escaparate, sin
 * destruir nada.
 *
 * Cero filas afectadas es 404 y no 409: retirar no mueve monedas, así que
 * quien pierde la carrera pregunta por un premio que ya no está activo. Ver
 * la decisión 4 del design.
 */
export async function retireReward(actor: Actor, rewardId: string): Promise<void> {
  const found = await ownedReward(actor, rewardId);

  if ((await repository.retireReward(found.id)) !== 1) {
    throw new RewardNotFoundError();
  }
}

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

/**
 * El premio indicado, si es de este padre.
 *
 * Inexistente y de otra familia lanzan el MISMO error. Distinguirlos con un
 * 403 confirmaría que ese premio existe.
 */
async function ownedReward(actor: Actor, rewardId: string): Promise<RewardRow> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const found = await repository.findRewardById(rewardId);
  if (found === null || found.parentId !== actor.userId) {
    throw new RewardNotFoundError();
  }

  return found;
}

/**
 * El premio indicado, si está ACTIVO y se le ofrece al propio niño que llama.
 *
 * Retirado, no ofrecido a él, o inexistente dan el MISMO 404: ninguno de los
 * tres debe poder deducirse desde fuera. Lee también el saldo aquí y no en
 * quien llama: es donde `actor` sigue estrechado a `CHILD` y su
 * `childProfileId` está disponible sin repetir la comprobación de rol.
 */
async function ownReward(
  actor: Actor,
  rewardId: string,
): Promise<{ reward: RewardRow; coins: number; balance: number }> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

  const found = await repository.findRewardById(rewardId);
  if (found === null || !found.isActive) {
    throw new RewardNotFoundError();
  }

  const mine = found.offers.find((offer) => offer.child.id === actor.childProfileId);
  if (mine === undefined) {
    throw new RewardNotFoundError();
  }

  const balance = await repository.findChildBalance(actor.childProfileId);

  return { reward: found, coins: mine.coins, balance };
}

/** Un premio para el padre: con TODAS sus ofertas, sin `parentId`. */
async function toReward(row: RewardRow): Promise<Reward> {
  const storage = getStorageProvider();

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: await resolveImageForResponse(storage, row.image),
    status: row.isActive ? "ACTIVE" : "RETIRED",
    offers: await Promise.all(row.offers.map(toRewardOffer)),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function toRewardOffer(offer: RewardOfferRow): Promise<Reward["offers"][number]> {
  return {
    child: {
      id: offer.child.id,
      name: offer.child.name,
      // Resuelto siempre, para que el front no trate el caso vacío.
      avatar: await resolveAvatarForResponse(getStorageProvider(), offer.child.avatar),
    },
    coins: offer.coins,
  };
}

/** Un premio para el niño al que se le ofrece: solo SU precio. */
async function toOwnReward(row: OwnRewardRow, balance: number): Promise<OwnReward> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: await resolveImageForResponse(getStorageProvider(), row.image),
    coins: row.coins,
    affordable: balance >= row.coins,
    createdAt: row.createdAt.toISOString(),
  };
}

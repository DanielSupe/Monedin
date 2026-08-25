import {
  type CreateRedemptionInput,
  type ListOwnRedemptionsQuery,
  type ListRedemptionsQuery,
  type OwnRedemption,
  type Page,
  type Redemption,
  resolveAvatarKey,
} from "@monedin/contracts";
import type { Actor } from "../../shared/actor.js";
import { toPage, toSkipTake } from "../../shared/pagination.js";
// El premio inexistente, retirado, o no ofertado a este hijo es el mismo caso
// que ya cubre `rewards`, con el mismo texto: "ese premio no está disponible
// para ti" no cambia de significado porque quien pregunta sea `redemptions`.
// Ver la decisión 6 del design de `add-redemptions`.
import { RewardNotFoundError } from "../rewards/rewards.errors.js";
import {
  ChildRoleRequiredError,
  DuplicatePendingRedemptionError,
  InsufficientBalanceError,
  ParentRoleRequiredError,
  RedemptionNotFoundError,
} from "./redemptions.errors.js";
import * as repository from "./redemptions.repository.js";
import type { RedemptionRow } from "./redemptions.repository.js";

/**
 * Reglas de negocio Y autorización de los canjes.
 *
 * `requireParent` y `requireChild` filtran el rol antes de llegar aquí, pero
 * son filtros GRUESOS: eso no dice si el canje es tuyo. Eso se comprueba en
 * cada método, y por eso el actor es un parámetro obligatorio.
 *
 * El reparto de responsabilidades con el repositorio es el mismo que en
 * `tasks`/`rewards`: aquí se decide QUIÉN puede operar y sobre QUÉ —lo que no
 * es tuyo es 404—, allí si una operación condicional encontró el estado del
 * que partía —eso es 409—.
 */

// ---------------------------------------------------------------------------
// Alta
// ---------------------------------------------------------------------------

/**
 * El niño solicita el canje de un premio ofrecido a él.
 *
 * El orden de las comprobaciones importa: primero que el premio exista y
 * siga disponible para este hijo (404, no delata si un premio ajeno existe),
 * después que no haya ya una solicitud pendiente del mismo (409, límite de
 * política, ver la decisión 9 del design), y solo entonces el saldo (409,
 * límite de política, decisión 2). El precio que se congela es el de la
 * oferta EN ESTE MOMENTO, leído en la misma consulta que las dos
 * comprobaciones anteriores.
 */
export async function createRedemption(
  actor: Actor,
  input: CreateRedemptionInput,
): Promise<OwnRedemption> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

  const offer = await repository.findOfferForChild(input.rewardId, actor.childProfileId);
  if (offer === null || !offer.rewardIsActive) {
    throw new RewardNotFoundError();
  }

  if (await repository.existsPendingRedemption(input.rewardId, actor.childProfileId)) {
    throw new DuplicatePendingRedemptionError();
  }

  if (offer.childBalance < offer.coins) {
    throw new InsufficientBalanceError();
  }

  const row = await repository.createRedemption({
    childId: actor.childProfileId,
    rewardId: input.rewardId,
    coins: offer.coins,
  });

  return toOwnRedemption(row);
}

// ---------------------------------------------------------------------------
// Lecturas del padre
// ---------------------------------------------------------------------------

export async function listRedemptions(
  actor: Actor,
  query: ListRedemptionsQuery,
): Promise<Page<Redemption>> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const result = await repository.findRedemptionsPage(
    actor.userId,
    {
      ...(query.status === undefined ? {} : { status: query.status }),
      ...(query.childId === undefined ? {} : { childId: query.childId }),
    },
    toSkipTake(query),
  );

  return toPage(query, { items: result.items.map(toRedemption), total: result.total });
}

export async function getRedemption(actor: Actor, redemptionId: string): Promise<Redemption> {
  return toRedemption(await ownedRedemption(actor, redemptionId));
}

/**
 * El detalle de un canje, para quien sea que lo pida.
 *
 * `GET /redemptions/:redemptionId` es la única ruta del módulo que sirve a
 * los dos roles, y la rama por rol vive AQUÍ y no en el controlador, mismo
 * patrón que `tasks`/`rewards`.
 */
export async function getRedemptionForActor(
  actor: Actor,
  redemptionId: string,
): Promise<Redemption | OwnRedemption> {
  return actor.familyRole === "PARENT"
    ? getRedemption(actor, redemptionId)
    : getOwnRedemption(actor, redemptionId);
}

// ---------------------------------------------------------------------------
// Lecturas del niño
// ---------------------------------------------------------------------------

export async function listOwnRedemptions(
  actor: Actor,
  query: ListOwnRedemptionsQuery,
): Promise<Page<OwnRedemption>> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

  // El perfil sale del ACTOR y nunca de la petición: es lo que hace cierto por
  // construcción que un niño no vea los canjes de su hermano.
  const result = await repository.findOwnRedemptionsPage(
    actor.childProfileId,
    { ...(query.status === undefined ? {} : { status: query.status }) },
    toSkipTake(query),
  );

  return toPage(query, { items: result.items.map(toOwnRedemption), total: result.total });
}

export async function getOwnRedemption(actor: Actor, redemptionId: string): Promise<OwnRedemption> {
  return toOwnRedemption(await ownRedemption(actor, redemptionId));
}

// ---------------------------------------------------------------------------
// Transiciones
// ---------------------------------------------------------------------------

/**
 * El padre aprueba un canje pendiente, lo que DESCUENTA sus monedas.
 *
 * El precio que se descuenta es `found.coins`: el congelado en la solicitud,
 * nunca el que la oferta tenga ahora. El repositorio revalida el saldo de
 * forma atómica dentro de la transacción; aquí no se repite esa comprobación.
 */
export async function approveRedemption(actor: Actor, redemptionId: string): Promise<Redemption> {
  const found = await ownedRedemption(actor, redemptionId);

  return toRedemption(await repository.approve(found.id, found.child.id, found.coins));
}

/** Rechazar deja el canje en `REJECTED`, terminal. No mueve monedas. */
export async function rejectRedemption(actor: Actor, redemptionId: string): Promise<Redemption> {
  const found = await ownedRedemption(actor, redemptionId);

  return toRedemption(await repository.transition(found.id, "PENDING", "REJECTED"));
}

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

/**
 * El canje indicado, si su hijo es de este padre.
 *
 * Se filtra por `child.parentId` y no por el premio: el dueño canónico de un
 * canje es el niño que lo solicitó. Ver la decisión 4 del design. Inexistente
 * y de otra familia lanzan el MISMO error: un 403 confirmaría que ese canje
 * existe.
 */
async function ownedRedemption(
  actor: Actor,
  redemptionId: string,
): Promise<RedemptionRow & { parentId: string; childId: string }> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const found = await repository.findRedemptionById(redemptionId);
  if (found === null || found.parentId !== actor.userId) {
    throw new RedemptionNotFoundError();
  }

  return found;
}

/**
 * El canje indicado, si es del propio niño que llama.
 *
 * El de un hermano da el mismo 404 que uno inexistente.
 */
async function ownRedemption(
  actor: Actor,
  redemptionId: string,
): Promise<RedemptionRow & { parentId: string; childId: string }> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

  const found = await repository.findRedemptionById(redemptionId);
  if (found === null || found.childId !== actor.childProfileId) {
    throw new RedemptionNotFoundError();
  }

  return found;
}

/** Un canje para el padre: con el hijo que lo solicitó. */
function toRedemption(row: RedemptionRow): Redemption {
  return {
    id: row.id,
    coins: row.coins,
    status: row.status,
    reward: { id: row.reward.id, title: row.reward.title },
    child: {
      id: row.child.id,
      name: row.child.name,
      // Resuelto siempre, para que el front no trate el caso vacío.
      avatar: resolveAvatarKey(row.child.avatar),
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Un canje para el niño que lo solicitó: sin el hijo, porque es él. */
function toOwnRedemption(row: RedemptionRow): OwnRedemption {
  return {
    id: row.id,
    coins: row.coins,
    status: row.status,
    reward: { id: row.reward.id, title: row.reward.title },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

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

export async function getRedemptionForActor(
  actor: Actor,
  redemptionId: string,
): Promise<Redemption | OwnRedemption> {
  return actor.familyRole === "PARENT"
    ? getRedemption(actor, redemptionId)
    : getOwnRedemption(actor, redemptionId);
}

export async function listOwnRedemptions(
  actor: Actor,
  query: ListOwnRedemptionsQuery,
): Promise<Page<OwnRedemption>> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

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

export async function approveRedemption(actor: Actor, redemptionId: string): Promise<Redemption> {
  const found = await ownedRedemption(actor, redemptionId);

  return toRedemption(await repository.approve(found.id, found.child.id, found.coins));
}

export async function rejectRedemption(actor: Actor, redemptionId: string): Promise<Redemption> {
  const found = await ownedRedemption(actor, redemptionId);

  return toRedemption(await repository.transition(found.id, "PENDING", "REJECTED"));
}

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

function toRedemption(row: RedemptionRow): Redemption {
  return {
    id: row.id,
    coins: row.coins,
    status: row.status,
    reward: { id: row.reward.id, title: row.reward.title },
    child: {
      id: row.child.id,
      name: row.child.name,

      avatar: resolveAvatarKey(row.child.avatar),
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

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

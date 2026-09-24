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

import { ChildNotFoundError } from "../children/children.errors.js";
import {
  ChildRoleRequiredError,
  InvalidImageUploadError,
  ParentRoleRequiredError,
  RewardNotFoundError,
} from "./rewards.errors.js";
import * as repository from "./rewards.repository.js";
import type { OwnRewardRow, RewardOfferRow, RewardRow } from "./rewards.repository.js";

export async function createReward(actor: Actor, input: CreateRewardInput): Promise<Reward> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const assignments = normalizeCoinsPerChild(input);
  const childIds = assignments.map((assignment) => assignment.childId);

  const owned = new Set(await repository.findChildIdsOwnedBy(actor.userId, childIds));
  if (childIds.some((childId) => !owned.has(childId))) {
    throw new ChildNotFoundError();
  }

  const image =
    input.imageUploadKey === undefined
      ? undefined
      : await confirmedPendingImageKey(actor.userId, input.imageUploadKey);

  const row = await repository.createReward({
    parentId: actor.userId,
    title: input.title,
    assignments,
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(image === undefined ? {} : { image }),
  });

  return toReward(row);
}

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

export async function getRewardForActor(actor: Actor, rewardId: string): Promise<Reward | OwnReward> {
  return actor.familyRole === "PARENT" ? getReward(actor, rewardId) : getOwnReward(actor, rewardId);
}

export async function listOwnRewards(
  actor: Actor,
  query: ListOwnRewardsQuery,
): Promise<Page<OwnReward>> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

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

export async function updateReward(
  actor: Actor,
  rewardId: string,
  input: UpdateRewardInput,
): Promise<Reward> {
  const found = await ownedReward(actor, rewardId);

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

export async function requestPendingRewardImageUploadUrl(
  actor: Actor,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const key = `${pendingImagePrefix(actor.userId)}${randomUUID()}.${extensionForContentType(contentType)}`;

  const { uploadUrl, expiresAt } = await getStorageProvider().createUploadUrl({ key, contentType });

  return { uploadUrl, key, expiresAt: expiresAt.toISOString() };
}

function imagePrefix(rewardId: string): string {
  return `rewards/${rewardId}/`;
}

function pendingImagePrefix(userId: string): string {
  return `rewards/pending/${userId}/`;
}

async function confirmedPendingImageKey(userId: string, key: string): Promise<string> {
  if (!(await isConfirmableUpload(getStorageProvider(), key, pendingImagePrefix(userId)))) {
    throw new InvalidImageUploadError();
  }

  return key;
}

async function confirmedImageKey(rewardId: string, key: string): Promise<string> {
  if (!(await isConfirmableUpload(getStorageProvider(), key, imagePrefix(rewardId)))) {
    throw new InvalidImageUploadError();
  }

  return key;
}

export async function replaceAssignments(
  actor: Actor,
  rewardId: string,
  input: ReplaceAssignmentsInput,
): Promise<Reward> {
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

export async function retireReward(actor: Actor, rewardId: string): Promise<void> {
  const found = await ownedReward(actor, rewardId);

  if ((await repository.retireReward(found.id)) !== 1) {
    throw new RewardNotFoundError();
  }
}

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

      avatar: await resolveAvatarForResponse(getStorageProvider(), offer.child.avatar),
    },
    coins: offer.coins,
  };
}

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

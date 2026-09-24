import {
  MAX_CHILDREN_PER_FAMILY,
  type AvatarValue,
  type Child,
  type CreateChildInput,
  type ImageContentType,
  type OwnChild,
  type Page,
  type PaginationQuery,
  type UpdateChildInput,
  type UpdateOwnChildInput,
  type UploadUrl,
} from "@monedin/contracts";
import { randomUUID } from "node:crypto";
import type { Actor } from "../../shared/actor.js";
import { resolveAvatarForResponse } from "../../shared/avatar/resolve-avatar.js";
import { hashCredential } from "../../shared/crypto/credentials.js";
import { toPage, toSkipTake } from "../../shared/pagination.js";
import {
  extensionForContentType,
  getStorageProvider,
  isConfirmableUpload,
} from "../../shared/storage/index.js";
import * as authRepository from "../auth/auth.repository.js";
import {
  ChildNotFoundError,
  ChildRoleRequiredError,
  InvalidAvatarUploadError,
  MaxChildrenReachedError,
  ParentRoleRequiredError,
} from "./children.errors.js";
import * as repository from "./children.repository.js";
import type { ChildRow } from "./children.repository.js";

export async function createChild(
  accountUserId: string,
  actingAs: Actor | undefined,
  input: CreateChildInput,
): Promise<Child> {
  if (actingAs?.familyRole === "CHILD") {
    throw new ParentRoleRequiredError();
  }

  if ((await repository.countActiveChildren(accountUserId)) >= MAX_CHILDREN_PER_FAMILY) {
    throw new MaxChildrenReachedError();
  }

  const row = await repository.createChild({
    parentId: accountUserId,
    name: input.name,
    pinHash: await hashCredential(input.pin),
    ...(input.age === undefined ? {} : { age: input.age }),
    ...(input.avatar === undefined ? {} : { avatar: input.avatar }),
  });

  return toChild(row);
}

export async function listChildren(
  actor: Actor,
  query: PaginationQuery,
): Promise<Page<Child>> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const result = await repository.findChildrenPage(actor.userId, toSkipTake(query));

  return toPage(query, {
    items: await Promise.all(result.items.map(toChild)),
    total: result.total,
  });
}

export async function getChild(actor: Actor, childId: string): Promise<Child> {
  return toChild(await ownedChild(actor, childId));
}

export async function updateChild(
  actor: Actor,
  childId: string,
  input: UpdateChildInput,
): Promise<Child> {
  const found = await ownedChild(actor, childId);

  const { avatarUploadKey, ...rest } = input;

  const avatar =
    avatarUploadKey === undefined
      ? {}
      : { avatar: await confirmedAvatarKey(found.id, avatarUploadKey) };

  return toChild(await repository.updateChild(found.id, { ...rest, ...avatar }));
}

export async function requestAvatarUploadUrl(
  actor: Actor,
  childId: string,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  const found = await ownedChild(actor, childId);

  return createAvatarUploadUrl(found.id, contentType);
}

export async function deactivateChild(actor: Actor, childId: string): Promise<void> {
  const found = await ownedChild(actor, childId);

  if ((await repository.deactivateChild(found.id)) !== 1) {
    throw new ChildNotFoundError();
  }

  await authRepository.revokeSessionsOfChildProfile(found.id);
}

export async function getOwnChild(actor: Actor): Promise<OwnChild> {
  return toOwnChild(await ownProfile(actor));
}

export async function updateOwnAvatar(
  actor: Actor,
  input: UpdateOwnChildInput,
): Promise<OwnChild> {
  const found = await ownProfile(actor);

  const avatar =
    input.avatarUploadKey === undefined
      ? input.avatar
      : await confirmedAvatarKey(found.id, input.avatarUploadKey);

  return toOwnChild(await repository.updateChild(found.id, { avatar }));
}

export async function requestOwnAvatarUploadUrl(
  actor: Actor,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  const found = await ownProfile(actor);

  return createAvatarUploadUrl(found.id, contentType);
}

async function createAvatarUploadUrl(
  childId: string,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  const key = `${avatarPrefix(childId)}${randomUUID()}.${extensionForContentType(contentType)}`;

  const { uploadUrl, expiresAt } = await getStorageProvider().createUploadUrl({ key, contentType });

  return { uploadUrl, key, expiresAt: expiresAt.toISOString() };
}

async function ownedChild(actor: Actor, childId: string): Promise<ChildRow> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const found = await repository.findChildById(childId);
  if (found === null || found.deletedAt !== null || found.parentId !== actor.userId) {
    throw new ChildNotFoundError();
  }

  return found;
}

async function ownProfile(actor: Actor): Promise<ChildRow> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

  const found = await repository.findChildById(actor.childProfileId);
  if (found === null || found.deletedAt !== null) {
    throw new ChildNotFoundError();
  }

  return found;
}

function avatarOf(row: ChildRow): Promise<AvatarValue> {
  return resolveAvatarForResponse(getStorageProvider(), row.avatar);
}

async function toChild(row: ChildRow): Promise<Child> {
  return {
    id: row.id,
    name: row.name,
    avatar: await avatarOf(row),
    age: row.age,
    coins: row.coins,
    locked: row.lockedUntil !== null && row.lockedUntil.getTime() > Date.now(),
    createdAt: row.createdAt.toISOString(),
  };
}

async function toOwnChild(row: ChildRow): Promise<OwnChild> {
  return {
    id: row.id,
    name: row.name,
    avatar: await avatarOf(row),
    age: row.age,
    coins: row.coins,
  };
}

async function confirmedAvatarKey(childId: string, key: string): Promise<string> {
  if (!(await isConfirmableUpload(getStorageProvider(), key, avatarPrefix(childId)))) {
    throw new InvalidAvatarUploadError();
  }

  return key;
}

function avatarPrefix(childId: string): string {
  return `avatars/children/${childId}/`;
}

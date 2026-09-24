import {
  CHILD_LOCKOUT_MINUTES,
  CHILD_MAX_FAILED_ATTEMPTS,
  CHILD_SESSION_HOURS,
  PARENT_LOCKOUT_MINUTES,
  PARENT_MAX_FAILED_ATTEMPTS,
  PARENT_PIN_LOCKOUT_MINUTES,
  PARENT_PIN_MAX_FAILED_ATTEMPTS,
  PARENT_PROFILE_ID,
  PARENT_SESSION_DAYS,
  resolveAvatarKey,
  type AvatarValue,
  type ImageContentType,
  type UpdateParentAvatarInput,
  type ThemePreference,
  type UpdateThemeInput,
  type UpdateTutorialInput,
  type UploadUrl,
} from "@monedin/contracts";
import { randomUUID } from "node:crypto";
import type { Actor } from "../../shared/actor.js";
import { resolveAvatarForResponse } from "../../shared/avatar/resolve-avatar.js";
import { hashCredential, verifyCredential } from "../../shared/crypto/credentials.js";
import { generateSessionToken } from "../../shared/crypto/session-token.js";
import { NotFoundError, TooManyAttemptsError } from "../../shared/errors/domain-errors.js";
import {
  extensionForContentType,
  getStorageProvider,
  isConfirmableUpload,
} from "../../shared/storage/index.js";
import * as repository from "./auth.repository.js";
import {
  ChildSessionRequiredError,
  EmailAlreadyRegisteredError,
  InvalidAvatarUploadError,
  InvalidCredentialsError,
  InvalidPinError,
  ParentSessionRequiredError,
} from "./auth.errors.js";

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 3_600_000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

function activeLockout(lockedUntil: Date | null): Date | undefined {
  if (lockedUntil === null) return undefined;
  return lockedUntil.getTime() > Date.now() ? lockedUntil : undefined;
}

const DUMMY_HASH_PROMISE = hashCredential("credencial-inexistente-para-igualar-tiempos");

async function burnEquivalentTime(candidate: string): Promise<void> {
  await verifyCredential(candidate, await DUMMY_HASH_PROMISE);
}

export interface ParentSummary {
  id: string;
  name: string;
  email: string;
}

export interface ParentProfileSummary extends ParentSummary {
  avatar: AvatarValue;

  tutorialSeen: boolean;

  theme: ThemePreference;
}

export interface IssuedSession {
  token: string;
  expiresAt: Date;
}

export async function registerParent(input: {
  name: string;
  email: string;
  password: string;
  pin: string;
}): Promise<{ parent: ParentSummary; session: IssuedSession }> {
  const email = normalizeEmail(input.email);

  if ((await repository.findParentByEmail(email)) !== null) {
    throw new EmailAlreadyRegisteredError();
  }

  const parent = await repository.createParent({
    name: input.name,
    email,
    passwordHash: await hashCredential(input.password),
    pinHash: await hashCredential(input.pin),
  });

  return { parent, session: await issueAccountSession(parent.id) };
}

export async function loginParent(input: {
  email: string;
  password: string;
}): Promise<{ parent: ParentSummary; session: IssuedSession }> {
  const email = normalizeEmail(input.email);
  const found = await repository.findParentByEmail(email);

  if (found === null) {
    await burnEquivalentTime(input.password);
    throw new InvalidCredentialsError();
  }

  const lockedUntil = activeLockout(found.lockedUntil);
  if (lockedUntil !== undefined) {
    throw new TooManyAttemptsError(lockedUntil);
  }

  const { valid, needsRehash } = await verifyCredential(input.password, found.passwordHash);

  if (!valid) {
    const attempts = await repository.registerFailedLogin(found.id);
    if (attempts >= PARENT_MAX_FAILED_ATTEMPTS) {
      await repository.lockParentUntil(found.id, minutesFromNow(PARENT_LOCKOUT_MINUTES));
    }
    throw new InvalidCredentialsError();
  }

  if (found.failedLoginAttempts > 0 || found.lockedUntil !== null) {
    await repository.clearParentLockout(found.id);
  }

  if (needsRehash) {
    await repository.updateParentPasswordHash(found.id, await hashCredential(input.password));
  }

  return {
    parent: { id: found.id, name: found.name, email: found.email },
    session: await issueAccountSession(found.id),
  };
}

export async function changePassword(
  actor: Actor,
  accountSessionId: string,
  input: { currentPassword: string; newPassword: string },
): Promise<void> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const found = await repository.findParentCredentialsById(actor.userId);
  if (found === null) {
    throw new NotFoundError();
  }

  const { valid } = await verifyCredential(input.currentPassword, found.passwordHash);
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  await repository.updateParentPasswordHash(found.id, await hashCredential(input.newPassword));
  await repository.revokeAllSessionsOfUser(found.id, accountSessionId);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function issueAccountSession(userId: string): Promise<IssuedSession> {
  const token = generateSessionToken();
  const expiresAt = daysFromNow(PARENT_SESSION_DAYS);

  await repository.createSession({ token, userId, expiresAt });

  return { token, expiresAt };
}

export async function changeAdultPin(
  actor: Actor,
  input: { currentPin: string; newPin: string },
): Promise<void> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const found = await repository.findParentCredentialsById(actor.userId);
  if (found === null) {
    throw new NotFoundError();
  }

  const { valid } = await verifyCredential(input.currentPin, found.pinHash);
  if (!valid) {
    throw new InvalidPinError();
  }

  await repository.updateParentPinHash(found.id, await hashCredential(input.newPin));
}

export async function resetAdultPin(
  accountUserId: string,
  input: { password: string; newPin: string },
): Promise<void> {
  const found = await repository.findParentCredentialsById(accountUserId);
  if (found === null) {
    throw new NotFoundError();
  }

  const { valid } = await verifyCredential(input.password, found.passwordHash);
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  await repository.updateParentPinHash(found.id, await hashCredential(input.newPin));
}

export interface SelectableProfile {
  id: string;
  familyRole: "PARENT" | "CHILD";
  name: string;

  avatar: AvatarValue;
  locked: boolean;
}

export async function listProfiles(accountUserId: string): Promise<SelectableProfile[]> {
  const parent = await repository.findParentCredentialsById(accountUserId);
  if (parent === null) {
    throw new NotFoundError();
  }

  const profile = await repository.findParentById(accountUserId);
  const children = await repository.findSelectableChildren(accountUserId);

  const storage = getStorageProvider();

  return [
    {
      id: PARENT_PROFILE_ID,
      familyRole: "PARENT",
      name: parent.name,
      avatar: await resolveAvatarForResponse(storage, profile?.image ?? null),
      locked: activeLockout(parent.pinLockedUntil) !== undefined,
    },
    ...(await Promise.all(
      children.map(async (child) => ({
        id: child.id,
        familyRole: "CHILD" as const,
        name: child.name,
        avatar: await resolveAvatarForResponse(storage, child.avatar),
        locked: activeLockout(child.lockedUntil) !== undefined,
      })),
    )),
  ];
}

export interface ActiveProfile {
  familyRole: "PARENT" | "CHILD";
  id: string;
  name: string;
  avatar: AvatarValue;

  coins?: number;

  email?: string;

  tutorialSeen: boolean;

  theme: ThemePreference;
}

export async function enterProfile(
  accountUserId: string,
  accountSessionId: string,
  input: { profileId: string; pin: string },
): Promise<{ profile: ActiveProfile; session: IssuedSession }> {
  return input.profileId === PARENT_PROFILE_ID
    ? enterParentProfile(accountUserId, accountSessionId, input.pin)
    : enterChildProfile(accountUserId, accountSessionId, input.profileId, input.pin);
}

async function enterParentProfile(
  accountUserId: string,
  accountSessionId: string,
  pin: string,
): Promise<{ profile: ActiveProfile; session: IssuedSession }> {
  const found = await repository.findParentCredentialsById(accountUserId);
  if (found === null) {
    await burnEquivalentTime(pin);
    throw new InvalidPinError();
  }

  const lockedUntil = activeLockout(found.pinLockedUntil);
  if (lockedUntil !== undefined) {
    throw new TooManyAttemptsError(lockedUntil);
  }

  const { valid, needsRehash } = await verifyCredential(pin, found.pinHash);

  if (!valid) {
    const attempts = await repository.registerFailedParentPin(found.id);
    if (attempts >= PARENT_PIN_MAX_FAILED_ATTEMPTS) {
      await repository.lockParentPinUntil(found.id, minutesFromNow(PARENT_PIN_LOCKOUT_MINUTES));
    }
    throw new InvalidPinError();
  }

  if (found.failedPinAttempts > 0 || found.pinLockedUntil !== null) {
    await repository.clearParentPinLockout(found.id);
  }
  if (needsRehash) {
    await repository.updateParentPinHash(found.id, await hashCredential(pin));
  }

  const profile = await repository.findParentById(accountUserId);

  await repository.revokeProfileSessionsOf(accountSessionId);
  const session = await issueProfileSession(accountUserId, accountSessionId, undefined);

  return {
    profile: {
      familyRole: "PARENT",
      id: PARENT_PROFILE_ID,
      name: found.name,
      email: found.email,
      avatar: await resolveAvatarForResponse(getStorageProvider(), profile?.image ?? null),
      tutorialSeen: profile?.tutorialSeenAt != null,
      theme: profile?.themePreference ?? "SYSTEM",
    },
    session,
  };
}

async function enterChildProfile(
  accountUserId: string,
  accountSessionId: string,
  childProfileId: string,
  pin: string,
): Promise<{ profile: ActiveProfile; session: IssuedSession }> {
  const found = await repository.findChildCredentials(childProfileId);

  if (found === null || found.parentId !== accountUserId || found.deletedAt !== null) {
    await burnEquivalentTime(pin);
    throw new InvalidPinError();
  }

  const lockedUntil = activeLockout(found.lockedUntil);
  if (lockedUntil !== undefined) {
    throw new TooManyAttemptsError(lockedUntil);
  }

  const { valid, needsRehash } = await verifyCredential(pin, found.pinHash);

  if (!valid) {
    const attempts = await repository.registerFailedPin(found.id);
    if (attempts >= CHILD_MAX_FAILED_ATTEMPTS) {
      await repository.lockChildUntil(found.id, minutesFromNow(CHILD_LOCKOUT_MINUTES));
    }
    throw new InvalidPinError();
  }

  if (found.failedPinAttempts > 0 || found.lockedUntil !== null) {
    await repository.clearChildLockout(found.id);
  }
  if (needsRehash) {
    await repository.updateChildPinHash(found.id, await hashCredential(pin));
  }

  const child = await repository.findChildForSession(found.id);
  if (child === null) {
    throw new NotFoundError();
  }

  await repository.revokeProfileSessionsOf(accountSessionId);
  const session = await issueProfileSession(accountUserId, accountSessionId, child.id);

  return {
    profile: {
      familyRole: "CHILD",
      id: child.id,
      name: child.name,
      avatar: resolveAvatarKey(child.avatar),
      coins: child.coins,
      tutorialSeen: child.tutorialSeenAt !== null,
      theme: child.themePreference,
    },
    session,
  };
}

async function issueProfileSession(
  accountUserId: string,
  accountSessionId: string,
  childProfileId: string | undefined,
): Promise<IssuedSession> {
  const token = generateSessionToken();
  const expiresAt = hoursFromNow(CHILD_SESSION_HOURS);

  await repository.createSession({
    token,
    userId: accountUserId,
    ...(childProfileId === undefined ? {} : { childProfileId }),
    parentSessionId: accountSessionId,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function leaveProfile(profileSessionId: string): Promise<void> {
  await repository.revokeSession(profileSessionId);
}

export async function setChildPin(
  actor: Actor,
  input: { childProfileId: string; pin: string },
): Promise<void> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const found = await repository.findChildCredentials(input.childProfileId);

  if (found === null || found.deletedAt !== null || found.parentId !== actor.userId) {
    throw new NotFoundError();
  }

  await repository.updateChildPinHash(found.id, await hashCredential(input.pin));
  await repository.revokeSessionsOfChildProfile(found.id);
}

export async function changeOwnChildPin(
  actor: Actor,
  input: { currentPin: string; newPin: string },
): Promise<void> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildSessionRequiredError();
  }

  const found = await repository.findChildCredentials(actor.childProfileId);
  if (found === null || found.deletedAt !== null) {
    throw new NotFoundError();
  }

  const lockedUntil = activeLockout(found.lockedUntil);
  if (lockedUntil !== undefined) {
    throw new TooManyAttemptsError(lockedUntil);
  }

  const { valid } = await verifyCredential(input.currentPin, found.pinHash);
  if (!valid) {
    const attempts = await repository.registerFailedPin(found.id);
    if (attempts >= CHILD_MAX_FAILED_ATTEMPTS) {
      await repository.lockChildUntil(found.id, minutesFromNow(CHILD_LOCKOUT_MINUTES));
    }
    throw new InvalidPinError();
  }

  if (found.failedPinAttempts > 0 || found.lockedUntil !== null) {
    await repository.clearChildLockout(found.id);
  }

  await repository.updateChildPinHash(found.id, await hashCredential(input.newPin));
}

export async function unlockChildProfile(actor: Actor, childProfileId: string): Promise<void> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const found = await repository.findChildCredentials(childProfileId);
  if (found === null || found.parentId !== actor.userId || found.deletedAt !== null) {
    throw new NotFoundError();
  }

  await repository.clearChildLockout(found.id);
}

export async function describeParent(userId: string): Promise<ParentProfileSummary | null> {
  const parent = await repository.findParentById(userId);
  if (parent === null) return null;

  return {
    id: parent.id,
    name: parent.name,
    email: parent.email,
    avatar: await resolveAvatarForResponse(getStorageProvider(), parent.image),
    tutorialSeen: parent.tutorialSeenAt !== null,
    theme: parent.themePreference,
  };
}

export async function updateTutorialSeen(actor: Actor, input: UpdateTutorialInput): Promise<void> {
  const cuando = input.seen ? new Date() : null;

  if (actor.familyRole === "CHILD") {
    await repository.setChildTutorialSeen(actor.childProfileId, cuando);
    return;
  }

  await repository.setParentTutorialSeen(actor.userId, cuando);
}

export async function updateTheme(actor: Actor, input: UpdateThemeInput): Promise<void> {
  if (actor.familyRole === "CHILD") {
    await repository.setChildTheme(actor.childProfileId, input.theme);
    return;
  }

  await repository.setParentTheme(actor.userId, input.theme);
}

function parentAvatarPrefix(userId: string): string {
  return `avatars/parents/${userId}/`;
}

async function confirmedParentAvatarKey(userId: string, key: string): Promise<string> {
  if (!(await isConfirmableUpload(getStorageProvider(), key, parentAvatarPrefix(userId)))) {
    throw new InvalidAvatarUploadError();
  }

  return key;
}

export async function requestParentAvatarUploadUrl(
  actor: Actor,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const key = `${parentAvatarPrefix(actor.userId)}${randomUUID()}.${extensionForContentType(contentType)}`;

  const { uploadUrl, expiresAt } = await getStorageProvider().createUploadUrl({ key, contentType });

  return { uploadUrl, key, expiresAt: expiresAt.toISOString() };
}

export async function updateParentAvatar(
  actor: Actor,
  input: UpdateParentAvatarInput,
): Promise<ParentProfileSummary> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentSessionRequiredError();
  }

  const image =
    input.avatar !== undefined
      ? input.avatar
      : await confirmedParentAvatarKey(actor.userId, input.avatarUploadKey as string);

  await repository.updateParentImage(actor.userId, image);

  const updated = await describeParent(actor.userId);
  if (updated === null) {
    throw new NotFoundError();
  }

  return updated;
}

export interface ChildSummary {
  id: string;
  name: string;
  avatar: string | null;
  coins: number;

  tutorialSeen: boolean;

  theme: ThemePreference;
}

export async function describeChild(childProfileId: string): Promise<ChildSummary | null> {
  const child = await repository.findChildForSession(childProfileId);
  if (child === null) return null;

  return {
    id: child.id,
    name: child.name,
    avatar: child.avatar,
    coins: child.coins,
    tutorialSeen: child.tutorialSeenAt !== null,
    theme: child.themePreference,
  };
}

export async function logout(accountSessionId: string): Promise<void> {
  await repository.revokeSession(accountSessionId);
}

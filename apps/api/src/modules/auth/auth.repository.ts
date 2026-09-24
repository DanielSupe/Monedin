import type { ThemePreference } from "@monedin/contracts";
import { getPrisma, withTranslatedErrors } from "../../shared/database/index.js";
import { hashSessionToken } from "../../shared/crypto/session-token.js";

export interface ParentCredentials {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;

  pinHash: string;
  failedPinAttempts: number;
  pinLockedUntil: Date | null;
}

export function findParentByEmail(email: string): Promise<ParentCredentials | null> {
  return withTranslatedErrors(() =>
    getPrisma().user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        pinHash: true,
        failedPinAttempts: true,
        pinLockedUntil: true,
      },
    }),
  );
}

export function findParentCredentialsById(id: string): Promise<ParentCredentials | null> {
  return withTranslatedErrors(() =>
    getPrisma().user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        pinHash: true,
        failedPinAttempts: true,
        pinLockedUntil: true,
      },
    }),
  );
}

export function findParentById(
  id: string,
): Promise<{
  id: string;
  name: string;
  email: string;
  image: string | null;
  tutorialSeenAt: Date | null;
  themePreference: ThemePreference;
} | null> {
  return withTranslatedErrors(() =>
    getPrisma().user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        tutorialSeenAt: true,
        themePreference: true,
      },
    }),
  );
}

export function updateParentImage(id: string, image: string | null): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({ where: { id }, data: { image } });
  });
}

export function createParent(data: {
  name: string;
  email: string;
  passwordHash: string;
  pinHash: string;
}): Promise<{ id: string; name: string; email: string }> {
  return withTranslatedErrors(() =>
    getPrisma().user.create({
      data,
      select: { id: true, name: true, email: true },
    }),
  );
}

export function updateParentPasswordHash(id: string, passwordHash: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({ where: { id }, data: { passwordHash } });
  });
}

export function registerFailedLogin(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const updated = await getPrisma().user.update({
      where: { id },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    return updated.failedLoginAttempts;
  });
}

export function lockParentUntil(id: string, until: Date): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({ where: { id }, data: { lockedUntil: until } });
  });
}

export function clearParentLockout(id: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });
}

export function updateParentPinHash(id: string, pinHash: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({
      where: { id },
      data: { pinHash, failedPinAttempts: 0, pinLockedUntil: null },
    });
  });
}

export function registerFailedParentPin(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const updated = await getPrisma().user.update({
      where: { id },
      data: { failedPinAttempts: { increment: 1 } },
      select: { failedPinAttempts: true },
    });
    return updated.failedPinAttempts;
  });
}

export function lockParentPinUntil(id: string, until: Date): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({ where: { id }, data: { pinLockedUntil: until } });
  });
}

export function clearParentPinLockout(id: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({
      where: { id },
      data: { failedPinAttempts: 0, pinLockedUntil: null },
    });
  });
}

export interface ChildCredentials {
  id: string;
  name: string;
  parentId: string;
  pinHash: string;
  failedPinAttempts: number;
  lockedUntil: Date | null;
  deletedAt: Date | null;
}

export function findSelectableChildren(
  parentId: string,
): Promise<Array<{ id: string; name: string; avatar: string | null; lockedUntil: Date | null }>> {
  return withTranslatedErrors(() =>
    getPrisma().childProfile.findMany({
      where: { parentId, deletedAt: null },
      select: { id: true, name: true, avatar: true, lockedUntil: true },
      orderBy: { createdAt: "asc" },
    }),
  );
}

export function findChildCredentials(id: string): Promise<ChildCredentials | null> {
  return withTranslatedErrors(() =>
    getPrisma().childProfile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        parentId: true,
        pinHash: true,
        failedPinAttempts: true,
        lockedUntil: true,
        deletedAt: true,
      },
    }),
  );
}

export function findChildForSession(
  id: string,
): Promise<{
  id: string;
  name: string;
  avatar: string | null;
  coins: number;
  parentId: string;
  tutorialSeenAt: Date | null;
  themePreference: ThemePreference;
} | null> {
  return withTranslatedErrors(() =>
    getPrisma().childProfile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        coins: true,
        parentId: true,
        tutorialSeenAt: true,
        themePreference: true,
      },
    }),
  );
}

export function setParentTutorialSeen(id: string, seenAt: Date | null): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({ where: { id }, data: { tutorialSeenAt: seenAt } });
  });
}

export function setChildTutorialSeen(id: string, seenAt: Date | null): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().childProfile.update({ where: { id }, data: { tutorialSeenAt: seenAt } });
  });
}

export function setParentTheme(id: string, theme: ThemePreference): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().user.update({ where: { id }, data: { themePreference: theme } });
  });
}

export function setChildTheme(id: string, theme: ThemePreference): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().childProfile.update({ where: { id }, data: { themePreference: theme } });
  });
}

export function updateChildPinHash(id: string, pinHash: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().childProfile.update({
      where: { id },
      data: { pinHash, failedPinAttempts: 0, lockedUntil: null },
    });
  });
}

export function registerFailedPin(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const updated = await getPrisma().childProfile.update({
      where: { id },
      data: { failedPinAttempts: { increment: 1 } },
      select: { failedPinAttempts: true },
    });
    return updated.failedPinAttempts;
  });
}

export function lockChildUntil(id: string, until: Date): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().childProfile.update({ where: { id }, data: { lockedUntil: until } });
  });
}

export function clearChildLockout(id: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().childProfile.update({
      where: { id },
      data: { failedPinAttempts: 0, lockedUntil: null },
    });
  });
}

export interface StoredSession {
  id: string;
  userId: string;
  childProfileId: string | null;
  parentSessionId: string | null;
  expiresAt: Date;
}

export function createSession(data: {
  token: string;
  userId: string;
  childProfileId?: string;
  parentSessionId?: string;
  expiresAt: Date;
}): Promise<StoredSession> {
  return withTranslatedErrors(() =>
    getPrisma().session.create({
      data: {
        tokenHash: hashSessionToken(data.token),
        userId: data.userId,
        ...(data.childProfileId === undefined ? {} : { childProfileId: data.childProfileId }),
        ...(data.parentSessionId === undefined ? {} : { parentSessionId: data.parentSessionId }),
        expiresAt: data.expiresAt,
      },
      select: {
        id: true,
        userId: true,
        childProfileId: true,
        parentSessionId: true,
        expiresAt: true,
      },
    }),
  );
}

export function findSessionByToken(token: string): Promise<StoredSession | null> {
  return withTranslatedErrors(() =>
    getPrisma().session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      select: {
        id: true,
        userId: true,
        childProfileId: true,
        parentSessionId: true,
        expiresAt: true,
      },
    }),
  );
}

export function findSessionById(id: string): Promise<StoredSession | null> {
  return withTranslatedErrors(() =>
    getPrisma().session.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        childProfileId: true,
        parentSessionId: true,
        expiresAt: true,
      },
    }),
  );
}

export function extendSession(id: string, expiresAt: Date): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().session.update({
      where: { id },
      data: { expiresAt, lastUsedAt: new Date() },
    });
  });
}

export function revokeSession(id: string): Promise<void> {
  return withTranslatedErrors(async () => {
    await getPrisma().session.deleteMany({ where: { id } });
  });
}

export function revokeAllSessionsOfUser(
  userId: string,
  keepAccountSessionId?: string,
): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().session.deleteMany({
      where: {
        userId,
        ...(keepAccountSessionId === undefined
          ? {}
          : {
              AND: [
                { id: { not: keepAccountSessionId } },
                {
                  OR: [
                    { parentSessionId: null },
                    { parentSessionId: { not: keepAccountSessionId } },
                  ],
                },
              ],
            }),
      },
    });
    return result.count;
  });
}

export function revokeSessionsOfChildProfile(childProfileId: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().session.deleteMany({ where: { childProfileId } });
    return result.count;
  });
}

export function revokeProfileSessionsOf(accountSessionId: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().session.deleteMany({
      where: { parentSessionId: accountSessionId },
    });
    return result.count;
  });
}

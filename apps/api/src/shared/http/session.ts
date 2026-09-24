import { PARENT_SESSION_DAYS } from "@monedin/contracts";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import * as authRepository from "../../modules/auth/auth.repository.js";
import type { Actor } from "../actor.js";
import { ForbiddenError, UnauthorizedError } from "../errors/domain-errors.js";
import {
  clearAccountSessionCookie,
  clearProfileSessionCookie,
  readAccountSessionCookie,
  readProfileSessionCookie,
} from "./session-cookies.js";

export interface ResolvedSession {
  accountUserId: string;
  accountSessionId: string;

  actor?: Actor;

  profileSessionId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: ResolvedSession;
      isPublicRoute?: boolean;
      isAccountOnlyRoute?: boolean;
    }
  }
}

const RENEWAL_THRESHOLD = 0.25;

function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}

export const resolveSession: RequestHandler = (req, res, next) => {
  void resolve(req, res)
    .then(() => next())
    .catch(next);
};

async function resolve(req: Request, res: Response): Promise<void> {
  const accountToken = readAccountSessionCookie(req);

  if (accountToken === undefined) {
    if (readProfileSessionCookie(req) !== undefined) {
      clearProfileSessionCookie(res);
    }
    return;
  }

  const account = await authRepository.findSessionByToken(accountToken);

  if (account === null || account.parentSessionId !== null || isExpired(account.expiresAt)) {
    clearAccountSessionCookie(res);
    clearProfileSessionCookie(res);
    return;
  }

  await renewIfNeeded(account.id, account.expiresAt);

  req.session = { accountUserId: account.userId, accountSessionId: account.id };

  const profileToken = readProfileSessionCookie(req);
  if (profileToken === undefined) return;

  const profile = await authRepository.findSessionByToken(profileToken);

  const valid =
    profile !== null &&

    profile.parentSessionId === account.id &&
    !isExpired(profile.expiresAt);

  if (!valid) {
    clearProfileSessionCookie(res);
    return;
  }

  await renewIfNeeded(profile.id, profile.expiresAt);

  req.session.profileSessionId = profile.id;
  req.session.actor =
    profile.childProfileId === null
      ? { familyRole: "PARENT", userId: profile.userId }
      : {
          familyRole: "CHILD",
          childProfileId: profile.childProfileId,
          parentId: profile.userId,
        };
}

async function renewIfNeeded(sessionId: string, expiresAt: Date): Promise<void> {
  const totalMs = PARENT_SESSION_DAYS * 86_400_000;
  const remaining = expiresAt.getTime() - Date.now();

  if (remaining > totalMs * RENEWAL_THRESHOLD) return;

  await authRepository.extendSession(sessionId, new Date(Date.now() + totalMs));
}

export const requireSession: RequestHandler = (req, _res, next) => {
  if (req.session?.actor === undefined) {
    next(new UnauthorizedError());
    return;
  }
  next();
};

export const requireAccount: RequestHandler = (req, _res, next) => {
  if (req.session === undefined) {
    next(new UnauthorizedError());
    return;
  }
  next();
};

export const markPublic: RequestHandler = (req, _res, next) => {
  req.isPublicRoute = true;
  next();
};

export const markAccountOnly: RequestHandler = (req, _res, next) => {
  req.isAccountOnlyRoute = true;
  next();
};

export const requireSessionUnlessPublic: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isPublicRoute === true) {
    next();
    return;
  }
  if (req.isAccountOnlyRoute === true) {
    requireAccount(req, res, next);
    return;
  }
  requireSession(req, res, next);
};

export const requireParent: RequestHandler = (req, _res, next) => {
  const actor = req.session?.actor;
  if (actor === undefined) {
    next(new UnauthorizedError());
    return;
  }
  if (actor.familyRole !== "PARENT") {
    next(new ForbiddenError());
    return;
  }
  next();
};

export const requireChild: RequestHandler = (req, _res, next) => {
  const actor = req.session?.actor;
  if (actor === undefined) {
    next(new UnauthorizedError());
    return;
  }
  if (actor.familyRole !== "CHILD") {
    next(new ForbiddenError());
    return;
  }
  next();
};

export function accountOf(req: Request): ResolvedSession {
  if (req.session === undefined) {
    throw new UnauthorizedError();
  }
  return req.session;
}

export function actorOf(req: Request): Actor {
  const actor = req.session?.actor;
  if (actor === undefined) {
    throw new UnauthorizedError();
  }
  return actor;
}

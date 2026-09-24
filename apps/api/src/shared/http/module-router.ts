import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { markAccountOnly, markPublic, requireSessionUnlessPublic } from "./session.js";

export interface ModuleRouter {
  readonly router: ExpressRouter;

  get(path: string, ...handlers: RequestHandler[]): void;
  post(path: string, ...handlers: RequestHandler[]): void;
  patch(path: string, ...handlers: RequestHandler[]): void;
  put(path: string, ...handlers: RequestHandler[]): void;
  delete(path: string, ...handlers: RequestHandler[]): void;

  publicGet(path: string, ...handlers: RequestHandler[]): void;
  publicPost(path: string, ...handlers: RequestHandler[]): void;

  accountGet(path: string, ...handlers: RequestHandler[]): void;
  accountPost(path: string, ...handlers: RequestHandler[]): void;
}

export type RouteLevel = "public" | "account";

export interface DeclaredRoute {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  level: RouteLevel;
}

const declaredRoutes: DeclaredRoute[] = [];

export function declaredRoutesOf(level: RouteLevel): DeclaredRoute[] {
  return declaredRoutes.filter((route) => route.level === level);
}

function record(method: DeclaredRoute["method"], path: string, level: RouteLevel): void {
  if (!declaredRoutes.some((route) => route.method === method && route.path === path)) {
    declaredRoutes.push({ method, path, level });
  }
}

export function moduleRouter(): ModuleRouter {
  const router = Router();

  const protectedChain = (handlers: RequestHandler[]): RequestHandler[] => [
    requireSessionUnlessPublic,
    ...handlers,
  ];

  const publicChain = (handlers: RequestHandler[]): RequestHandler[] => [
    markPublic,
    requireSessionUnlessPublic,
    ...handlers,
  ];

  const accountChain = (handlers: RequestHandler[]): RequestHandler[] => [
    markAccountOnly,
    requireSessionUnlessPublic,
    ...handlers,
  ];

  return {
    router,

    get: (path, ...handlers) => router.get(path, ...protectedChain(handlers)),
    post: (path, ...handlers) => router.post(path, ...protectedChain(handlers)),
    patch: (path, ...handlers) => router.patch(path, ...protectedChain(handlers)),
    put: (path, ...handlers) => router.put(path, ...protectedChain(handlers)),
    delete: (path, ...handlers) => router.delete(path, ...protectedChain(handlers)),

    publicGet: (path, ...handlers) => {
      record("GET", path, "public");
      router.get(path, ...publicChain(handlers));
    },
    publicPost: (path, ...handlers) => {
      record("POST", path, "public");
      router.post(path, ...publicChain(handlers));
    },

    accountGet: (path, ...handlers) => {
      record("GET", path, "account");
      router.get(path, ...accountChain(handlers));
    },
    accountPost: (path, ...handlers) => {
      record("POST", path, "account");
      router.post(path, ...accountChain(handlers));
    },
  };
}

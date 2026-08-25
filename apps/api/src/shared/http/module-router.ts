import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { markAccountOnly, markPublic, requireSessionUnlessPublic } from "./session.js";

/**
 * Router de módulo con la protección puesta.
 *
 * Toda ruta definida a través de este envoltorio lleva el guardián de sesión
 * intercalado ANTES de sus manejadores. Las públicas se declaran con los
 * métodos `public*`, que además del guardián insertan la marca que lo hace
 * pasar de largo.
 *
 * Es lo que hace literal que «las rutas nacen protegidas»: no se puede definir
 * una ruta por aquí y olvidarse de protegerla, porque el guardián no es algo
 * que se añada sino algo que ya está. Ver la decisión 5 del design de
 * `add-authentication`.
 *
 * El guardián va dentro de la cadena de cada ruta y no montado por delante del
 * router porque Express evalúa los middlewares de un router en orden: uno
 * montado después de las rutas nunca llegaría a ejecutarse, y uno montado antes
 * no sabría todavía si la ruta que va a resolverse es pública.
 */
export interface ModuleRouter {
  /** El router de Express, listo para montar. */
  readonly router: ExpressRouter;

  get(path: string, ...handlers: RequestHandler[]): void;
  post(path: string, ...handlers: RequestHandler[]): void;
  patch(path: string, ...handlers: RequestHandler[]): void;
  delete(path: string, ...handlers: RequestHandler[]): void;

  /** Rutas accesibles sin sesión. Se declaran una a una, a conciencia. */
  publicGet(path: string, ...handlers: RequestHandler[]): void;
  publicPost(path: string, ...handlers: RequestHandler[]): void;

  /**
   * Rutas que se conforman con la CUENTA acreditada, sin perfil elegido.
   *
   * Son las de la rejilla: listar perfiles y entrar a uno son justo los pasos
   * previos a ser alguien, así que no pueden exigir actor. Se declaran una a
   * una porque cada una es un hueco por el que se opera sin haber elegido
   * perfil.
   */
  accountGet(path: string, ...handlers: RequestHandler[]): void;
  accountPost(path: string, ...handlers: RequestHandler[]): void;
}

/** Nivel de protección con el que se declaró una ruta. */
export type RouteLevel = "public" | "account";

export interface DeclaredRoute {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  level: RouteLevel;
}

/**
 * Registro de las rutas que NO exigen actor.
 *
 * Existe para que «solo hay unas pocas rutas de solo cuenta» sea comprobable en
 * un test en vez de una frase en un documento, que es lo que se quedó
 * desactualizado en `CLAUDE.md` §5 sin que nadie se enterara.
 *
 * Se llena al importar cada archivo de rutas, una sola vez: los módulos de ESM
 * se evalúan una vez por proceso, así que llamar varias veces a `createApp()`
 * no duplica entradas.
 */
const declaredRoutes: DeclaredRoute[] = [];

/** Las rutas declaradas con un nivel concreto, en orden de declaración. */
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

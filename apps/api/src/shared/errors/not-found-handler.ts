import type { RequestHandler } from "express";
import { RouteNotFoundError } from "./domain-errors.js";

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new RouteNotFoundError());
};

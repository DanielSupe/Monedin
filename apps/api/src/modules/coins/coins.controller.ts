import { coinsParamsSchema, listCoinsQuerySchema, listOwnCoinsQuerySchema } from "@monedin/contracts";
import type { RequestHandler } from "express";
import { actorOf } from "../../shared/http/session.js";
import { validatedPart } from "../../shared/http/validate.js";
import * as service from "./coins.service.js";

export const handleOwnHistory: RequestHandler = async (req, res) => {
  const query = validatedPart(req, "query", listOwnCoinsQuerySchema);

  res.status(200).json(await service.listOwnHistory(actorOf(req), query));
};

export const handleChildHistory: RequestHandler = async (req, res) => {
  const { childId } = validatedPart(req, "params", coinsParamsSchema);
  const query = validatedPart(req, "query", listCoinsQuerySchema);

  res.status(200).json(await service.listChildHistory(actorOf(req), childId, query));
};

import {
  createRedemptionSchema,
  listOwnRedemptionsQuerySchema,
  listRedemptionsQuerySchema,
  redemptionParamsSchema,
} from "@monedin/contracts";
import type { RequestHandler } from "express";
import { actorOf } from "../../shared/http/session.js";
import { validatedPart } from "../../shared/http/validate.js";
import * as service from "./redemptions.service.js";

/**
 * Parseo y serialización. Cero autorización.
 *
 * Ni un `if` sobre el rol ni sobre la propiedad de un canje: eso lo decide el
 * servicio, con el actor. Las transiciones devuelven 200 con el canje
 * RESULTANTE, no 204: mismo argumento que `tasks`.
 */

export const handleCreate: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", createRedemptionSchema);

  res.status(201).json(await service.createRedemption(actorOf(req), input));
};

export const handleList: RequestHandler = async (req, res) => {
  const query = validatedPart(req, "query", listRedemptionsQuerySchema);

  res.status(200).json(await service.listRedemptions(actorOf(req), query));
};

export const handleDetail: RequestHandler = async (req, res) => {
  const { redemptionId } = validatedPart(req, "params", redemptionParamsSchema);

  res.status(200).json(await service.getRedemptionForActor(actorOf(req), redemptionId));
};

// ---------------------------------------------------------------------------
// Vista propia del niño
// ---------------------------------------------------------------------------

export const handleOwnList: RequestHandler = async (req, res) => {
  const query = validatedPart(req, "query", listOwnRedemptionsQuerySchema);

  res.status(200).json(await service.listOwnRedemptions(actorOf(req), query));
};

// ---------------------------------------------------------------------------
// Transiciones
// ---------------------------------------------------------------------------

export const handleApprove: RequestHandler = async (req, res) => {
  const { redemptionId } = validatedPart(req, "params", redemptionParamsSchema);

  res.status(200).json(await service.approveRedemption(actorOf(req), redemptionId));
};

export const handleReject: RequestHandler = async (req, res) => {
  const { redemptionId } = validatedPart(req, "params", redemptionParamsSchema);

  res.status(200).json(await service.rejectRedemption(actorOf(req), redemptionId));
};

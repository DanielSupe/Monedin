import {
  createRewardSchema,
  createUploadUrlSchema,
  listOwnRewardsQuerySchema,
  listRewardsQuerySchema,
  replaceAssignmentsSchema,
  rewardParamsSchema,
  updateRewardSchema,
} from "@monedin/contracts";
import type { RequestHandler } from "express";
import { actorOf } from "../../shared/http/session.js";
import { validatedPart } from "../../shared/http/validate.js";
import * as service from "./rewards.service.js";

/**
 * Parseo y serialización. Cero autorización.
 *
 * Ni un `if` sobre el rol ni sobre la propiedad de un premio: eso lo decide el
 * servicio, con el actor. Aquí solo se lee la petición y se le da forma a la
 * respuesta.
 */

export const handleCreate: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", createRewardSchema);

  res.status(201).json(await service.createReward(actorOf(req), input));
};

export const handleList: RequestHandler = async (req, res) => {
  const query = validatedPart(req, "query", listRewardsQuerySchema);

  res.status(200).json(await service.listRewards(actorOf(req), query));
};

export const handleDetail: RequestHandler = async (req, res) => {
  const { rewardId } = validatedPart(req, "params", rewardParamsSchema);

  res.status(200).json(await service.getRewardForActor(actorOf(req), rewardId));
};

export const handleUpdate: RequestHandler = async (req, res) => {
  const { rewardId } = validatedPart(req, "params", rewardParamsSchema);
  const input = validatedPart(req, "body", updateRewardSchema);

  res.status(200).json(await service.updateReward(actorOf(req), rewardId, input));
};

export const handleReplaceAssignments: RequestHandler = async (req, res) => {
  const { rewardId } = validatedPart(req, "params", rewardParamsSchema);
  const input = validatedPart(req, "body", replaceAssignmentsSchema);

  res.status(200).json(await service.replaceAssignments(actorOf(req), rewardId, input));
};

export const handleRetire: RequestHandler = async (req, res) => {
  const { rewardId } = validatedPart(req, "params", rewardParamsSchema);

  await service.retireReward(actorOf(req), rewardId);

  res.status(204).send();
};

// ---------------------------------------------------------------------------
// Escaparate propio del niño
// ---------------------------------------------------------------------------

export const handleOwnList: RequestHandler = async (req, res) => {
  const query = validatedPart(req, "query", listOwnRewardsQuerySchema);

  res.status(200).json(await service.listOwnRewards(actorOf(req), query));
};

export const handleImageUploadUrl: RequestHandler = async (req, res) => {
  const { rewardId } = validatedPart(req, "params", rewardParamsSchema);
  const { contentType } = validatedPart(req, "body", createUploadUrlSchema);

  res
    .status(200)
    .json(await service.requestRewardImageUploadUrl(actorOf(req), rewardId, contentType));
};

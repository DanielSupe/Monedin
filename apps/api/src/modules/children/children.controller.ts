import {
  childParamsSchema,
  createChildSchema,
  createUploadUrlSchema,
  listChildrenQuerySchema,
  updateChildSchema,
  updateOwnChildSchema,
} from "@monedin/contracts";
import type { RequestHandler } from "express";
import { accountOf, actorOf } from "../../shared/http/session.js";
import { validatedPart } from "../../shared/http/validate.js";
import * as service from "./children.service.js";

export const handleCreate: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", createChildSchema);
  const account = accountOf(req);

  const child = await service.createChild(account.accountUserId, account.actor, input);

  res.status(201).json(child);
};

export const handleList: RequestHandler = async (req, res) => {
  const query = validatedPart(req, "query", listChildrenQuerySchema);

  res.status(200).json(await service.listChildren(actorOf(req), query));
};

export const handleDetail: RequestHandler = async (req, res) => {
  const { childId } = validatedPart(req, "params", childParamsSchema);

  res.status(200).json(await service.getChild(actorOf(req), childId));
};

export const handleUpdate: RequestHandler = async (req, res) => {
  const { childId } = validatedPart(req, "params", childParamsSchema);
  const input = validatedPart(req, "body", updateChildSchema);

  res.status(200).json(await service.updateChild(actorOf(req), childId, input));
};

export const handleDeactivate: RequestHandler = async (req, res) => {
  const { childId } = validatedPart(req, "params", childParamsSchema);

  await service.deactivateChild(actorOf(req), childId);

  res.status(204).send();
};

export const handleOwnDetail: RequestHandler = async (req, res) => {
  res.status(200).json(await service.getOwnChild(actorOf(req)));
};

export const handleOwnUpdate: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", updateOwnChildSchema);

  res.status(200).json(await service.updateOwnAvatar(actorOf(req), input));
};

export const handleOwnAvatarUploadUrl: RequestHandler = async (req, res) => {
  const { contentType } = validatedPart(req, "body", createUploadUrlSchema);

  res.status(200).json(await service.requestOwnAvatarUploadUrl(actorOf(req), contentType));
};

export const handleAvatarUploadUrl: RequestHandler = async (req, res) => {
  const { childId } = validatedPart(req, "params", childParamsSchema);
  const { contentType } = validatedPart(req, "body", createUploadUrlSchema);

  res.status(200).json(await service.requestAvatarUploadUrl(actorOf(req), childId, contentType));
};

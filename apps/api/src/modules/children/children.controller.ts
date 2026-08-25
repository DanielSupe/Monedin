import {
  childParamsSchema,
  createChildSchema,
  listChildrenQuerySchema,
  updateChildSchema,
  updateOwnChildSchema,
} from "@monedin/contracts";
import type { RequestHandler } from "express";
import { accountOf, actorOf } from "../../shared/http/session.js";
import { validatedPart } from "../../shared/http/validate.js";
import * as service from "./children.service.js";

/**
 * Parseo y serialización. Cero autorización.
 *
 * Ni un `if` sobre el rol ni sobre la propiedad de un recurso: eso lo decide el
 * servicio, con el actor. Aquí solo se lee la petición y se le da forma a la
 * respuesta.
 */

export const handleCreate: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", createChildSchema);
  const account = accountOf(req);

  // Ruta de solo cuenta: puede que todavía no haya nadie dentro. Se le pasa al
  // servicio quién opera —si es que hay alguien— para que decida.
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

// ---------------------------------------------------------------------------
// Vista propia del niño
// ---------------------------------------------------------------------------

export const handleOwnDetail: RequestHandler = async (req, res) => {
  res.status(200).json(await service.getOwnChild(actorOf(req)));
};

export const handleOwnUpdate: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", updateOwnChildSchema);

  res.status(200).json(await service.updateOwnAvatar(actorOf(req), input));
};

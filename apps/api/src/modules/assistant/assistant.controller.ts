import { askAssistantSchema } from "@monedin/contracts";
import type { RequestHandler } from "express";
import { actorOf } from "../../shared/http/session.js";
import { validatedPart } from "../../shared/http/validate.js";
import * as service from "./assistant.service.js";

export const handleAsk: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", askAssistantSchema);

  res.status(200).json(await service.ask(actorOf(req), input));
};

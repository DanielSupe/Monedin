import { askAssistantSchema } from "@monedin/contracts";
import type { RequestHandler } from "express";
import { actorOf } from "../../shared/http/session.js";
import { validatedPart } from "../../shared/http/validate.js";
import * as service from "./assistant.service.js";

/**
 * Parsea y serializa. CERO autorizacion.
 *
 * El actor se LEE del middleware y se le pasa al servicio; aqui no hay ni un
 * `if` sobre el rol. El serializador es SINCRONO, a diferencia de los de los
 * otros cuatro modulos: no hay ninguna URL de S3 que firmar porque lo que se
 * devuelve es texto.
 */

export const handleAsk: RequestHandler = async (req, res) => {
  const input = validatedPart(req, "body", askAssistantSchema);

  res.status(200).json(await service.ask(actorOf(req), input));
};

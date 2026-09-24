import { askAssistantSchema } from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./assistant.controller.js";

const assistant = moduleRouter();

export const assistantRouter: ExpressRouter = assistant.router;

assistant.post("/assistant/ask", validate({ body: askAssistantSchema }), controller.handleAsk);

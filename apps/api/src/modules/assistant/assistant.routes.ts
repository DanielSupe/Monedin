import { askAssistantSchema } from "@monedin/contracts";
import type { Router as ExpressRouter } from "express";
import { moduleRouter } from "../../shared/http/module-router.js";
import { validate } from "../../shared/http/validate.js";
import * as controller from "./assistant.controller.js";

/**
 * Monta la ruta. CERO logica.
 *
 * UNA ruta para los DOS roles, sin `requireParent` ni `requireChild`: la rama
 * por rol vive en el SERVICIO, que es la decision que ya tomo
 * `PATCH /auth/tutorial`. Los dos filtros gruesos existen para acotar quien
 * puede llamar; aqui pueden llamar los dos, y lo que cambia entre ellos es que
 * datos se cargan, que es negocio.
 *
 * Sigue siendo una ruta NORMAL: exige actor. No es publica ni de solo cuenta, y
 * la lista cerrada de rutas de solo cuenta —hoy cinco, con su test— no se toca.
 * Sin saber quien esta operando no hay contexto que cargar, asi que la cookie de
 * cuenta no basta: es justo lo que impide preguntar por una familia desde la
 * rejilla de perfiles.
 *
 * `ask` y no `messages`: no hay coleccion que crear porque no se persiste nada,
 * y un nombre de recurso mentiria sobre lo que hay detras.
 */
const assistant = moduleRouter();

export const assistantRouter: ExpressRouter = assistant.router;

assistant.post("/assistant/ask", validate({ body: askAssistantSchema }), controller.handleAsk);

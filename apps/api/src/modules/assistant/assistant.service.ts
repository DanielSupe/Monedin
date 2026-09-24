import type { AskAssistantInput, AssistantAnswer, AssistantTurn } from "@monedin/contracts";
import { getAiProvider } from "../../shared/ai/index.js";
import { AiProviderError, type AiTurn } from "../../shared/ai/provider.js";
import type { Actor } from "../../shared/actor.js";
import { NotFoundError } from "../../shared/errors/domain-errors.js";
import { logger } from "../../shared/logger/index.js";
import { AssistantUnavailableError } from "./assistant.errors.js";
import { CHILD_SYSTEM_PROMPT, PARENT_SYSTEM_PROMPT } from "./assistant.prompts.js";
import * as repository from "./assistant.repository.js";
import type {
  ChildContextRow,
  ContextLimits,
  ParentContextRow,
} from "./assistant.repository.js";

const ASSISTANT_CONTEXT_LIMITS: ContextLimits = {
  tasks: 20,
  rewards: 20,
  redemptions: 10,
  movements: 10,
};

export async function ask(actor: Actor, input: AskAssistantInput): Promise<AssistantAnswer> {
  const system =
    actor.familyRole === "PARENT"
      ? await guionDePadre(actor.userId)
      : await guionDeNino(actor.childProfileId);

  return { answer: await preguntar(system, input) };
}

async function guionDePadre(userId: string): Promise<string> {
  const contexto = await repository.findParentContext(userId, ASSISTANT_CONTEXT_LIMITS);

  if (contexto === null) {
    throw new NotFoundError();
  }

  return `${PARENT_SYSTEM_PROMPT}\n\n${renderParentContext(contexto)}`;
}

async function guionDeNino(childProfileId: string): Promise<string> {
  const contexto = await repository.findChildContext(childProfileId, ASSISTANT_CONTEXT_LIMITS);

  if (contexto === null) {
    throw new NotFoundError();
  }

  return `${CHILD_SYSTEM_PROMPT}\n\n${renderChildContext(contexto)}`;
}

async function preguntar(system: string, input: AskAssistantInput): Promise<string> {
  try {
    const completion = await getAiProvider().complete({
      system,
      history: input.history.map(toAiTurn),
      question: input.question,
    });

    return completion.text;
  } catch (error) {
    if (error instanceof AiProviderError) {
      logger.warn("El asistente no pudo responder", {
        reason: error.reason,
        status: error.status,
      });
      throw new AssistantUnavailableError();
    }

    throw error;
  }
}

function toAiTurn(turn: AssistantTurn): AiTurn {
  return { role: turn.role === "assistant" ? "model" : "user", text: turn.text };
}

function renderChildContext(contexto: ChildContextRow): string {
  const lineas = [
    "--- LO QUE SABES DE QUIEN TE PREGUNTA ---",
    `Se llama ${contexto.name}.`,
    contexto.age === null ? null : `Tiene ${String(contexto.age)} años.`,
    `Tiene ${String(contexto.coins)} monedas ahora mismo.`,
    "",
    "SUS TAREAS:",
    ...listaOVacio(
      contexto.tasks.map(
        (tarea) => `- "${tarea.title}", vale ${String(tarea.coins)} monedas, ${estadoTarea(tarea.status)}`,
      ),
      "  (todavía no tiene tareas)",
    ),
    "",
    "LOS PREMIOS QUE LE OFRECEN, CON SU PRECIO:",
    ...listaOVacio(
      contexto.rewards.map(
        (premio) =>
          `- "${premio.title}", cuesta ${String(premio.coins)} monedas` +
          (premio.description === null ? "" : ` (${premio.description})`),
      ),
      "  (todavía no le ofrecen ningún premio)",
    ),
    "",
    "SUS PEDIDOS DE PREMIOS:",
    ...listaOVacio(
      contexto.redemptions.map(
        (canje) =>
          `- "${canje.rewardTitle}", ${String(canje.coins)} monedas, ${estadoCanje(canje.status)}`,
      ),
      "  (todavía no ha pedido ningún premio)",
    ),
    "",
    "SUS ÚLTIMOS MOVIMIENTOS DE MONEDAS:",
    ...listaOVacio(
      contexto.movements.map(
        (mov) =>
          `- ${mov.amount > 0 ? "+" : ""}${String(mov.amount)} monedas, ${motivo(mov.reason)}`,
      ),
      "  (todavía no ha ganado ni gastado monedas)",
    ),
    "",
    "No sabes nada más. En particular, no sabes nada de sus hermanos.",
  ];

  return lineas.filter((linea) => linea !== null).join("\n");
}

function renderParentContext(contexto: ParentContextRow): string {
  const lineas = [
    "--- LO QUE SABES DE QUIEN TE PREGUNTA ---",
    `Se llama ${contexto.name} y administra esta familia.`,
    "",
    "SUS HIJOS:",
    ...listaOVacio(
      contexto.children.map(
        (hijo) =>
          `- ${hijo.name}` +
          (hijo.age === null ? "" : `, ${String(hijo.age)} años`) +
          `, ${String(hijo.coins)} monedas` +
          `, ${String(hijo.pendingTasks)} tareas por hacer`,
      ),
      "  (todavía no ha creado ningún perfil)",
    ),
    "",
    "TAREAS ESPERANDO SU APROBACIÓN (aprobar es lo que paga las monedas):",
    ...listaOVacio(
      contexto.pendingApproval.map(
        (tarea) => `- ${tarea.childName}: "${tarea.title}", ${String(tarea.coins)} monedas`,
      ),
      "  (no hay ninguna esperando)",
    ),
    "",
    "SUS PREMIOS PUBLICADOS:",
    ...listaOVacio(
      contexto.rewards.map(
        (premio) => `- "${premio.title}", ofrecido a ${String(premio.offers)} hijos`,
      ),
      "  (todavía no ha publicado ningún premio)",
    ),
    "",
    "CANJES ESPERANDO SU APROBACIÓN (aprobar es lo que descuenta las monedas):",
    ...listaOVacio(
      contexto.pendingRedemptions.map(
        (canje) =>
          `- ${canje.childName} pidió "${canje.rewardTitle}", ${String(canje.coins)} monedas`,
      ),
      "  (no hay ninguno esperando)",
    ),
    "",
    "No sabes nada más, y nada de ninguna otra familia.",
  ];

  return lineas.join("\n");
}

function listaOVacio(filas: string[], vacio: string): string[] {
  return filas.length === 0 ? [vacio] : filas;
}

function estadoTarea(status: string): string {
  if (status === "PENDING") return "todavía está sin hacer";
  if (status === "COMPLETED") return "ya la marcó y está esperando revisión";
  return "ya está aprobada y pagada";
}

function estadoCanje(status: string): string {
  if (status === "PENDING") return "esperando respuesta";
  if (status === "APPROVED") return "aprobado";
  return "rechazado";
}

function motivo(reason: string): string {
  if (reason === "TASK_APPROVED") return "por una tarea aprobada";
  if (reason === "REDEMPTION_APPROVED") return "por un premio canjeado";
  return "por un ajuste de un adulto";
}

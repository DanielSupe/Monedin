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

/**
 * Reglas de negocio Y autorización del asistente.
 *
 * La autorización aquí no es una comprobación sino una FORMA: el contexto se
 * carga desde el actor y la petición no tiene ningún identificador, así que no
 * existe el parámetro con el que se apuntaría a otra persona. Es el mismo
 * mecanismo que `GET /children/me/coins`.
 *
 * Y este servicio no escribe nada. Ni una fila, ni una transición, ni una
 * moneda. Eso es lo que hace cierto —y no una promesa del prompt— que una
 * inyección lograda no pueda hacer más daño que decir una frase equivocada.
 */

/**
 * Cuánto contexto cabe.
 *
 * LOCAL a propósito, no en `constants/domain.ts`: el front no lo necesita y no
 * es un límite de negocio —excederlo no descuadra nada—, es cuánto texto cabe
 * en un prompt. Mismo criterio de sitio que `RENEWAL_THRESHOLD` en
 * `shared/http/session.ts` o `MOVEMENT_FIELDS` en `coins.repository.ts`.
 *
 * Son números de ARRANQUE, no medidos. Se ajustan abriendo la aplicación y
 * mirando qué le falta a Monedín para responder bien, no con un test.
 */
const ASSISTANT_CONTEXT_LIMITS: ContextLimits = {
  tasks: 20,
  rewards: 20,
  redemptions: 10,
  movements: 10,
};

/**
 * Responde una pregunta con el contexto de quien la hace.
 *
 * La rama por rol vive AQUÍ y no en la ruta, que es la decisión que ya tomó
 * `PATCH /auth/tutorial`: lo que cambia entre un padre y un niño no es quién
 * puede llamar —pueden los dos— sino qué datos se cargan y con qué guion, y eso
 * es negocio.
 */
export async function ask(actor: Actor, input: AskAssistantInput): Promise<AssistantAnswer> {
  const system =
    actor.familyRole === "PARENT"
      ? await guionDePadre(actor.userId)
      : await guionDeNino(actor.childProfileId);

  return { answer: await preguntar(system, input) };
}

async function guionDePadre(userId: string): Promise<string> {
  const contexto = await repository.findParentContext(userId, ASSISTANT_CONTEXT_LIMITS);

  // Un actor cuya cuenta ya no existe: la sesión se adelantó al borrado.
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

/**
 * La llamada al proveedor, y la traducción de su fallo.
 *
 * El `AiProviderError` se convierte en error de dominio AQUÍ, antes de que
 * llegue al `errorHandler`. No es un detalle: la rama del `errorHandler` que
 * atiende lo no controlado imprime `message` y `stack`, y esa es exactamente la
 * que no queremos que vea nada que venga del proveedor.
 *
 * `warn` y no `error`: que Google esté saturado o haya agotado su cuota no es
 * una incidencia nuestra, y registrarlo como error enseña a ignorar los errores.
 * Y se compone a mano con dos campos elegidos, en vez de volcar el error
 * entero, porque el logger de este proyecto no enmascara nada en ejecución.
 */
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

    // Cualquier otra cosa es un fallo NUESTRO y sube tal cual: será un 500, y
    // eso es lo correcto, porque sí hay algo que investigar.
    throw error;
  }
}

/** Del vocabulario del producto al del proveedor. En un solo sitio. */
function toAiTurn(turn: AssistantTurn): AiTurn {
  return { role: turn.role === "assistant" ? "model" : "user", text: turn.text };
}

/*
 * El contexto se renderiza a texto plano ETIQUETADO, no a JSON.
 *
 * Un modelo lee mejor «Mateo, 8 años, 120 monedas» que un objeto anidado, y
 * sobre todo: un JSON invita a que alguien meta ahí un identificador «por si
 * acaso». Lo que se escribe a mano es lo que se decidió escribir.
 */

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

/** Una lista vacía se dice explícitamente: si no, el modelo se la inventa. */
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

import { randomUUID } from "node:crypto";
import {
  type CreateTaskInput,
  type ListOwnTasksQuery,
  type ListTasksQuery,
  type OwnTask,
  type Page,
  type Task,
  type TaskBatch,
  type UpdateTaskInput,
  normalizeCoinsPerChild,
  type CompleteTaskInput,
  type ImageContentType,
  type UploadUrl,
} from "@monedin/contracts";
import type { Actor } from "../../shared/actor.js";
import { resolveAvatarForResponse, resolveImageForResponse } from "../../shared/avatar/resolve-avatar.js";
import {
  extensionForContentType,
  getStorageProvider,
  isConfirmableUpload,
} from "../../shared/storage/index.js";
import { toPage, toSkipTake } from "../../shared/pagination.js";
// El hijo ajeno, el inexistente y el dado de baja son el mismo error que ya
// tiene `children`, con el mismo texto. Definir aquí un segundo error para
// decir lo mismo dejaría dos redacciones que se despegarían a la primera
// reescritura.
import { ChildNotFoundError } from "../children/children.errors.js";
import {
  ChildRoleRequiredError,
  InvalidEvidenceUploadError,
  ParentRoleRequiredError,
  TaskNotEditableError,
  TaskNotFoundError,
} from "./tasks.errors.js";
import * as repository from "./tasks.repository.js";
import type { OwnTaskRow, TaskRow } from "./tasks.repository.js";

/**
 * Reglas de negocio Y autorización de las tareas.
 *
 * `requireParent` y `requireChild` filtran el rol antes de llegar aquí, pero
 * son filtros GRUESOS: que alguien sea padre no dice si la tarea es suya. Eso
 * se comprueba en cada método, y por eso el actor es un parámetro obligatorio.
 *
 * El reparto de responsabilidades con el repositorio:
 *
 *   - Aquí se decide QUIÉN puede operar y sobre QUÉ. Lo que no es tuyo es 404.
 *   - Allí se decide si la transición encontró el estado del que partía. Eso
 *     es 409, porque la tarea existe y lo que no encaja es su momento.
 */

// ---------------------------------------------------------------------------
// Alta
// ---------------------------------------------------------------------------

/**
 * Reparte una tarea entre uno o varios hijos. Una fila por hijo.
 *
 * Es TODO O NADA: se comprueban todos los hijos antes de crear ninguna tarea.
 * Un reparto a medias es peor que uno fallido, porque el padre creería que sus
 * tres hijos la tienen cuando solo la tienen dos y nada se lo diría.
 */
export async function createBatch(actor: Actor, input: CreateTaskInput): Promise<Task[]> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const assignments = normalizeCoinsPerChild(input);
  const childIds = assignments.map((assignment) => assignment.childId);

  // Una sola consulta para los hijos del reparto entero. Si falta uno, no se
  // crea nada: ni siquiera las tareas de los que sí son suyos.
  const owned = new Set(await repository.findChildIdsOwnedBy(actor.userId, childIds));
  if (childIds.some((childId) => !owned.has(childId))) {
    throw new ChildNotFoundError();
  }

  const rows = await repository.createBatch({
    parentId: actor.userId,
    // El identificador del reparto se genera ANTES de insertar, porque todas
    // las filas tienen que compartirlo.
    batchId: randomUUID(),
    title: input.title,
    assignments,
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.dueDate === undefined ? {} : { dueDate: new Date(input.dueDate) }),
  });

  return Promise.all(rows.map(toTask));
}


// ---------------------------------------------------------------------------
// Lecturas del padre
// ---------------------------------------------------------------------------

/**
 * Las tareas del padre, AGRUPADAS POR REPARTO y paginadas por reparto.
 *
 * El repositorio devuelve los repartos de la página en orden y todas sus
 * tareas; aquí solo se juntan. Que la unidad sea el reparto es lo que impide
 * que uno se parta entre dos páginas.
 */
export async function listBatches(
  actor: Actor,
  query: ListTasksQuery,
): Promise<Page<TaskBatch>> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const result = await repository.findTaskBatchesPage(
    actor.userId,
    {
      ...(query.status === undefined ? {} : { status: query.status }),
      ...(query.childId === undefined ? {} : { childId: query.childId }),
    },
    toSkipTake(query),
  );

  const porReparto = new Map<string, TaskRow[]>();
  for (const row of result.tasks) {
    const grupo = porReparto.get(row.batchId);
    if (grupo === undefined) {
      porReparto.set(row.batchId, [row]);
    } else {
      grupo.push(row);
    }
  }

  const items = result.batches.flatMap(({ batchId }) => {
    const rows = porReparto.get(batchId) ?? [];
    const [primera] = rows;

    // Inalcanzable: un reparto está en la lista porque tiene filas.
    if (primera === undefined) return [];

    return [
      {
        batchId,
        // Cabecera representativa, no autoritativa: si el padre editó una de
        // las hermanas, la suya manda dentro de su fila.
        title: primera.title,
        description: primera.description,
        dueDate: primera.dueDate?.toISOString() ?? null,
        createdAt: primera.createdAt.toISOString(),
        tasks: rows.map(toTask),
      },
    ];
  });

  // Cada reparto trae sus tareas a medio serializar: se resuelven todas juntas,
  // no una por una, para no encadenar una firma detrás de otra.
  const resueltos = await Promise.all(
    items.map(async (batch) => ({ ...batch, tasks: await Promise.all(batch.tasks) })),
  );

  return toPage(query, { items: resueltos, total: result.total });
}

export async function getTask(actor: Actor, taskId: string): Promise<Task> {
  return toTask(await ownedTask(actor, taskId));
}

/**
 * El detalle de una tarea, para quien sea que la pida.
 *
 * `GET /tasks/:taskId` es la única ruta del módulo que sirve a los dos roles, y
 * la rama por rol vive AQUÍ y no en el controlador: un `if` sobre el rol en la
 * capa de HTTP estaría en el sitio equivocado. Cada rama devuelve la vista que
 * le corresponde, y las dos acaban en 404 sobre lo que no es suyo.
 */
export async function getTaskForActor(actor: Actor, taskId: string): Promise<Task | OwnTask> {
  return actor.familyRole === "PARENT"
    ? getTask(actor, taskId)
    : getOwnTask(actor, taskId);
}

// ---------------------------------------------------------------------------
// Lecturas del niño
// ---------------------------------------------------------------------------

export async function listOwnTasks(
  actor: Actor,
  query: ListOwnTasksQuery,
): Promise<Page<OwnTask>> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

  // El perfil sale del ACTOR y nunca de la petición: es lo que hace cierto por
  // construcción que un niño no vea a sus hermanos.
  const result = await repository.findOwnTasksPage(
    actor.childProfileId,
    { ...(query.status === undefined ? {} : { status: query.status }) },
    toSkipTake(query),
  );

  return toPage(query, {
    items: await Promise.all(result.items.map(toOwnTask)),
    total: result.total,
  });
}

export async function getOwnTask(actor: Actor, taskId: string): Promise<OwnTask> {
  return toOwnTask(await ownTask(actor, taskId));
}

// ---------------------------------------------------------------------------
// Edición y borrado
// ---------------------------------------------------------------------------

/**
 * Cambia una tarea, solo mientras siga pendiente.
 *
 * Que el padre pueda cambiar el valor de una pendiente se acepta: nadie ha
 * hecho nada todavía. Lo que no se permite es cambiarla una vez marcada, que es
 * cuando el niño ya trabajó por ese número.
 */
export async function updateTask(
  actor: Actor,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const found = await ownedTask(actor, taskId);

  const updated = await repository.updateTaskIfPending(found.id, {
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.coins === undefined ? {} : { coins: input.coins }),
    ...(input.dueDate === undefined
      ? {}
      : { dueDate: input.dueDate === null ? null : new Date(input.dueDate) }),
  });

  // Cero filas con la tarea delante significa que ya no está pendiente. Es 409
  // y no 404: la tarea sigue ahí, lo que no encaja es su estado.
  if (updated === null) {
    throw new TaskNotEditableError();
  }

  return toTask(updated);
}

export async function deleteTask(actor: Actor, taskId: string): Promise<void> {
  const found = await ownedTask(actor, taskId);

  if ((await repository.deleteTaskIfPending(found.id)) !== 1) {
    throw new TaskNotEditableError();
  }
}

// ---------------------------------------------------------------------------
// Transiciones
// ---------------------------------------------------------------------------

/**
 * El niño marca como hecha una tarea suya que estaba pendiente, adjuntando
 * opcionalmente una foto como evidencia.
 *
 * La evidencia se valida ANTES de transicionar: si la clave no es de esta tarea
 * o el archivo no llegó a subirse, la tarea SIGUE PENDIENTE. Es preferible que
 * el niño lo reintente a dejarla marcada con una foto que no está.
 */
export async function completeTask(
  actor: Actor,
  taskId: string,
  input: CompleteTaskInput = {},
): Promise<OwnTask> {
  const found = await ownTask(actor, taskId);

  const evidence =
    input.evidenceUploadKey === undefined
      ? {}
      : { evidenceKey: await confirmedEvidenceKey(found.id, input.evidenceUploadKey) };

  return toOwnTask(await repository.transition(found.id, "PENDING", "COMPLETED", evidence));
}

/**
 * Una URL para que el niño suba la evidencia de una tarea suya.
 *
 * Solo mientras siga PENDIENTE: lo que se enseña es el trabajo antes de
 * declararlo hecho, no después de que su padre lo resolviera.
 */
export async function requestEvidenceUploadUrl(
  actor: Actor,
  taskId: string,
  contentType: ImageContentType,
): Promise<UploadUrl> {
  const found = await ownTask(actor, taskId);

  if (found.status !== "PENDING") {
    throw new TaskNotEditableError();
  }

  const key = `${evidencePrefix(found.id)}${randomUUID()}.${extensionForContentType(contentType)}`;

  const { uploadUrl, expiresAt } = await getStorageProvider().createUploadUrl({ key, contentType });

  return { uploadUrl, key, expiresAt: expiresAt.toISOString() };
}

function evidencePrefix(taskId: string): string {
  return `tasks/${taskId}/evidence/`;
}

async function confirmedEvidenceKey(taskId: string, key: string): Promise<string> {
  if (!(await isConfirmableUpload(getStorageProvider(), key, evidencePrefix(taskId)))) {
    throw new InvalidEvidenceUploadError();
  }

  return key;
}

/**
 * El padre aprueba una tarea marcada, lo que ACREDITA sus monedas.
 *
 * El valor se lee antes de abrir la transacción, y no hay carrera: editar una
 * tarea solo se permite en `PENDING` y aprobar exige `COMPLETED`, así que nadie
 * puede cambiar el número entre una cosa y la otra.
 */
export async function approveTask(actor: Actor, taskId: string): Promise<Task> {
  const found = await ownedTask(actor, taskId);

  return toTask(await repository.approve(found.id, found.child.id, found.coins));
}

/** Rechazar devuelve la tarea a pendiente. No mueve monedas. */
export async function rejectTask(actor: Actor, taskId: string): Promise<Task> {
  const found = await ownedTask(actor, taskId);

  return toTask(await repository.transition(found.id, "COMPLETED", "PENDING"));
}

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

/**
 * La tarea indicada, si es de este padre.
 *
 * Inexistente y de otra familia lanzan el MISMO error. Distinguirlos con un 403
 * confirmaría que esa tarea existe.
 */
async function ownedTask(actor: Actor, taskId: string): Promise<TaskRow> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const found = await repository.findTaskById(taskId);
  if (found === null || found.parentId !== actor.userId) {
    throw new TaskNotFoundError();
  }

  return found;
}

/**
 * La tarea indicada, si es del propio niño que llama.
 *
 * La de un hermano da el mismo 404 que una inexistente: el niño no debe poder
 * deducir ni que existe ni de quién es.
 */
async function ownTask(actor: Actor, taskId: string): Promise<TaskRow> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

  const found = await repository.findTaskById(taskId);
  if (found === null || found.child.id !== actor.childProfileId) {
    throw new TaskNotFoundError();
  }

  return found;
}

/** Una tarea para el padre: con su hijo, sin `parentId`. */
async function toTask(row: TaskRow): Promise<Task> {
  const storage = getStorageProvider();

  return {
    id: row.id,
    batchId: row.batchId,
    title: row.title,
    description: row.description,
    coins: row.coins,
    status: row.status,
    dueDate: row.dueDate?.toISOString() ?? null,
    // El padre ve la evidencia ANTES de aprobar o rechazar: para eso está.
    evidence: await resolveImageForResponse(storage, row.evidenceKey),
    child: {
      id: row.child.id,
      name: row.child.name,
      // Resuelto siempre, para que el front no trate el caso vacío.
      avatar: await resolveAvatarForResponse(storage, row.child.avatar),
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Una tarea para el niño: sin el hijo, porque es él, y sin el reparto. */
async function toOwnTask(row: OwnTaskRow): Promise<OwnTask> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coins: row.coins,
    status: row.status,
    dueDate: row.dueDate?.toISOString() ?? null,
    evidence: await resolveImageForResponse(getStorageProvider(), row.evidenceKey),
    createdAt: row.createdAt.toISOString(),
  };
}

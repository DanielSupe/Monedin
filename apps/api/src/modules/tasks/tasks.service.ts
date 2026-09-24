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

export async function createBatch(actor: Actor, input: CreateTaskInput): Promise<Task[]> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  const assignments = normalizeCoinsPerChild(input);
  const childIds = assignments.map((assignment) => assignment.childId);

  const owned = new Set(await repository.findChildIdsOwnedBy(actor.userId, childIds));
  if (childIds.some((childId) => !owned.has(childId))) {
    throw new ChildNotFoundError();
  }

  const rows = await repository.createBatch({
    parentId: actor.userId,

    batchId: randomUUID(),
    title: input.title,
    assignments,
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.dueDate === undefined ? {} : { dueDate: new Date(input.dueDate) }),
  });

  return Promise.all(rows.map(toTask));
}

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

    if (primera === undefined) return [];

    return [
      {
        batchId,

        title: primera.title,
        description: primera.description,
        dueDate: primera.dueDate?.toISOString() ?? null,
        createdAt: primera.createdAt.toISOString(),
        tasks: rows.map(toTask),
      },
    ];
  });

  const resueltos = await Promise.all(
    items.map(async (batch) => ({ ...batch, tasks: await Promise.all(batch.tasks) })),
  );

  return toPage(query, { items: resueltos, total: result.total });
}

export async function getTask(actor: Actor, taskId: string): Promise<Task> {
  return toTask(await ownedTask(actor, taskId));
}

export async function getTaskForActor(actor: Actor, taskId: string): Promise<Task | OwnTask> {
  return actor.familyRole === "PARENT"
    ? getTask(actor, taskId)
    : getOwnTask(actor, taskId);
}

export async function listOwnTasks(
  actor: Actor,
  query: ListOwnTasksQuery,
): Promise<Page<OwnTask>> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

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

export async function approveTask(actor: Actor, taskId: string): Promise<Task> {
  const found = await ownedTask(actor, taskId);

  return toTask(await repository.approve(found.id, found.child.id, found.coins));
}

export async function rejectTask(actor: Actor, taskId: string): Promise<Task> {
  const found = await ownedTask(actor, taskId);

  return toTask(await repository.transition(found.id, "COMPLETED", "PENDING"));
}

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

    evidence: await resolveImageForResponse(storage, row.evidenceKey),
    child: {
      id: row.child.id,
      name: row.child.name,

      avatar: await resolveAvatarForResponse(storage, row.child.avatar),
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

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

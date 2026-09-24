import { z } from "zod";
import {
  DESCRIPTION_MAX_LENGTH,
  TASK_STATUSES,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
} from "../constants/domain.js";
import { avatarValueSchema } from "./avatar.js";
import {
  childIdSchema,
  coinsAmountSchema,
  coinsPerChildAssignmentSchema,
  coinsPerChildFields,
  withCoinsPerChildRules,
} from "./coins-per-child.js";
import { pageOf, paginationQuerySchema } from "./pagination.js";
import { uploadKeySchema } from "./uploads.js";

export const taskStatusSchema = z.enum(TASK_STATUSES);

export const taskTitleSchema = z
  .string()
  .trim()
  .min(TITLE_MIN_LENGTH, "El título es demasiado corto.")
  .max(TITLE_MAX_LENGTH, "El título es demasiado largo.");

export const taskDescriptionSchema = z
  .string()
  .trim()
  .max(DESCRIPTION_MAX_LENGTH, "La descripción es demasiado larga.");

export const taskCoinsSchema = coinsAmountSchema;

export const taskDueDateSchema = z
  .string()
  .datetime({ offset: true, message: "La fecha límite no es una fecha válida." });

export const taskAssignmentSchema = coinsPerChildAssignmentSchema;

export type TaskAssignmentInput = z.infer<typeof taskAssignmentSchema>;

export const createTaskSchema = withCoinsPerChildRules(
  z
    .object({
      title: taskTitleSchema,
      description: taskDescriptionSchema.optional(),
      dueDate: taskDueDateSchema.optional(),
      ...coinsPerChildFields,
    })
    .strict(),
);

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    title: taskTitleSchema.optional(),
    description: taskDescriptionSchema.nullable().optional(),
    coins: taskCoinsSchema.optional(),
    dueDate: taskDueDateSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No hay nada que cambiar.",
  });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const completeTaskSchema = z
  .object({
    evidenceUploadKey: uploadKeySchema.optional(),
  })
  .strict()

  .default({});

export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;

export const taskParamsSchema = z
  .object({
    taskId: z.string().min(1, "Falta el identificador de la tarea."),
  })
  .strict();

export type TaskParams = z.infer<typeof taskParamsSchema>;

export const listTasksQuerySchema = paginationQuerySchema
  .extend({
    status: taskStatusSchema.optional(),
    childId: childIdSchema.optional(),
  })
  .strict();

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

export const listOwnTasksQuerySchema = paginationQuerySchema
  .extend({
    status: taskStatusSchema.optional(),
  })
  .strict();

export type ListOwnTasksQuery = z.infer<typeof listOwnTasksQuerySchema>;

export const taskChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: avatarValueSchema,
});

export type TaskChild = z.infer<typeof taskChildSchema>;

export const taskSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  coins: z.number().int(),
  status: taskStatusSchema,
  dueDate: z.string().datetime().nullable(),

  evidence: z.string().url().nullable(),
  child: taskChildSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Task = z.infer<typeof taskSchema>;

export const createdTasksSchema = z.array(taskSchema);
export type CreatedTasks = z.infer<typeof createdTasksSchema>;

export const taskBatchSchema = z.object({
  batchId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  dueDate: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  tasks: z.array(taskSchema),
});

export type TaskBatch = z.infer<typeof taskBatchSchema>;

export const taskBatchesPageSchema = pageOf(taskBatchSchema);
export type TaskBatchesPage = z.infer<typeof taskBatchesPageSchema>;

export const ownTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  coins: z.number().int(),
  status: taskStatusSchema,
  dueDate: z.string().datetime().nullable(),
  evidence: z.string().url().nullable(),
  createdAt: z.string().datetime(),
});

export type OwnTask = z.infer<typeof ownTaskSchema>;

export const ownTasksPageSchema = pageOf(ownTaskSchema);
export type OwnTasksPage = z.infer<typeof ownTasksPageSchema>;

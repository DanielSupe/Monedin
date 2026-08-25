import { z } from "zod";
import {
  COINS_MAX,
  COINS_MIN,
  DESCRIPTION_MAX_LENGTH,
  TASK_STATUSES,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
} from "../constants/domain.js";
import { avatarKeySchema } from "./avatar.js";
import { pageOf, paginationQuerySchema } from "./pagination.js";

/**
 * Contratos de las tareas, compartidos por la API y el front.
 *
 * Todos los esquemas de entrada son `.strict()`, y aquí eso hace más trabajo
 * que en `children`: es lo que convierte «el niño solo ve lo suyo» y «una tarea
 * no se reasigna a otro hijo» en cosas que FALLAN, no en cosas que simplemente
 * no ocurren. Mandar `childId` en la edición o en el listado propio de un niño
 * es un 422, no un campo que se ignora en silencio.
 */

/** En qué punto de su ciclo está una tarea. */
export const taskStatusSchema = z.enum(TASK_STATUSES);

/** Título de la tarea. Lo que el niño lee en su lista. */
export const taskTitleSchema = z
  .string()
  .trim()
  .min(TITLE_MIN_LENGTH, "El título es demasiado corto.")
  .max(TITLE_MAX_LENGTH, "El título es demasiado largo.");

/** Descripción opcional: el detalle de qué hay que hacer. */
export const taskDescriptionSchema = z
  .string()
  .trim()
  .max(DESCRIPTION_MAX_LENGTH, "La descripción es demasiado larga.");

/**
 * Lo que vale la tarea.
 *
 * El rango lo garantiza además un CHECK en el motor (`tasks_coins_range`), así
 * que un valor fuera de rango se rechaza aquí y volvería a rechazarse allí.
 */
export const taskCoinsSchema = z
  .number({ invalid_type_error: "Las monedas tienen que ser un número." })
  .int("Las monedas tienen que ser un número entero.")
  .min(COINS_MIN, `Una tarea vale como mínimo ${COINS_MIN} moneda.`)
  .max(COINS_MAX, `Una tarea vale como máximo ${COINS_MAX} monedas.`);

/**
 * Fecha límite, en ISO 8601.
 *
 * Es INFORMATIVA: no caduca, no avisa y no cambia ninguna regla. Se admite con
 * desfase horario además de en UTC, porque quien la escribe es un padre en su
 * zona y no un servidor.
 */
export const taskDueDateSchema = z
  .string()
  .datetime({ offset: true, message: "La fecha límite no es una fecha válida." });

/** Identificador de un hijo dentro de una petición de reparto. */
const childIdSchema = z.string().min(1, "Falta el identificador del hijo.");

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/** Un hijo con el valor que le toca a él. La forma B del alta. */
export const taskAssignmentSchema = z
  .object({
    childId: childIdSchema,
    coins: taskCoinsSchema,
  })
  .strict();

export type TaskAssignmentInput = z.infer<typeof taskAssignmentSchema>;

/**
 * Alta de un reparto. Se crea UNA TAREA POR HIJO.
 *
 * El valor se indica de dos formas y hay que cumplir EXACTAMENTE UNA:
 *
 *   A) { childIds: [...], coins }             el mismo valor para todos
 *   B) { assignments: [{ childId, coins }] }  un valor distinto por hijo
 *
 * La regla vive en el esquema compartido y no en el servicio para que el front
 * rechace el formulario sin viaje al servidor y con el mismo criterio que
 * aplicará la API. Ver la decisión 8 del design de `add-tasks`.
 *
 * NO acepta `parentId` ni `status`: el padre dueño sale de la sesión y una
 * tarea nace siempre pendiente. Al ser `.strict()`, mandarlos es 422.
 */
export const createTaskSchema = z
  .object({
    title: taskTitleSchema,
    description: taskDescriptionSchema.optional(),
    dueDate: taskDueDateSchema.optional(),

    // Forma A. Las dos juntas o ninguna: `childIds` sin `coins` no es media
    // forma válida, es una petición sin valor.
    childIds: z.array(childIdSchema).min(1, "Elige al menos un hijo.").optional(),
    coins: taskCoinsSchema.optional(),

    // Forma B.
    assignments: z
      .array(taskAssignmentSchema)
      .min(1, "Elige al menos un hijo.")
      .optional(),
  })
  .strict()
  .refine(
    (value) => {
      const compartido = value.childIds !== undefined && value.coins !== undefined;
      const porHijo = value.assignments !== undefined;

      // Ni las dos formas, ni ninguna, ni media: si `compartido` y `porHijo`
      // valen lo mismo es que faltan campos o sobran.
      if (compartido === porHijo) return false;
      if (compartido) return value.assignments === undefined;
      return value.childIds === undefined && value.coins === undefined;
    },
    {
      message:
        "Indica el mismo valor para todos los hijos o uno por hijo, pero no las dos cosas.",
    },
  )
  .refine(
    (value) => {
      // Un hijo repetido crearía dos tareas idénticas en el mismo reparto, que
      // no es lo que nadie quiere decir al repetirlo.
      const ids = value.childIds ?? value.assignments?.map((one) => one.childId) ?? [];
      return new Set(ids).size === ids.length;
    },
    { message: "Hay un hijo repetido en el reparto." },
  );

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * Edición de una tarea. Todo opcional, pero al menos un campo.
 *
 * NO acepta `childId`: reasignar a otro hijo es borrar la pendiente y crear
 * otra. Tampoco `status`: el estado se mueve por las transiciones, que son las
 * que comprueban de dónde viene. Al ser `.strict()`, ambas cosas son 422.
 *
 * `description` y `dueDate` admiten `null` explícito para BORRARLAS, que es
 * distinto de no enviar el campo.
 */
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

/** Identificador de tarea en la ruta. Validado, no leído a mano. */
export const taskParamsSchema = z
  .object({
    taskId: z.string().min(1, "Falta el identificador de la tarea."),
  })
  .strict();

export type TaskParams = z.infer<typeof taskParamsSchema>;

/**
 * Query del listado del padre: paginación más filtros.
 *
 * Se construye con `.extend()` sobre `paginationQuerySchema` porque es justo el
 * caso para el que se diseñó ese patrón. Filtrar por `COMPLETED` es la bandeja
 * de lo que le toca aprobar.
 */
export const listTasksQuerySchema = paginationQuerySchema
  .extend({
    status: taskStatusSchema.optional(),
    childId: childIdSchema.optional(),
  })
  .strict();

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

/**
 * Query del listado del niño.
 *
 * NO tiene `childId`, y al ser `.strict()` mandarlo es 422. Ahí está la
 * garantía de que un niño no puede pedir las tareas de su hermano: no hay
 * ningún parámetro que pudiera apuntar a otro perfil, así que no hay nada que
 * se pueda olvidar de comprobar.
 */
export const listOwnTasksQuerySchema = paginationQuerySchema
  .extend({
    status: taskStatusSchema.optional(),
  })
  .strict();

export type ListOwnTasksQuery = z.infer<typeof listOwnTasksQuerySchema>;

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

/**
 * El hijo dueño de una tarea, dentro de la vista del padre.
 *
 * Lo justo para pintar la fila: sin saldo, sin fechas y sin `parentId`. Una
 * tarea no es el sitio donde se consulta un perfil.
 */
export const taskChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: avatarKeySchema,
});

export type TaskChild = z.infer<typeof taskChildSchema>;

/**
 * Una tarea tal como la ve su padre: con el hijo al que le tocó.
 *
 * Lleva su propio `title` además del del reparto porque pueden divergir: editar
 * una tarea pendiente cambia solo esa fila, no las de sus hermanas.
 */
export const taskSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  coins: z.number().int(),
  status: taskStatusSchema,
  dueDate: z.string().datetime().nullable(),
  child: taskChildSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Task = z.infer<typeof taskSchema>;

/**
 * Lo que devuelve el alta: una tarea por hijo del reparto.
 *
 * Es un array y no un objeto con el reparto dentro porque el alta responde lo
 * que creó, y lo que creó son filas.
 */
export const createdTasksSchema = z.array(taskSchema);
export type CreatedTasks = z.infer<typeof createdTasksSchema>;

/**
 * Un reparto: las tareas que nacieron del mismo acto.
 *
 * Los campos de cabecera son los de la PRIMERA tarea del grupo. Son
 * representativos, no autoritativos: si el padre editó una de las hermanas, la
 * suya manda dentro de su fila.
 */
export const taskBatchSchema = z.object({
  batchId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  dueDate: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  tasks: z.array(taskSchema),
});

export type TaskBatch = z.infer<typeof taskBatchSchema>;

/** La unidad de paginación del listado del padre es el REPARTO, no la fila. */
export const taskBatchesPageSchema = pageOf(taskBatchSchema);
export type TaskBatchesPage = z.infer<typeof taskBatchesPageSchema>;

/**
 * Una tarea tal como la ve el niño al que le tocó.
 *
 * Sin `child`: es él. Sin `batchId`: el reparto es una noción de la gestión del
 * padre y no significa nada en la lista de un niño.
 */
export const ownTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  coins: z.number().int(),
  status: taskStatusSchema,
  dueDate: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type OwnTask = z.infer<typeof ownTaskSchema>;

export const ownTasksPageSchema = pageOf(ownTaskSchema);
export type OwnTasksPage = z.infer<typeof ownTasksPageSchema>;

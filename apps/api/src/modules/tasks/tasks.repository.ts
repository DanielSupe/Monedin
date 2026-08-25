import type { TaskStatus } from "@monedin/contracts";
import { applyCoinMovement, getPrisma, withTranslatedErrors } from "../../shared/database/index.js";
import { TaskTransitionConflictError } from "./tasks.errors.js";

/**
 * Capa de datos del módulo `tasks`.
 *
 * ÚNICO archivo del módulo que toca Prisma, y el primero del proyecto que abre
 * una TRANSACCIÓN INTERACTIVA de producción. Está aquí y no en el servicio
 * porque el cliente no se puede importar fuera de un repositorio; la
 * consecuencia es que la comprobación de «cuántas filas afectó» vive aquí, que
 * es donde se sabe. Ver la decisión 6 del design de `add-tasks`.
 *
 * Sigue sin saber de roles ni de pertenencia: eso lo decide el servicio antes
 * de llamar. Lo único que este archivo decide es si una transición encontró el
 * estado del que decía partir.
 *
 * Cuándo lanza y cuándo devuelve vacío, que no es capricho:
 *
 *   - LANZA cuando el fallo tiene que deshacer una transacción abierta aquí
 *     dentro. Devolver un `null` desde dentro de `$transaction` la confirmaría,
 *     y en el caso de aprobar eso significa acreditar monedas.
 *   - DEVUELVE vacío cuando quien llama todavía tiene que distinguir un 404 de
 *     un 409, que es el caso de editar y borrar.
 */

/** Los campos que devuelve cualquier lectura de una tarea del padre. */
const TASK_FIELDS = {
  id: true,
  batchId: true,
  title: true,
  description: true,
  coins: true,
  status: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  child: { select: { id: true, name: true, avatar: true } },
} as const;

/** Lo que ve el niño de su propia tarea: sin el hijo, porque es él. */
const OWN_TASK_FIELDS = {
  id: true,
  title: true,
  description: true,
  coins: true,
  status: true,
  dueDate: true,
  createdAt: true,
} as const;

/** Una tarea tal como sale de la base, con el hijo al que le tocó. */
export interface TaskRow {
  id: string;
  batchId: string;
  title: string;
  description: string | null;
  coins: number;
  status: TaskStatus;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  child: { id: string; name: string; avatar: string | null };
}

/** Una tarea desde el lado del niño. */
export interface OwnTaskRow {
  id: string;
  title: string;
  description: string | null;
  coins: number;
  status: TaskStatus;
  dueDate: Date | null;
  createdAt: Date;
}

/** Filtros del listado. Se aplican a las TAREAS, no a los repartos. */
export interface TaskFilters {
  status?: TaskStatus;
  childId?: string;
}

// ---------------------------------------------------------------------------
// Alta
// ---------------------------------------------------------------------------

/**
 * Crea un reparto: una fila por hijo, todas con el mismo `batchId`.
 *
 * El identificador del reparto lo genera quien llama y no el motor, porque hace
 * falta conocerlo ANTES de insertar para que todas las filas lo compartan.
 *
 * El alta es un solo `createMany`, así que o entran todas o no entra ninguna:
 * es lo que hace que el reparto sea todo o nada también frente a un fallo del
 * motor, y no solo frente a un hijo ajeno. La lectura posterior devuelve las
 * filas ya con sus valores generados.
 */
export function createBatch(data: {
  parentId: string;
  batchId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  assignments: Array<{ childId: string; coins: number }>;
}): Promise<TaskRow[]> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();

    await prisma.task.createMany({
      data: data.assignments.map((assignment) => ({
        parentId: data.parentId,
        batchId: data.batchId,
        title: data.title,
        childId: assignment.childId,
        coins: assignment.coins,
        // `exactOptionalPropertyTypes` no admite pasar `undefined` explícito.
        ...(data.description === undefined ? {} : { description: data.description }),
        ...(data.dueDate === undefined ? {} : { dueDate: data.dueDate }),
      })),
    });

    return prisma.task.findMany({
      where: { batchId: data.batchId },
      select: TASK_FIELDS,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  });
}

/**
 * De los identificadores pedidos, cuáles son hijos ACTIVOS de este padre.
 *
 * Una sola consulta para todos: el servicio compara lo que pidió con lo que
 * salió y así comprueba el reparto entero antes de crear nada. Los tres casos
 * que hacen que un identificador no salga —no existe, es de otra familia, está
 * dado de baja— son indistinguibles desde fuera, y es deliberado.
 */
export function findChildIdsOwnedBy(parentId: string, childIds: string[]): Promise<string[]> {
  return withTranslatedErrors(async () => {
    const rows = await getPrisma().childProfile.findMany({
      where: { id: { in: childIds }, parentId, deletedAt: null },
      select: { id: true },
    });

    return rows.map((row) => row.id);
  });
}

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------

/**
 * Una tarea por identificador, con lo necesario para decidir si es tuya.
 *
 * Devuelve `parentId` a propósito, porque el SERVICIO es quien decide qué
 * significa. El repositorio no sabe de pertenencia.
 */
export function findTaskById(id: string): Promise<(TaskRow & { parentId: string }) | null> {
  return withTranslatedErrors(() =>
    getPrisma().task.findUnique({
      where: { id },
      select: { ...TASK_FIELDS, parentId: true },
    }),
  );
}

/**
 * Una página de REPARTOS del padre, con el total sin paginar.
 *
 * La unidad de paginación es el reparto y no la fila, así que se resuelve en
 * dos consultas dentro de la MISMA transacción:
 *
 *   1. Qué repartos cumplen el filtro, ordenados y con `skip`/`take`.
 *   2. TODAS las tareas de esos repartos.
 *
 * Ordenar por el reparto y no por la fila es lo que garantiza que un reparto no
 * se parta entre dos páginas.
 *
 * Los dos filtros eligen qué repartos entran, pero NO se comportan igual al
 * mostrarlos, y la diferencia es deliberada:
 *
 *   - Por ESTADO, el reparto se enseña ENTERO: el padre quiere ver el reparto
 *     completo aunque solo una de sus tareas esté para aprobar.
 *   - Por HIJO, se enseñan solo las tareas de ese hijo: quien filtra por Ana
 *     está preguntando por Ana, y colarle las de su hermano no es lo que pidió.
 *
 * Ver la decisión 5 del design.
 *
 * El desempate por `batchId` no es adorno: `createdAt` no es único, y dos
 * repartos creados en el mismo milisegundo tienen orden indefinido sin él.
 */
export function findTaskBatchesPage(
  parentId: string,
  filters: TaskFilters,
  { skip, take }: { skip: number; take: number },
): Promise<{ batches: Array<{ batchId: string }>; tasks: TaskRow[]; total: number }> {
  return withTranslatedErrors(() => {
    const where = {
      parentId,
      ...(filters.status === undefined ? {} : { status: filters.status }),
      ...(filters.childId === undefined ? {} : { childId: filters.childId }),
    };

    return getPrisma().$transaction(async (tx) => {
      const page = await tx.task.groupBy({
        by: ["batchId"],
        where,
        _min: { createdAt: true },
        orderBy: [{ _min: { createdAt: "desc" } }, { batchId: "desc" }],
        skip,
        take,
      });

      // El total cuenta REPARTOS, no filas. Se resuelve agrupando sin paginar:
      // es O(repartos de una familia), que son decenas. El design declara el
      // rendimiento fuera de objetivos a propósito.
      const todos = await tx.task.groupBy({ by: ["batchId"], where });

      const batchIds = page.map((group) => group.batchId);

      const tasks =
        batchIds.length === 0
          ? []
          : await tx.task.findMany({
              // Sin el filtro de estado: el reparto se enseña ENTERO aunque
              // solo una de sus tareas sea la que lo metió en la lista. El de
              // hijo sí se mantiene, porque acota de quién se está preguntando.
              where: {
                parentId,
                batchId: { in: batchIds },
                ...(filters.childId === undefined ? {} : { childId: filters.childId }),
              },
              select: TASK_FIELDS,
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            });

      return { batches: page.map(({ batchId }) => ({ batchId })), tasks, total: todos.length };
    });
  });
}

/**
 * Una página de las tareas de un niño, plana.
 *
 * Contar y leer van en la MISMA transacción, y el `orderBy` desempata por `id`,
 * por las dos razones de siempre del patrón de paginación.
 */
export function findOwnTasksPage(
  childId: string,
  filters: { status?: TaskStatus },
  { skip, take }: { skip: number; take: number },
): Promise<{ items: OwnTaskRow[]; total: number }> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();
    const where = {
      childId,
      ...(filters.status === undefined ? {} : { status: filters.status }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        select: OWN_TASK_FIELDS,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
      prisma.task.count({ where }),
    ]);

    return { items, total };
  });
}

// ---------------------------------------------------------------------------
// Transiciones
// ---------------------------------------------------------------------------

/**
 * Mueve una tarea de un estado a otro, con el estado de ORIGEN en la condición.
 *
 * Es el mecanismo entero de la idempotencia del módulo: la actualización toma
 * un bloqueo de fila, así que dos peticiones simultáneas se serializan y la
 * segunda reevalúa el predicado sobre la versión ya confirmada. Si el estado ya
 * cambió, afecta a CERO filas, y eso es un conflicto y no un éxito silencioso.
 *
 * Basta con Read Committed. No hace falta subir el aislamiento ni mapear
 * `P2034`. Ver las decisiones 1 y 2 del design.
 */
export function transition(taskId: string, from: TaskStatus, to: TaskStatus): Promise<TaskRow> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();

    const affected = await prisma.task.updateMany({
      where: { id: taskId, status: from },
      data: { status: to },
    });

    if (affected.count !== 1) {
      throw new TaskTransitionConflictError();
    }

    return prisma.task.findUniqueOrThrow({ where: { id: taskId }, select: TASK_FIELDS });
  });
}

/**
 * Aprueba una tarea Y acredita sus monedas, o no hace ninguna de las dos cosas.
 *
 * PRIMERA TRANSACCIÓN INTERACTIVA DE PRODUCCIÓN DEL PROYECTO. Es la plantilla
 * que copiarán los canjes, que descuentan en vez de acreditar.
 *
 * EL ORDEN IMPORTA, y es la razón de que el change exista: primero la
 * transición condicional, después la acreditación. Al revés, el segundo toque
 * de un doble tap acreditaría antes de descubrir que perdió la carrera, y el
 * niño cobraría dos veces por el mismo trabajo.
 *
 * Las tres operaciones van en la misma transacción, así que no puede quedar una
 * tarea aprobada sin sus monedas ni monedas acreditadas sin la tarea aprobada.
 * `applyCoinMovement` recibe `tx` precisamente para que no se pueda llamar
 * fuera de una.
 */
export function approve(taskId: string, childId: string, coins: number): Promise<TaskRow> {
  return withTranslatedErrors(() =>
    getPrisma().$transaction(async (tx) => {
      // 1. La transición, condicionada a que siga marcada como hecha.
      const affected = await tx.task.updateMany({
        where: { id: taskId, status: "COMPLETED" },
        data: { status: "APPROVED" },
      });

      if (affected.count !== 1) {
        // Alguien ganó la carrera, o nadie la había marcado. Lanzar aquí
        // deshace la transacción entera: no se acredita nada.
        throw new TaskTransitionConflictError();
      }

      // 2. Y solo entonces, el dinero.
      await applyCoinMovement(tx, {
        childId,
        amount: coins,
        reason: "TASK_APPROVED",
        taskId,
      });

      // 3. La tarea ya aprobada, leída dentro de la misma transacción.
      return tx.task.findUniqueOrThrow({ where: { id: taskId }, select: TASK_FIELDS });
    }),
  );
}

// ---------------------------------------------------------------------------
// Edición y borrado
// ---------------------------------------------------------------------------

/**
 * Edita una tarea SOLO si sigue pendiente, y devuelve la tarea ya cambiada.
 *
 * `status: "PENDING"` va en el WHERE para que el conflicto lo detecte el motor
 * y no una lectura previa: entre leer y escribir, el hijo puede marcarla.
 *
 * Devuelve `null` cuando no estaba pendiente. Quien llama ya comprobó que la
 * tarea es suya, así que sabe distinguir esto de un 404.
 */
export function updateTaskIfPending(
  id: string,
  data: {
    title?: string | undefined;
    description?: string | null | undefined;
    coins?: number | undefined;
    dueDate?: Date | null | undefined;
  },
): Promise<TaskRow | null> {
  return withTranslatedErrors(() =>
    getPrisma().$transaction(async (tx) => {
      const affected = await tx.task.updateMany({
        where: { id, status: "PENDING" },
        data: {
          ...(data.title === undefined ? {} : { title: data.title }),
          ...(data.description === undefined ? {} : { description: data.description }),
          ...(data.coins === undefined ? {} : { coins: data.coins }),
          ...(data.dueDate === undefined ? {} : { dueDate: data.dueDate }),
        },
      });

      if (affected.count !== 1) return null;

      return tx.task.findUniqueOrThrow({ where: { id }, select: TASK_FIELDS });
    }),
  );
}

/**
 * Borra una tarea SOLO si sigue pendiente. Devuelve cuántas filas borró.
 *
 * Una pendiente no tiene historial de monedas, así que el borrado es FÍSICO y
 * no lógico: no hay nada que conservar. La condición de estado es justo lo que
 * garantiza que nunca se intente borrar una que sí lo tiene, cuya clave ajena
 * `Restrict` lo impediría de todas formas.
 */
export function deleteTaskIfPending(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().task.deleteMany({ where: { id, status: "PENDING" } });
    return result.count;
  });
}

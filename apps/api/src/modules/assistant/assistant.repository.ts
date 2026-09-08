import { getPrisma, withTranslatedErrors } from "../../shared/database/index.js";

/**
 * Acceso a datos del contexto que se le entrega al modelo.
 *
 * ÚNICO archivo del módulo que toca Prisma, y solo LEE. Un asistente que
 * escribiera algo sería otro producto: no hay `create`, `update` ni `delete`
 * aquí, y esa ausencia es lo que hace cierto que una inyección de prompt lograda
 * no puede mover una moneda — no existe camino de código, no es que el guion lo
 * prohíba.
 *
 * POR QUÉ NO SE DELEGA EN LOS SERVICIOS AJENOS. La regla del proyecto ya lo dice
 * —la autorización se delega, los datos los lee el repositorio propio— y aquí
 * hay además dos razones concretas:
 *
 * 1. Los serializadores de `children`, `rewards` y `redemptions` son ASÍNCRONOS
 *    porque firman URLs de S3. Delegar sería hacer una decena de peticiones de
 *    firma contra la red para componer un prompt de TEXTO, donde una imagen no
 *    sirve absolutamente de nada.
 * 2. Devuelven `Page<T>`. Habría que pedir páginas y recomponer para conseguir
 *    «las últimas N», que es lo único que un prompt necesita.
 *
 * Y todo lo de un contexto va en la MISMA transacción, por la razón que
 * `coins.repository.ts` ya declara: una tarea aprobada entre dos consultas
 * dejaría un prompt donde el saldo y la lista se contradicen, y el modelo
 * redactaría esa incoherencia con total seguridad.
 *
 * Los `select` son estrechos a conciencia: nada de avatares, claves de imagen ni
 * identificadores. Lo que sale de aquí viaja a un tercero.
 */

/** Cuántas filas de cada cosa caben. Lo decide el servicio, no este archivo. */
export interface ContextLimits {
  tasks: number;
  rewards: number;
  redemptions: number;
  movements: number;
}

export interface ChildTaskRow {
  title: string;
  coins: number;
  status: string;
}

export interface ChildRewardRow {
  title: string;
  description: string | null;
  coins: number;
}

export interface ChildRedemptionRow {
  rewardTitle: string;
  coins: number;
  status: string;
}

export interface ChildMovementRow {
  amount: number;
  reason: string;
}

export interface ChildContextRow {
  name: string;
  age: number | null;
  coins: number;
  tasks: ChildTaskRow[];
  rewards: ChildRewardRow[];
  redemptions: ChildRedemptionRow[];
  movements: ChildMovementRow[];
}

/**
 * Todo lo que Monedín sabe de UN niño: el que pregunta.
 *
 * Recibe `childProfileId` y no existe ningún camino que acepte otro parámetro.
 * Ahí está la garantía de que no ve a sus hermanos: no es una comprobación que
 * alguien pueda olvidarse de escribir, es que el dato de otro no puede entrar
 * en la ventana. Mismo mecanismo que `GET /children/me/coins`, y aquí importa
 * por lo mismo: los hermanos comparten la tablet.
 */
export function findChildContext(
  childProfileId: string,
  limits: ContextLimits,
): Promise<ChildContextRow | null> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
      const perfil = await tx.childProfile.findFirst({
        where: { id: childProfileId, deletedAt: null },
        select: { name: true, age: true, coins: true },
      });

      if (perfil === null) {
        return null;
      }

      const [tareas, ofertas, canjes, movimientos] = await Promise.all([
        /*
         * Las NO aprobadas primero: son sobre las que se puede hacer algo, y
         * son las que motivan la pregunta. Una tarea ya pagada solo explica de
         * dónde salieron las monedas, y para eso están los movimientos.
         */
        tx.task.findMany({
          where: { childId: childProfileId },
          select: { title: true, coins: true, status: true },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
          take: limits.tasks,
        }),
        /*
         * Su escaparate: solo premios ACTIVOS ofrecidos a él, con SU precio.
         * El precio vive en la asignación y no en el premio, así que sale de
         * aquí y nunca de `Reward`.
         */
        tx.rewardAssignment.findMany({
          where: { childId: childProfileId, reward: { isActive: true } },
          select: {
            coins: true,
            reward: { select: { title: true, description: true } },
          },
          orderBy: [{ coins: "asc" }, { rewardId: "asc" }],
          take: limits.rewards,
        }),
        tx.rewardRedemption.findMany({
          where: { childId: childProfileId },
          select: {
            coins: true,
            status: true,
            reward: { select: { title: true } },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: limits.redemptions,
        }),
        /* Responde «¿por qué tengo 120 y no 140?», que es la pregunta real. */
        tx.coinTransaction.findMany({
          where: { childId: childProfileId },
          select: { amount: true, reason: true },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: limits.movements,
        }),
      ]);

      return {
        name: perfil.name,
        age: perfil.age,
        coins: perfil.coins,
        tasks: tareas,
        rewards: ofertas.map((oferta) => ({
          title: oferta.reward.title,
          description: oferta.reward.description,
          coins: oferta.coins,
        })),
        redemptions: canjes.map((canje) => ({
          rewardTitle: canje.reward.title,
          coins: canje.coins,
          status: canje.status,
        })),
        movements: movimientos,
      };
    });
  });
}

export interface ParentChildRow {
  name: string;
  age: number | null;
  coins: number;
  pendingTasks: number;
}

export interface ParentTaskRow {
  childName: string;
  title: string;
  coins: number;
}

export interface ParentRewardRow {
  title: string;
  offers: number;
}

export interface ParentRedemptionRow {
  childName: string;
  rewardTitle: string;
  coins: number;
}

export interface ParentContextRow {
  name: string;
  children: ParentChildRow[];
  pendingApproval: ParentTaskRow[];
  rewards: ParentRewardRow[];
  pendingRedemptions: ParentRedemptionRow[];
}

/**
 * Todo lo que Monedín sabe de una familia: la del padre que pregunta.
 *
 * El nombre del padre se LEE aquí y no viene en el actor: el `Actor` de la API
 * lleva solo identificadores, a diferencia del que ve el front.
 *
 * Los hijos no llevan tope propio: `MAX_CHILDREN_PER_FAMILY` ya lo es.
 */
export function findParentContext(
  parentId: string,
  limits: ContextLimits,
): Promise<ParentContextRow | null> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
      const padre = await tx.user.findUnique({
        where: { id: parentId },
        select: { name: true },
      });

      if (padre === null) {
        return null;
      }

      const [hijos, porAprobar, premios, canjes, pendientesPorHijo] = await Promise.all([
        tx.childProfile.findMany({
          where: { parentId, deletedAt: null },
          select: { id: true, name: true, age: true, coins: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        }),
        /* La bandeja de aprobación: lo único del panel que pide una acción. */
        tx.task.findMany({
          where: { parentId, status: "COMPLETED" },
          select: { title: true, coins: true, child: { select: { name: true } } },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take: limits.tasks,
        }),
        tx.reward.findMany({
          where: { parentId, isActive: true },
          select: { title: true, _count: { select: { assignments: true } } },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: limits.rewards,
        }),
        tx.rewardRedemption.findMany({
          where: { status: "PENDING", reward: { parentId } },
          select: {
            coins: true,
            child: { select: { name: true } },
            reward: { select: { title: true } },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: limits.redemptions,
        }),
        tx.task.groupBy({
          by: ["childId"],
          where: { parentId, status: "PENDING" },
          _count: { _all: true },
        }),
      ]);

      const pendientes = new Map(
        pendientesPorHijo.map((fila) => [fila.childId, fila._count._all]),
      );

      return {
        name: padre.name,
        children: hijos.map((hijo) => ({
          name: hijo.name,
          age: hijo.age,
          coins: hijo.coins,
          pendingTasks: pendientes.get(hijo.id) ?? 0,
        })),
        pendingApproval: porAprobar.map((tarea) => ({
          childName: tarea.child.name,
          title: tarea.title,
          coins: tarea.coins,
        })),
        rewards: premios.map((premio) => ({
          title: premio.title,
          offers: premio._count.assignments,
        })),
        pendingRedemptions: canjes.map((canje) => ({
          childName: canje.child.name,
          rewardTitle: canje.reward.title,
          coins: canje.coins,
        })),
      };
    });
  });
}

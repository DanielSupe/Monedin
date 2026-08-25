import { PARENT_PROFILE_ID } from "@monedin/contracts";
import type { Express } from "express";
import { CREDENCIALES, createChildProfile, enterProfile, asParent, liveCookies, login } from "./auth.js";
import { testPrisma } from "./database.js";

/**
 * Soporte para los tests de tareas.
 *
 * Lo que resuelve, y que si no se repetiría en cada archivo:
 *
 * UN PERFIL POR DISPOSITIVO. Dentro de una misma sesión de cuenta solo hay un
 * perfil activo a la vez: entrar al del hijo echa al del padre. Casi todo test
 * de tareas necesita a los dos a la vez —el niño marca, el padre aprueba—, así
 * que cada uno entra desde su propia sesión de cuenta, que es lo que en la vida
 * real es el móvil de cada uno.
 */

export interface MiembroOperando {
  id: string;
  name: string;
  pin: string;
  cookies: string[];
}

export interface FamiliaOperando {
  parentId: string;
  /** Cookies del padre con SU perfil activo, en su propio dispositivo. */
  cookies: string[];
  /** Cookies de solo cuenta, para lo que ocurre antes de elegir perfil. */
  accountCookies: string[];
  hijos: MiembroOperando[];
}

/**
 * Una familia con su padre y sus hijos dentro, cada uno en su dispositivo.
 *
 * Los hijos se crean EN SERIE para que su `createdAt` respete el orden de los
 * nombres, igual que en `familiaConHijos`.
 */
export async function familiaOperando(
  app: Express,
  nombres: string[],
  overrides: { email?: string } = {},
): Promise<FamiliaOperando> {
  const email = overrides.email ?? CREDENCIALES.correo;
  const { accountCookies, parentId } = await asParent(app, { email });

  const hijos: MiembroOperando[] = [];
  for (const [indice, name] of nombres.entries()) {
    const pin = String(1000 + indice).padStart(4, "0");
    const hijo = await createChildProfile(parentId, { name, pin });

    hijos.push({
      ...hijo,
      pin,
      cookies: await enDispositivoPropio(app, email, hijo.id, pin),
    });
  }

  return {
    parentId,
    // El padre vuelve a entrar en un dispositivo nuevo: los hijos de arriba le
    // quitaron el perfil de la sesión de cuenta original.
    cookies: await enDispositivoPropio(app, email, PARENT_PROFILE_ID, CREDENCIALES.pin),
    accountCookies,
    hijos,
  };
}

/**
 * Abre una sesión de cuenta NUEVA y entra a un perfil desde ella.
 *
 * Es lo que hace falta para tener dos perfiles de la misma familia operando a
 * la vez: dentro de una sesión de cuenta eso es imposible por diseño.
 */
async function enDispositivoPropio(
  app: Express,
  email: string,
  profileId: string,
  pin: string,
): Promise<string[]> {
  const response = await login(app, { email, password: CREDENCIALES.password });

  if (response.status !== 200) {
    throw new Error(`El acceso falló: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return enterProfile(app, liveCookies(response), profileId, pin);
}

// ---------------------------------------------------------------------------
// Datos sembrados directamente
// ---------------------------------------------------------------------------

/**
 * Crea una tarea saltándose la API.
 *
 * Sirve para colocar una tarea en un estado concreto sin recorrer las
 * transiciones que lo llevarían hasta ahí, que es lo que hace legible un test
 * de «aprobar una ya aprobada».
 */
export async function sembrarTarea(
  owners: { parentId: string; childId: string },
  overrides: {
    title?: string;
    coins?: number;
    status?: "PENDING" | "COMPLETED" | "APPROVED";
    batchId?: string;
    dueDate?: Date;
    createdAt?: Date;
  } = {},
): Promise<{ id: string; batchId: string; coins: number }> {
  const task = await testPrisma().task.create({
    data: {
      title: overrides.title ?? "Ordenar el cuarto",
      coins: overrides.coins ?? 50,
      batchId: overrides.batchId ?? `reparto-${Math.random().toString(36).slice(2, 12)}`,
      ...(overrides.status === undefined ? {} : { status: overrides.status }),
      ...(overrides.dueDate === undefined ? {} : { dueDate: overrides.dueDate }),
      ...(overrides.createdAt === undefined ? {} : { createdAt: overrides.createdAt }),
      childId: owners.childId,
      parentId: owners.parentId,
    },
    select: { id: true, batchId: true, coins: true },
  });

  return task;
}

/** El saldo que tiene ahora mismo un hijo. */
export async function saldoDe(childId: string): Promise<number> {
  const { coins } = await testPrisma().childProfile.findUniqueOrThrow({
    where: { id: childId },
    select: { coins: true },
  });
  return coins;
}

/** El estado en el que ha quedado una tarea. */
export async function estadoDe(taskId: string): Promise<string> {
  const { status } = await testPrisma().task.findUniqueOrThrow({
    where: { id: taskId },
    select: { status: true },
  });
  return status;
}

/** Las entradas de historial que señalan una tarea concreta. */
export async function movimientosDe(
  taskId: string,
): Promise<Array<{ amount: number; balanceAfter: number; reason: string }>> {
  return testPrisma().coinTransaction.findMany({
    where: { taskId },
    select: { amount: true, balanceAfter: true, reason: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Cuántas tareas hay creadas para un padre. Para comprobar el «todo o nada». */
export function cuantasTareasTiene(parentId: string): Promise<number> {
  return testPrisma().task.count({ where: { parentId } });
}

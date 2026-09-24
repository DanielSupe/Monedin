import { PARENT_PROFILE_ID } from "@monedin/contracts";
import type { Express } from "express";
import { CREDENCIALES, createChildProfile, enterProfile, asParent, liveCookies, login } from "./auth.js";
import { testPrisma } from "./database.js";

export interface MiembroOperando {
  id: string;
  name: string;
  pin: string;
  cookies: string[];
}

export interface FamiliaOperando {
  parentId: string;

  cookies: string[];

  accountCookies: string[];
  hijos: MiembroOperando[];
}

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

    cookies: await enDispositivoPropio(app, email, PARENT_PROFILE_ID, CREDENCIALES.pin),
    accountCookies,
    hijos,
  };
}

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

export async function saldoDe(childId: string): Promise<number> {
  const { coins } = await testPrisma().childProfile.findUniqueOrThrow({
    where: { id: childId },
    select: { coins: true },
  });
  return coins;
}

export async function estadoDe(taskId: string): Promise<string> {
  const { status } = await testPrisma().task.findUniqueOrThrow({
    where: { id: taskId },
    select: { status: true },
  });
  return status;
}

export async function movimientosDe(
  taskId: string,
): Promise<Array<{ amount: number; balanceAfter: number; reason: string }>> {
  return testPrisma().coinTransaction.findMany({
    where: { taskId },
    select: { amount: true, balanceAfter: true, reason: true },
    orderBy: { createdAt: "asc" },
  });
}

export function cuantasTareasTiene(parentId: string): Promise<number> {
  return testPrisma().task.count({ where: { parentId } });
}

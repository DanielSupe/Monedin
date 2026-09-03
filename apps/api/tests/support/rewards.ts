import { testPrisma } from "./database.js";

/**
 * Soporte para los tests de premios.
 *
 * `familiaOperando`, de `support/tasks.ts`, se reutiliza tal cual: monta un
 * padre y sus hijos, cada uno en su propio dispositivo, que es justo lo que
 * hace falta para que el padre publique y el niño mire su escaparate a la vez.
 */

/**
 * Publica un premio saltándose la API, con las ofertas que se indiquen.
 *
 * Sirve para colocar un premio (y su catálogo) en un estado concreto sin
 * recorrer el alta, que es lo que hace legible un test de listado o de
 * escaparate.
 */
export async function sembrarPremio(
  parentId: string,
  overrides: {
    title?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: Date;
    offers?: Array<{ childId: string; coins: number }>;
  } = {},
): Promise<{ id: string; isActive: boolean }> {
  const reward = await testPrisma().reward.create({
    data: {
      title: overrides.title ?? "Ir al cine",
      parentId,
      ...(overrides.description === undefined ? {} : { description: overrides.description }),
      ...(overrides.isActive === undefined ? {} : { isActive: overrides.isActive }),
      ...(overrides.createdAt === undefined ? {} : { createdAt: overrides.createdAt }),
      ...(overrides.offers === undefined
        ? {}
        : {
            assignments: {
              create: overrides.offers.map((offer) => ({
                childId: offer.childId,
                coins: offer.coins,
              })),
            },
          }),
    },
    select: { id: true, isActive: true },
  });

  return reward;
}

/** Cuántos premios hay creados para un padre. Para comprobar el «todo o nada». */
export function cuantosPremiosTiene(parentId: string): Promise<number> {
  return testPrisma().reward.count({ where: { parentId } });
}

/** Las ofertas actuales de un premio, tal como quedaron. */
export async function ofertasDe(
  rewardId: string,
): Promise<Array<{ childId: string; coins: number }>> {
  return testPrisma().rewardAssignment.findMany({
    where: { rewardId },
    select: { childId: true, coins: true },
    orderBy: { childId: "asc" },
  });
}

/** Si un premio sigue activo. */
export async function estaActivo(rewardId: string): Promise<boolean> {
  const { isActive } = await testPrisma().reward.findUniqueOrThrow({
    where: { id: rewardId },
    select: { isActive: true },
  });
  return isActive;
}

/**
 * Fija el saldo de un hijo directamente, saltándose el libro mayor.
 *
 * Es una comodidad de test para colocar el saldo en un valor conocido antes de
 * mirar `affordable`: no simula un movimiento real, así que no sirve para
 * probar nada del historial. `tasks-transitions` es donde se prueba el
 * movimiento real, vía aprobar una tarea.
 */
export async function fijarSaldo(childId: string, coins: number): Promise<void> {
  await testPrisma().childProfile.update({ where: { id: childId }, data: { coins } });
}

/**
 * Todos los valores NUMÉRICOS de una respuesta, a cualquier profundidad.
 *
 * Existe porque las dos formas anteriores de comprobar «el precio del hermano no
 * sale por ninguna parte» estaban mal, cada una a su manera:
 *
 *   - Buscar el número como TEXTO en el JSON serializado da falsos positivos.
 *     Tumbó la batería un día que `createdAt` acabó en `...12.999Z` y el precio
 *     buscado era 999; una URL firmada, con su hexadecimal, hace lo mismo.
 *   - El intento de arreglarlo comparaba contra `": 40"`, con espacio, sobre una
 *     cadena de `JSON.stringify`, que NO pone espacio tras los dos puntos. Esa
 *     comprobación no podía fallar nunca.
 *
 * Un precio es un número, así que se miran los números y no el texto: ni los
 * instantes ni las firmas pueden colarse, y la comprobación sigue cubriendo
 * TODA la respuesta y no los campos que el test se acuerde de mirar.
 */
export function valoresNumericos(valor: unknown): number[] {
  if (typeof valor === "number") return [valor];
  if (Array.isArray(valor)) return valor.flatMap(valoresNumericos);
  if (valor !== null && typeof valor === "object") {
    return Object.values(valor).flatMap(valoresNumericos);
  }

  return [];
}

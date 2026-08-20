import {
  CHILD_AGE_MAX,
  CHILD_AGE_MIN,
  COINS_BALANCE_MIN,
  COINS_MAX,
  COINS_MIN,
} from "@monedin/contracts";
import { describe, expect, it } from "vitest";
import { testPrisma } from "../support/database.js";

/**
 * Los límites de dominio viven en `@monedin/contracts` y se repiten en SQL,
 * porque una migración es un artefacto congelado y no puede importar constantes.
 *
 * Esa duplicación es justo lo que `CLAUDE.md` prohíbe, así que la salida no es
 * evitarla sino hacerla verificable: este test lee las restricciones VIVAS de la
 * base de datos y las compara con las constantes. Si alguien cambia un límite y
 * no escribe la migración correspondiente, esto falla nombrando la restricción
 * descuadrada. Ver la decisión 4 del design.
 */

interface ConstraintRow {
  conname: string;
  definition: string;
}

async function liveCheckConstraints(): Promise<Map<string, string>> {
  const rows = await testPrisma().$queryRawUnsafe<ConstraintRow[]>(
    `SELECT conname, pg_get_constraintdef(oid) AS definition
       FROM pg_constraint
      WHERE contype = 'c' AND connamespace = 'public'::regnamespace`,
  );

  return new Map(rows.map((row) => [row.conname, row.definition]));
}

/** Números que aparecen en la definición de una restricción, en orden. */
function numbersIn(definition: string): number[] {
  return [...definition.matchAll(/-?\d+/g)].map((match) => Number(match[0]));
}

describe("los límites del motor y los del contrato compartido coinciden", () => {
  it("el rango de monedas de una tarea", async () => {
    const constraints = await liveCheckConstraints();
    const definition = constraints.get("tasks_coins_range");

    expect(definition, "falta la restricción tasks_coins_range en la base de datos").toBeDefined();
    expect(
      numbersIn(definition ?? ""),
      `tasks_coins_range no coincide con COINS_MIN/COINS_MAX de @monedin/contracts: ${definition}`,
    ).toEqual([COINS_MIN, COINS_MAX]);
  });

  it("el rango de precio de una asignación de premio", async () => {
    const constraints = await liveCheckConstraints();
    const definition = constraints.get("reward_assignments_coins_range");

    expect(definition, "falta la restricción reward_assignments_coins_range").toBeDefined();
    expect(
      numbersIn(definition ?? ""),
      `reward_assignments_coins_range no coincide con el contrato: ${definition}`,
    ).toEqual([COINS_MIN, COINS_MAX]);
  });

  it("el rango de precio congelado de un canje", async () => {
    const constraints = await liveCheckConstraints();
    const definition = constraints.get("reward_redemptions_coins_range");

    expect(definition, "falta la restricción reward_redemptions_coins_range").toBeDefined();
    expect(
      numbersIn(definition ?? ""),
      `reward_redemptions_coins_range no coincide con el contrato: ${definition}`,
    ).toEqual([COINS_MIN, COINS_MAX]);
  });

  it("el rango de edad del hijo", async () => {
    const constraints = await liveCheckConstraints();
    const definition = constraints.get("child_profiles_age_range");

    expect(definition, "falta la restricción child_profiles_age_range").toBeDefined();
    expect(
      numbersIn(definition ?? ""),
      `child_profiles_age_range no coincide con CHILD_AGE_MIN/MAX de @monedin/contracts: ${definition}`,
    ).toEqual([CHILD_AGE_MIN, CHILD_AGE_MAX]);
  });

  it("el mínimo del saldo", async () => {
    const constraints = await liveCheckConstraints();
    const definition = constraints.get("child_profiles_coins_non_negative");

    expect(definition, "falta la restricción child_profiles_coins_non_negative").toBeDefined();
    expect(
      numbersIn(definition ?? ""),
      `child_profiles_coins_non_negative no coincide con COINS_BALANCE_MIN: ${definition}`,
    ).toEqual([COINS_BALANCE_MIN]);
  });

  it("están todas las restricciones que el design declara", async () => {
    const constraints = await liveCheckConstraints();

    const esperadas = [
      "child_profiles_coins_non_negative",
      "child_profiles_age_range",
      "tasks_coins_range",
      "reward_assignments_coins_range",
      "reward_redemptions_coins_range",
      "coin_transactions_amount_non_zero",
      "coin_transactions_balance_after_non_negative",
    ];

    const faltan = esperadas.filter((name) => !constraints.has(name));

    expect(
      faltan,
      `Faltan restricciones en la base de datos: ${faltan.join(", ")}. ` +
        "Una migración que recree una tabla puede llevárselas por delante: " +
        "revísalo antes de dar la migración por buena.",
    ).toEqual([]);
  });

  it("el disparador que hace inmutable el historial sigue instalado", async () => {
    const rows = await testPrisma().$queryRawUnsafe<Array<{ tgname: string }>>(
      `SELECT tgname FROM pg_trigger
        WHERE NOT tgisinternal AND tgrelid = 'coin_transactions'::regclass`,
    );

    expect(rows.map((r) => r.tgname)).toContain("coin_transactions_immutable");
  });
});

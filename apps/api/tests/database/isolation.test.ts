import { Client } from "pg";
import { describe, expect, it } from "vitest";
import { getConfig } from "../../src/config/index.js";
import { createChild, createParent, withRollback } from "../support/database.js";

/**
 * Aislamiento de la batería de tests.
 *
 * Cada test corre dentro de una transacción que siempre se deshace, así que el
 * orden no importa y dos tests que tocan las mismas entidades no se ven entre
 * sí. Ver la spec `data-access`, requisito "Los tests se ejecutan contra un
 * esquema real y aislado".
 */

const CORREO_COMPARTIDO = "colision@monedin.test";

describe("aislamiento entre tests", () => {
  it("el primero escribe con un correo concreto", () =>
    withRollback(async (db) => {
      const padre = await createParent(db, { email: CORREO_COMPARTIDO });
      await createChild(db, padre.id, { name: "Del primero" });

      expect(await db.user.count({ where: { email: CORREO_COMPARTIDO } })).toBe(1);
    }));

  it("el segundo escribe el MISMO correo y no choca", () =>
    withRollback(async (db) => {
      // Si el test anterior hubiera dejado su fila, esto reventaría por unicidad.
      const padre = await createParent(db, { email: CORREO_COMPARTIDO });
      await createChild(db, padre.id, { name: "Del segundo" });

      expect(await db.user.count({ where: { email: CORREO_COMPARTIDO } })).toBe(1);
      expect(await db.childProfile.count({ where: { name: "Del primero" } })).toBe(0);
    }));

  it("la base de tests queda vacía tras los anteriores", () =>
    withRollback(async (db) => {
      expect(await db.user.count()).toBe(0);
      expect(await db.childProfile.count()).toBe(0);
      expect(await db.coinTransaction.count()).toBe(0);
    }));
});

describe("la batería no toca la base de datos de desarrollo", () => {
  it("apunta a una base distinta de la de desarrollo", () => {
    const config = getConfig();

    expect(config.TEST_DATABASE_URL).not.toBe(config.DATABASE_URL);
  });

  it("la base de desarrollo conserva su esquema y no recibe filas de los tests", async () => {
    const config = getConfig();
    const dev = new Client({ connectionString: config.DATABASE_URL });

    await dev.connect();
    try {
      // El esquema sigue en pie: la batería recrea la SUYA, no esta.
      const tablas = await dev.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name IN
          ('users','child_profiles','tasks','rewards','reward_assignments',
           'reward_redemptions','coin_transactions')`,
      );
      expect(Number(tablas.rows[0]?.count)).toBe(7);

      // Y ninguno de los datos que fabrican los tests aparece aquí.
      const intrusos = await dev.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM users WHERE email LIKE '%@monedin.test'`,
      );
      expect(Number(intrusos.rows[0]?.count)).toBe(0);
    } finally {
      await dev.end();
    }
  });
});

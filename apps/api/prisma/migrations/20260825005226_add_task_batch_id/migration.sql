-- ---------------------------------------------------------------------------
-- El reparto de una tarea.
--
-- Cuando un padre asigna la misma tarea a varios hijos se crea UNA FILA POR
-- HIJO, cada una con su propio estado. `batchId` es lo que dice cuales nacieron
-- del mismo acto. Agrupar por titulo no vale: uniria dos tareas homonimas
-- creadas en semanas distintas. Ver la decision 4 del design de add-tasks.
--
-- La columna es NOT NULL, y por eso el ALTER va en TRES PASOS. Prisma genera un
-- unico `ADD COLUMN ... NOT NULL` que el motor rechaza sobre una tabla con
-- filas; este archivo esta editado a mano para anadir, rellenar y solo entonces
-- exigir. Cada fila anterior queda como un reparto de una.
--
-- No toca ninguna restriccion existente: es un ADD COLUMN, no recrea la tabla,
-- y `tasks_coins_range` sigue en su sitio. Lo comprueba
-- tests/database/limits-sync.test.ts.
-- ---------------------------------------------------------------------------

-- 1. Anadir la columna, todavia opcional.
ALTER TABLE "tasks" ADD COLUMN "batchId" TEXT;

-- 2. Rellenar lo que ya existia: cada tarea antigua es su propio reparto.
UPDATE "tasks" SET "batchId" = "id" WHERE "batchId" IS NULL;

-- 3. Ahora ya no hay nulos, asi que se puede exigir.
ALTER TABLE "tasks" ALTER COLUMN "batchId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "tasks_parentId_batchId_idx" ON "tasks"("parentId", "batchId");

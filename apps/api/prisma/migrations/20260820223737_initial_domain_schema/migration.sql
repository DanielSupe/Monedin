-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'APPROVED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CoinReason" AS ENUM ('TASK_APPROVED', 'REDEMPTION_APPROVED', 'MANUAL_ADJUSTMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "age" INTEGER,
    "avatar" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT NOT NULL,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coins" INTEGER NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "childId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_assignments" (
    "rewardId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_assignments_pkey" PRIMARY KEY ("rewardId","childId")
);

-- CreateTable
CREATE TABLE "reward_redemptions" (
    "id" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rewardId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,

    CONSTRAINT "reward_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" "CoinReason" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "childId" TEXT NOT NULL,
    "taskId" TEXT,
    "redemptionId" TEXT,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "child_profiles_parentId_deletedAt_idx" ON "child_profiles"("parentId", "deletedAt");

-- CreateIndex
CREATE INDEX "tasks_childId_status_idx" ON "tasks"("childId", "status");

-- CreateIndex
CREATE INDEX "tasks_parentId_createdAt_idx" ON "tasks"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "rewards_parentId_isActive_idx" ON "rewards"("parentId", "isActive");

-- CreateIndex
CREATE INDEX "reward_assignments_childId_idx" ON "reward_assignments"("childId");

-- CreateIndex
CREATE INDEX "reward_redemptions_childId_status_idx" ON "reward_redemptions"("childId", "status");

-- CreateIndex
CREATE INDEX "reward_redemptions_rewardId_idx" ON "reward_redemptions"("rewardId");

-- CreateIndex
CREATE INDEX "coin_transactions_childId_createdAt_idx" ON "coin_transactions"("childId", "createdAt");

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_assignments" ADD CONSTRAINT "reward_assignments_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_assignments" ADD CONSTRAINT "reward_assignments_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_redemptionId_fkey" FOREIGN KEY ("redemptionId") REFERENCES "reward_redemptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Invariantes del dominio, en el motor.
--
-- Prisma no genera restricciones CHECK, asi que van a mano. Estos numeros
-- duplican los de @monedin/contracts: una migracion es un artefacto congelado y
-- no puede importar constantes. Hay un test que compara ambos y falla nombrando
-- la restriccion descuadrada. Ver la decision 4 del design de add-data-model.
--
-- La validacion de entrada protege la puerta principal. Esto protege todo lo
-- demas: una consulta a mano en una madrugada de incidencia, una importacion,
-- un modulo futuro que use update en vez de increment.
-- ---------------------------------------------------------------------------

-- El saldo de un nino NUNCA es negativo.
ALTER TABLE "child_profiles"
  ADD CONSTRAINT "child_profiles_coins_non_negative" CHECK ("coins" >= 0);

-- Edad del producto: 6 a 11. Nula es valida (es un campo opcional).
ALTER TABLE "child_profiles"
  ADD CONSTRAINT "child_profiles_age_range" CHECK ("age" IS NULL OR ("age" >= 6 AND "age" <= 11));

-- Una tarea vale entre 1 y 9999. Cero no: una tarea que no vale nada no ensena
-- nada sobre el valor de las cosas.
ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_coins_range" CHECK ("coins" >= 1 AND "coins" <= 9999);

-- Precio de un premio para un nino concreto.
ALTER TABLE "reward_assignments"
  ADD CONSTRAINT "reward_assignments_coins_range" CHECK ("coins" >= 1 AND "coins" <= 9999);

-- El precio congelado de un canje esta en el mismo rango.
ALTER TABLE "reward_redemptions"
  ADD CONSTRAINT "reward_redemptions_coins_range" CHECK ("coins" >= 1 AND "coins" <= 9999);

-- Un movimiento de cero monedas no es un movimiento.
ALTER TABLE "coin_transactions"
  ADD CONSTRAINT "coin_transactions_amount_non_zero" CHECK ("amount" <> 0);

-- El saldo resultante que registra el historial tampoco puede ser negativo.
ALTER TABLE "coin_transactions"
  ADD CONSTRAINT "coin_transactions_balance_after_non_negative" CHECK ("balanceAfter" >= 0);

-- ---------------------------------------------------------------------------
-- El historial de monedas es inmutable.
--
-- Se eligio un disparador y no revocar privilegios porque el disparador viaja
-- dentro de la migracion: se versiona, se prueba y se aplica igual en cada
-- entorno, sin meter la gestion de permisos de PostgreSQL en el despliegue.
--
-- Corregir un movimiento equivocado se hace anadiendo uno que lo compensa.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "coin_transactions_reject_mutation"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'El historial de monedas es de solo escritura: no se puede % una fila de coin_transactions. Para corregir un movimiento, registra otro que lo compense.',
    lower(TG_OP)
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "coin_transactions_immutable"
  BEFORE UPDATE OR DELETE ON "coin_transactions"
  FOR EACH ROW
  EXECUTE FUNCTION "coin_transactions_reject_mutation"();

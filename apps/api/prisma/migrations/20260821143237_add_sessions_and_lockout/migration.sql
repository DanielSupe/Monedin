-- AlterTable
ALTER TABLE "child_profiles" ADD COLUMN     "failedPinAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childProfileId" TEXT,
    "parentSessionId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_childProfileId_idx" ON "sessions"("childProfileId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_parentSessionId_fkey" FOREIGN KEY ("parentSessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Invariantes de sesion y de bloqueo, en el motor.
--
-- Mismo criterio que la migracion inicial: la validacion de entrada protege la
-- puerta principal, esto protege todo lo demas. Los numeros duplican los de
-- @monedin/contracts y hay un test que compara ambos.
-- ---------------------------------------------------------------------------

-- Los contadores de intentos no pueden ser negativos.
ALTER TABLE "users"
  ADD CONSTRAINT "users_failed_login_attempts_non_negative" CHECK ("failedLoginAttempts" >= 0);

ALTER TABLE "child_profiles"
  ADD CONSTRAINT "child_profiles_failed_pin_attempts_non_negative" CHECK ("failedPinAttempts" >= 0);

-- Una sesion de nino SIEMPRE nace de una sesion de padre, y una de padre nunca
-- tiene una detras. Sin esto, una fila podria decir que es de nino y no tener
-- de donde volver, o decir que es de padre y colgar de otra.
ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_child_requires_parent_session" CHECK (
    ("childProfileId" IS NULL AND "parentSessionId" IS NULL)
    OR
    ("childProfileId" IS NOT NULL AND "parentSessionId" IS NOT NULL)
  );

-- Una sesion no puede colgar de si misma.
ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_not_self_parented" CHECK ("parentSessionId" IS NULL OR "parentSessionId" <> "id");

-- El hash almacenado es un SHA-256 en hexadecimal: 64 caracteres. Si aqui
-- apareciera algo mas corto, seria senal de que se esta guardando otra cosa
-- (por ejemplo el identificador en claro, que es justo lo que no debe pasar).
ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_token_hash_is_sha256" CHECK (char_length("tokenHash") = 64);

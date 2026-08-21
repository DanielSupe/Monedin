-- ---------------------------------------------------------------------------
-- PIN de adulto.
--
-- La columna es obligatoria, pero la tabla puede tener filas. Se crea con un
-- valor por defecto vacio y se retira el defecto acto seguido, de modo que las
-- filas existentes quedan con una cadena vacia.
--
-- Una cadena vacia NO es un PIN utilizable: el verificador no consigue
-- interpretarla como un hash y devuelve "no valida". Falla cerrado, que es lo
-- que tiene que hacer. La siembra regenera los PIN de desarrollo.
-- ---------------------------------------------------------------------------

ALTER TABLE "users" ADD COLUMN "pinHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "users" ALTER COLUMN "pinHash" DROP DEFAULT;

-- Bloqueo del PIN, SEPARADO del de la contrasena: bloquear uno no bloquea el
-- otro. Ver la decision 3 del design de add-profile-selection.
ALTER TABLE "users" ADD COLUMN "failedPinAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "pinLockedUntil" TIMESTAMP(3);

ALTER TABLE "users"
  ADD CONSTRAINT "users_failed_pin_attempts_non_negative" CHECK ("failedPinAttempts" >= 0);

-- ---------------------------------------------------------------------------
-- La sesion pasa a tener dos niveles.
--
-- La restriccion anterior exigia que childProfileId y parentSessionId fueran
-- ambos nulos o ambos no nulos, lo que hacia imposible la forma nueva: el
-- perfil del PADRE activo, que cuelga de una cuenta y no apunta a ningun hijo.
--
--   parentSessionId NULL      -> sesion de cuenta   (childProfileId tambien nulo)
--   parentSessionId NOT NULL  -> perfil activo      (childProfileId nulo = el padre)
--
-- Ver la decision 1 del design de add-profile-selection.
-- ---------------------------------------------------------------------------

ALTER TABLE "sessions" DROP CONSTRAINT "sessions_child_requires_parent_session";

ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_account_has_no_child" CHECK (
    "parentSessionId" IS NOT NULL OR "childProfileId" IS NULL
  );

-- Las sesiones abiertas al desplegar son de la forma antigua y su significado
-- cambia: dejan de conceder poderes y mandan a la rejilla. Se retiran los
-- perfiles activos para que nadie quede dentro sin haber tecleado su PIN.
DELETE FROM "sessions" WHERE "parentSessionId" IS NOT NULL;

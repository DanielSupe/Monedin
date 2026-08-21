## Why

`setup-foundations` dejó el andamio en pie y la base de datos vacía. Hoy no se puede escribir ni un
solo módulo de dominio: hijos, tareas, premios y canjes están todos bloqueados detrás de un esquema
que no existe.

Este change existe para desbloquearlos, pero sobre todo para poner **las reglas del saldo en la base
de datos antes de que haya código que las pueda violar**. Un saldo negativo, una fila de historial
editada o una tarea de 0 monedas son cosas que, si el motor las acepta, acaban ocurriendo: basta un
`update` mal escrito en el cuarto módulo. Escribir esas restricciones ahora cuesta unas líneas de
SQL; añadirlas cuando ya hay datos cuesta una migración correctiva y una conversación sobre qué
hacer con las filas que ya las incumplen.

## What Changes

- **Prisma 7 instalado y cableado**, con las tres condiciones que el spike de `setup-foundations`
  dejó verificadas: la URL en `prisma.config.ts`, el generador `prisma-client` con `output`
  explícito, y `moduleFormat`/`importFileExtension` fijados para que el cliente generado no rompa
  solo en producción.
- **Esquema completo del dominio**: `User`, `ChildProfile`, `Task`, `Reward`, `RewardAssignment`,
  `RewardRedemption` y `CoinTransaction`, con sus enums, índices y relaciones.
- **Invariantes del saldo como restricciones del motor**, no solo como reglas de código: saldo nunca
  negativo, rangos de monedas y de edad, e historial de monedas físicamente inmutable.
- **Historial de monedas append-only**: cada movimiento deja su fila, con el saldo resultante, y
  ninguna fila se puede editar ni borrar.
- **Capa de acceso a datos**: un único punto que construye el cliente, y la traducción de errores de
  la base de datos a errores de dominio para que un choque de unicidad no salga como un 500.
- **BREAKING — el niño deja de ser un `User`.** Vive entero como `ChildProfile`, con su nombre y su
  PIN. `User` pasa a ser exclusivamente el padre.
- **BREAKING — `Actor` pasa a ser una unión discriminada.** El tipo actual exige un `userId` para
  todo el mundo y un niño ya no tiene ninguno.
- **Borrado lógico** de hijos (`deletedAt`) y de premios (`isActive`), para no destruir historial.
- **`prisma.config.ts` se convierte en la segunda y última excepción** a la prohibición de leer el
  entorno fuera del módulo de configuración.

### Desviaciones respecto a los documentos de producto

Se registran aquí en vez de aplicarse en silencio:

- **`User.familyRole` desaparece.** `config.yaml` describe dos tipos de usuario discriminados por ese
  campo, pero si solo los padres son `User`, la columna vale siempre `PARENT`. `FamilyRole`
  sobrevive como tipo de dominio, que es lo que usa el actor.
- **El niño no tiene `username`.** Accede con perfil y PIN, así que `USERNAME_MIN_LENGTH` y
  `USERNAME_MAX_LENGTH` quedan sin consumidor y se sustituyen por la longitud del PIN.
- **`TaskStatus.REJECTED` no se crea.** Rechazar una tarea la devuelve a `PENDING`; un valor de enum
  que ningún flujo produce es una invitación a que alguien lo use mal.
- **`Task.coins` tiene mínimo 1, no 0.** Una tarea que no vale nada no enseña nada sobre el valor de
  las cosas.

### No incluye

- **Ninguna autenticación, sesión ni verificación de PIN.** Este change crea las columnas donde vive
  una credencial, pero nada que las lea, escriba o compruebe. Las tablas de sesión llegan en
  `add-authentication`, cuando se elija el proveedor que define su forma.
- **Ningún endpoint ni módulo de dominio.** No se añade una sola ruta bajo `/api/v1`. Los servicios
  de hijos, tareas, premios y canjes llegan en sus propios changes.
- **Ninguna pantalla.** El front no se toca.
- **Ninguna subida de archivos.** `ChildProfile.avatar` y `Reward.image` son columnas de texto; qué
  guardan y cómo llega ahí se decide en `add-file-storage`.
- **`health` sigue sin consultar la base de datos.** Es sonda de vida y lo seguirá siendo; que ahora
  exista un esquema no cambia esa decisión.
- **Sin datos de ejemplo en entornos reales.** Habrá una siembra para desarrollo y tests, nunca algo
  que se ejecute en producción.
- **Sin optimización de consultas más allá de los índices evidentes.** Con cero usuarios, afinar es
  adivinar.

## Capabilities

### New Capabilities

- `family-data-model`: qué entidades existen, de quién es cada una y cómo se relacionan. Cubre que un
  hijo pertenece a exactamente un padre, que el motor impide datos imposibles (edades fuera de rango,
  tareas sin valor), y que el borrado lógico oculta sin destruir.
- `coin-ledger`: el saldo y su historial. Cubre que el saldo nunca es negativo, que todo movimiento
  deja rastro, que ese rastro es inmutable y que saldo e historial no pueden divergir.
- `data-access`: cómo el sistema habla con la base de datos. Cubre las migraciones versionadas y
  aplicables desde cero, la conexión por adaptador configurado, el cliente accesible únicamente desde
  la capa de repositorio, y la traducción de errores del motor a errores de dominio.

### Modified Capabilities

- `runtime-configuration`: el requisito "Punto único de lectura del entorno" declara que ningún
  componente fuera del módulo de configuración lee variables de entorno. `prisma.config.ts` tiene que
  leer `DATABASE_URL` porque es un archivo de tiempo de CLI, anterior a que exista un proceso de API
  que pueda validar nada. El requisito pasa a admitir una **lista cerrada y declarada** de
  excepciones, en vez de ninguna.

## Impact

**Se crea**: `apps/api/prisma/schema.prisma` y su migración inicial, `prisma.config.ts` en la raíz de
la API, y la capa de acceso a datos en `apps/api/src/shared/database/`.

**Se modifica**: `apps/api/src/shared/actor.ts` (unión discriminada),
`packages/contracts/src/constants/domain.ts` (constantes de username fuera, PIN dentro, más los
valores que la migración replica), `apps/api/eslint.config.js` (segunda excepción),
`apps/api/tsconfig.json` (el cliente generado entra al build), `turbo.json` (tarea de generación de
la que dependen `build`, `typecheck` y `test`), `.gitignore` y `.env.example`.

**Dependencias nuevas**: `prisma` y `@prisma/client` 7.x, más `@prisma/adapter-pg` y `pg`, que el
modelo de adaptadores de Prisma 7 hace obligatorios.

**Compromisos que adquieren los changes siguientes**: el repositorio es el único lugar que importa el
cliente; toda mutación de saldo va acompañada de su fila de historial en la misma transacción; toda
transición de estado es condicional y comprueba que afectó exactamente una fila. A partir de aquí,
saltarse esto no compila, no pasa los tests o lo rechaza el motor.

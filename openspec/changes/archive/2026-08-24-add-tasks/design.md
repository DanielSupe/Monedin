## Context

Ver `proposal.md` para la motivación. Lo que condiciona el diseño es lo que ya existe:

- **`applyCoinMovement` está construido y probado** (`shared/database/coin-ledger.ts`). Recibe la
  transacción como primer argumento, modifica el saldo con `increment`, escribe la fila de historial
  en la misma transacción y comprueba que afectó una fila. `tasks` es su **primer cliente real**: hoy
  solo lo usan sus propios tests.
- **Nadie ha abierto todavía una transacción interactiva en producción.** El único `$transaction` de
  `src/modules/` es la forma de array que pagina hijos. `tasks` estrena el patrón.
- **El patrón de paginación existe** desde `add-children`: `paginationQuerySchema`, `pageOf()`,
  `toSkipTake`/`toPage`. Se diseñó para reutilizarse con `.extend()`, y aquí se cobra esa apuesta.
- **`Task` ya tiene** `dueDate`, `@@index([childId, status])` y `@@index([parentId, createdAt])`.
  Solo falta el reparto.
- El `CHECK` `tasks_coins_range` (1..9999) ya está en el motor desde la migración inicial.

## Goals / Non-Goals

**Goals:**

- Que aprobar dos veces acredite una sola, y que eso esté demostrado por un test de concurrencia real
  y no por un comentario.
- Dejar escrito el patrón de transacción interactiva que copiarán los canjes, que descuentan.
- Que el listado del padre sea utilizable como bandeja de aprobación sin inventar un endpoint nuevo.

**Non-Goals:**

- Rendimiento. Una familia tiene decenas de tareas, no millones.
- Un mecanismo general de idempotencia por clave de petición. La condición sobre el estado basta y no
  añade superficie.
- Exponer el historial de monedas. Se escribe, no se lee todavía.

## Decisions

### 1. La idempotencia sale de la transición condicional, no del libro mayor

Es la decisión que sostiene el change entero, y conviene ser explícito porque es fácil suponer lo
contrario: **`applyCoinMovement` no es idempotente.** Dos llamadas idénticas acreditan dos veces, y
su propio test de doble toque solo comprueba que el saldo cuadra con la suma del historial, con un
comentario que dice que la protección real «llega con su módulo». Este es ese módulo.

```
   Aprobar, mal                          Aprobar, bien
   ────────────                          ─────────────
   leer la tarea                         UPDATE tasks SET status='APPROVED'
   si status == COMPLETED:                 WHERE id = ? AND status = 'COMPLETED'
     UPDATE status = APPROVED            si filas != 1 -> ConflictError
     applyCoinMovement(...)              applyCoinMovement(tx, ...)
                                         todo en UNA transacción
   dos taps -> acredita dos veces        dos taps -> el segundo da 409
```

El orden importa: **primero la transición, después la acreditación**. Al revés, el segundo toque
acreditaría antes de descubrir que perdió la carrera.

### 2. Read Committed basta; ni `Serializable` ni mapear `P2034`

`UPDATE ... WHERE id = ? AND status = 'COMPLETED'` toma un bloqueo de fila. La segunda transacción
espera, y cuando entra reevalúa el predicado sobre la versión ya confirmada: el estado es `APPROVED`
y afecta a cero filas. No hay ventana.

Es el mismo mecanismo con el que `applyCoinMovement` evita saldos negativos (`coins: { gte: -amount }`),
ya validado por sus tests de concurrencia. Como corolario **no hace falta subir el nivel de
aislamiento**, y por tanto tampoco mapear `P2034` en `translate-error.ts`, que hoy no está y saldría
como 500 con `incidentId`: el síntoma que nadie sabría diagnosticar.

**Alternativa descartada:** nivel `Serializable`. Resolvería lo mismo a cambio de reintentos, un
código de error nuevo que traducir y una clase de fallo intermitente. No compensa para una condición
que el motor ya resuelve con un bloqueo de fila.

### 3. Cero filas es 409 aquí y era 404 en la baja de un hijo

`add-children` estableció que dar de baja dos veces responde 404 y no 409, porque la baja no acredita
nada y quien pierde la carrera pregunta por un hijo que ya no existe. **Aquí es al revés, y la regla
que las distingue es la misma:**

> El 409 es para transiciones **con efecto secundario**. Aprobar acredita monedas, así que quien
> pierde la carrera tiene que enterarse de que no acreditó. Un 404 le haría creer que la tarea
> desapareció.

Por coherencia, las tres transiciones responden 409 cuando el estado de origen no es el esperado,
incluidas `complete` y `reject`, que no mueven monedas: son transiciones y su estado de origen
importa.

Se mantiene 404 para la tarea **ajena o inexistente**, indistinguibles entre sí.

### 4. `batchId` es una columna, no una heurística

Agrupar por título mezcla repartos que nunca existieron y rompe la paginación. La única forma exacta
es registrar el acto:

```prisma
/// Identificador del reparto: las filas creadas en el mismo POST lo comparten.
batchId String
@@index([parentId, batchId])
```

**No es nullable, y las filas existentes se rellenan en la migración** dándole a cada una su propio
reparto de uno. Una columna opcional obligaría a tratar «sin reparto» en cada consulta y en cada
pantalla, para siempre, por unas pocas filas sembradas.

```sql
ALTER TABLE "tasks" ADD COLUMN "batchId" TEXT;
UPDATE "tasks" SET "batchId" = "id" WHERE "batchId" IS NULL;
ALTER TABLE "tasks" ALTER COLUMN "batchId" SET NOT NULL;
CREATE INDEX "tasks_parentId_batchId_idx" ON "tasks"("parentId", "batchId");
```

El identificador lo genera la aplicación al crear el reparto, no el motor: hace falta conocerlo antes
de insertar las filas para que todas lo compartan.

### 5. Se pagina por reparto, en dos consultas

El listado del padre devuelve grupos, así que la unidad de paginación es el grupo. Se resuelve en dos
pasos dentro de la misma transacción:

1. Los `batchId` del padre que cumplen el filtro, ordenados y con `skip`/`take`, más su total.
2. Todas las tareas de esos repartos.

Ordenar por el reparto y no por la fila es lo que garantiza que **un reparto no se parta entre
páginas**, que es un requisito de la spec y no una comodidad.

**Alternativa descartada:** paginar filas y agrupar después. Es una línea menos y produce grupos
truncados en cada frontera de página.

El filtro por estado se aplica a las **tareas**, y un reparto entra en el listado si alguna de sus
tareas lo cumple; se muestra entero, para que el padre vea el reparto completo aunque solo una esté
para aprobar. Se dice aquí porque es una decisión, no una consecuencia.

**El filtro por hijo no se comporta igual, y esto se añadió al implementar.** Este párrafo solo
hablaba del estado, y aplicar la misma regla al hijo contradecía la spec: «filtra por uno de sus
hijos → obtiene solo las tareas de ese hijo». Así que el hijo **sí** filtra también lo que se
muestra. La diferencia tiene sentido: filtrar por estado es preguntar «¿qué me toca?» y la respuesta
útil es el reparto entero; filtrar por hijo es preguntar por Ana, y colar las de su hermano no es lo
que se pidió.

### 6. La transacción vive en el repositorio

`CLAUDE.md` §2 y una regla de ESLint impiden importar el cliente fuera de `*.repository.ts`. Así que
`getPrisma().$transaction(async (tx) => ...)` va en `tasks.repository.ts`, y el servicio le pasa los
datos ya autorizados.

Eso obliga a que la comprobación de estado viva dentro del repositorio, que es donde se sabe cuántas
filas se afectaron. El repositorio lanza el error de dominio; **sigue sin saber de roles ni de
pertenencia**, que es lo que decide el servicio antes de llamarlo.

`applyCoinMovement` lanza `ConflictError`/`NotFoundError` directos, sin pasar por
`withTranslatedErrors`. La transacción sí se envuelve, para que un fallo del motor —una clave ajena,
una restricción— salga traducido.

### 7. POST para las transiciones, no PATCH

`config.yaml` documentaba `PATCH /:id/complete`. Se cambia a POST: aprobar no es una actualización
parcial de un recurso, tiene un efecto secundario sobre otro (el saldo) y no es idempotente. El
precedente del proyecto son las acciones de `auth` (`/auth/profiles/enter`,
`/auth/child-profiles/:id/unlock`), todas POST. Se actualiza `config.yaml` en este change.

### 8. Las dos formas del alta, validadas en el contrato

```ts
A) { title, description?, dueDate?, childIds: [...], coins }
B) { title, description?, dueDate?, assignments: [{ childId, coins }] }
```

Un `.refine()` exige exactamente una: con las dos o con ninguna, 422. Se resuelve en el esquema
compartido y no en el servicio, para que el front rechace el formulario sin viaje al servidor y con
el mismo criterio.

Internamente ambas se normalizan a una lista de `{ childId, coins }` antes de tocar nada, de modo que
el servicio tiene un solo camino.

### 9. El front invalida el saldo, no solo la lista

Aprobar cambia dos cosas: el estado de la tarea y el saldo del hijo. El saldo viaja **dentro del
actor** de `GET /auth/session` y también en `GET /children/me`, así que aprobar invalida
`tasksQueryKey`, `sessionQueryKey` y `ownChildQueryKey`. Olvidar el segundo deja al niño viendo su
saldo viejo justo después de que le paguen, que es el momento en el que más mira.

`describeTasksError` propio, por la misma razón que lo tiene `children`: aquí un 409 significa
«alguien se te adelantó» o «esa tarea ya no está pendiente», no el tope de perfiles.

## Risks / Trade-offs

**Se acredita en una transacción interactiva, la primera del proyecto** → Son tres operaciones cortas
sobre dos tablas, sin llamadas externas dentro. No se toca el timeout por defecto; si algún día hiciera
falta, el sitio es esa llamada y no una configuración global.

**El bloqueo de fila serializa las aprobaciones del mismo hijo** → Es lo que se quiere. Y son
aprobaciones de una familia, no un sistema de pagos.

**Un padre puede cambiar el valor de una tarea pendiente que su hijo ya vio** → Se acepta: sigue
pendiente, nadie ha hecho nada todavía. Lo que no se permite es cambiarla una vez marcada, que es
cuando el niño ya trabajó por ese número.

**La migración añade una columna NOT NULL a una tabla con filas** → El relleno va en la misma
migración, antes del `SET NOT NULL`. Hay que revisar el SQL generado a mano: `CLAUDE.md` §6 avisa de
que una migración generada puede llevarse por delante las restricciones que Prisma no conoce. Aquí es
un `ALTER TABLE ADD COLUMN` y no debería recrear la tabla, pero el test de coherencia de límites lo
comprueba y hay que verlo pasar.

**Filtrar por estado devuelve el reparto entero** → Decidido en la decisión 5. Si resulta molesto en
uso, cambiarlo es un filtro en la segunda consulta, sin tocar el contrato.

## Migration Plan

Una migración, la primera desde el modelo inicial. Añade la columna, rellena las filas existentes y
crea el índice, en ese orden y en el mismo archivo. No modifica ninguna restricción ni ningún dato
existente más allá de darle a cada tarea antigua su propio reparto.

Revertir es retirar el commit y la migración; ninguna fila anterior queda alterada de forma que
importe, porque `batchId` no existía y nada lo leía.

El resto del despliegue es el habitual: `pnpm db:generate`, lint, typecheck, tests.

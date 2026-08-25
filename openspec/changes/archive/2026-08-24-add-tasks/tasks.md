## 1. La migración

- [x] 1.1 Añadir `batchId String` y `@@index([parentId, batchId])` al modelo `Task` en
      `apps/api/prisma/schema.prisma`, con el comentario de qué es un reparto.
- [x] 1.2 Generar la migración y **editar el SQL a mano** para que sea en tres pasos: añadir la
      columna nullable, rellenar las filas existentes con `batchId = id`, y solo entonces
      `SET NOT NULL`. Una columna obligatoria sobre una tabla con filas no se añade de una vez.
- [x] 1.3 Revisar que el SQL generado no recrea la tabla ni se lleva por delante `tasks_coins_range`,
      y correr `pnpm db:generate` y `tests/database/limits-sync.test.ts` en verde.

## 2. Contratos compartidos

- [x] 2.1 Crear `packages/contracts/src/schemas/tasks.ts` con `taskStatusSchema`,
      `createTaskSchema` (las dos formas, con `.refine()` que exige exactamente una),
      `updateTaskSchema`, `taskParamsSchema`, `listTasksQuerySchema` y `listOwnTasksQuerySchema`,
      todos los de entrada `.strict()`.
- [x] 2.2 Definir las respuestas: `taskSchema` (una tarea con su hijo, valor y estado),
      `taskBatchSchema` (el reparto con sus asignaciones) y `taskBatchesPageSchema` /
      `ownTasksPageSchema` usando `pageOf()`. Fechas en ISO 8601 con `z.string().datetime()`.
- [x] 2.3 Extender la paginación con los filtros usando `paginationQuerySchema.extend({ ... })` —
      es justo el caso para el que se diseñó el patrón— y exportar el archivo desde `src/index.ts`.
- [x] 2.4 Tests en `packages/contracts/tests/contracts.test.ts`: las dos formas del alta se aceptan
      por separado, con las dos a la vez falla, sin ninguna falla, `coins` fuera de rango falla,
      un `childId` en la edición falla, y los filtros de estado rechazan un valor inventado.

## 3. Módulo `tasks`: datos y transiciones

- [x] 3.1 Crear `apps/api/src/modules/tasks/tasks.errors.ts` con `TaskNotFoundError`,
      `TaskNotEditableError`, `TaskTransitionConflictError`, `ParentRoleRequiredError` y
      `ChildRoleRequiredError`, y añadir la sección `tasks` al catálogo de mensajes de la API.
- [x] 3.2 Crear `tasks.repository.ts` con el alta del reparto: genera un `batchId`, inserta una fila
      por hijo **en una sola operación**, y devuelve el grupo creado.
- [x] 3.3 Implementar `findChildIdsOwnedBy(parentId, ids)` para que el servicio pueda comprobar de
      una vez que todos los hijos son suyos y están activos, antes de crear nada.
- [x] 3.4 Implementar `findTaskBatchesPage()` en **dos consultas dentro de la misma transacción**:
      primero los `batchId` que cumplen el filtro con `skip`/`take` y su total, después las tareas de
      esos repartos. Es lo que impide que un reparto se parta entre páginas.
- [x] 3.5 Implementar `findOwnTasksPage()` para el niño, plano y paginado, con el desempate por `id`
      en el `orderBy` como exige el patrón de paginación.
- [x] 3.6 Implementar `transition(taskId, from, to)` como `updateMany` condicional con el estado de
      origen en el `WHERE`, comprobando que afectó **exactamente una fila**. Es lo que usan completar
      y rechazar.
- [x] 3.7 Implementar `approve(taskId, childId, coins)`: **la primera transacción interactiva de
      producción del proyecto**. Transición condicional primero, comprobación de una fila, y
      `applyCoinMovement(tx, { reason: "TASK_APPROVED", taskId })` después, todo dentro del mismo
      `$transaction`. El orden importa y lleva comentario.
- [x] 3.8 Implementar la edición y el borrado condicionados a `status: "PENDING"` en el `WHERE`, para
      que el conflicto de estado lo detecte el motor y no una lectura previa.

## 4. Módulo `tasks`: reglas y autorización

- [x] 4.1 Crear `tasks.service.ts` con `createBatch(actor, input)`: normaliza las dos formas del alta
      a una lista de `{ childId, coins }`, comprueba **todos** los hijos antes de crear nada, y crea.
- [x] 4.2 Implementar `listBatches` y `getTask` para el padre, con el patrón de autorización de la
      casa: rol primero, pertenencia después, y **404 y no 403** para una tarea ajena.
- [x] 4.3 Implementar `listOwnTasks` y `getOwnTask` para el niño tomando el perfil de
      `actor.childProfileId`, nunca de la petición.
- [x] 4.4 Implementar `updateTask` y `deleteTask`, que traducen el «cero filas afectadas» a conflicto
      de estado, distinguiéndolo del 404 de una tarea que no es suya.
- [x] 4.5 Implementar `completeTask` (niño dueño), `approveTask` y `rejectTask` (padre dueño), cada
      una con su estado de origen y su conflicto.

## 5. Módulo `tasks`: HTTP

- [x] 5.1 Crear `tasks.controller.ts` con `validatedPart`, `actorOf`, 201 en el alta y 200 en las
      transiciones devolviendo la tarea resultante. Cero autorización.
- [x] 5.2 Crear `tasks.routes.ts` con las nueve rutas y **`/tasks/mine` registrada antes que
      `/tasks/:taskId`**, con el comentario del fallo silencioso que evita. Transiciones por POST.
- [x] 5.3 Registrar `tasksRouter` en `apps/api/src/app.ts`.

## 6. Tests del reparto y los listados

- [x] 6.1 Alta: las dos formas, una fila por hijo, todas con el mismo `batchId`, todas en PENDING y
      con saldo sin tocar.
- [x] 6.2 Alta, todo o nada: con un hijo ajeno, uno dado de baja o un id inexistente entre los
      indicados, se rechaza y **no queda ninguna fila creada**, tampoco las de los hijos válidos.
- [x] 6.3 Alta, validación: las dos formas a la vez y ninguna dan 422; `coins` en 0 y en 10000 dan
      422 **antes** de tocar la base; un niño creando tareas recibe 403.
- [x] 6.4 Listado del padre: agrupado por reparto, con el hijo, el valor y el estado de cada tarea; el
      total cuenta **repartos** y no filas.
- [x] 6.5 Listado del padre, paginación: un reparto nunca se parte entre páginas, y recorrer todas
      devuelve cada reparto exactamente una vez.
- [x] 6.6 Filtros: por estado —«completadas» es la bandeja de aprobación— y por hijo.
- [x] 6.7 Listado del niño: solo las suyas, con su valor; ninguna de su hermano; un padre pidiéndolo
      recibe 403 y un niño pidiendo el del padre también.
- [x] 6.8 Aislamiento: un padre no ve ni toca tareas de otra familia, y el 404 es indistinguible del
      de un identificador inventado.

## 7. Tests de las transiciones

- [x] 7.1 Completar: el niño dueño marca una pendiente y su saldo NO cambia; sobre la de un hermano
      recibe 404; sobre una ya aprobada, 409; un padre, 403.
- [x] 7.2 Aprobar, camino feliz: la tarea queda aprobada, el saldo sube **exactamente** su valor, y
      queda una entrada de historial enlazada a esa tarea.
- [x] 7.3 Aprobar, estados: sobre una pendiente da 409 y no acredita; sobre una ya aprobada, 409 y el
      saldo no cambia; un niño aprobando, 403.
- [x] 7.4 **Doble toque sobre aprobar**: dos peticiones simultáneas dan un éxito y un 409, el saldo
      sube una sola vez y hay **una única fila** de historial. Es el test que justifica el change.
- [x] 7.5 Doble toque sobre completar y sobre rechazar: uno gana, el otro 409.
- [x] 7.6 Atomicidad: si la acreditación no puede completarse, la tarea sigue sin aprobar y el saldo
      es el que era. Reutilizar el patrón de `coin-ledger.test.ts`, que ya prepara datos fuera de
      transacción para la concurrencia real.
- [x] 7.7 Rechazar: vuelve a pendiente, el niño puede volver a marcarla, el saldo no cambia, y sobre
      una aprobada o una pendiente da 409.
- [x] 7.8 Editar y borrar: en PENDING funcionan; en COMPLETED y APPROVED dan 409 y la tarea sigue
      igual, con su historial intacto si lo tiene.
- [x] 7.9 Fecha límite: una tarea vencida se completa y se aprueba con normalidad y por su valor
      completo; pasar la fecha no cambia el estado.
- [x] 7.10 Fugas: ninguna respuesta contiene `parentId` ni datos de otra familia.

## 8. Front

- [x] 8.1 Crear `apps/web/src/api/tasks.ts` con las llamadas y sus claves de consulta propias.
- [x] 8.2 Crear `features/tasks/use-tasks.ts` con los hooks y las invalidaciones: aprobar invalida el
      listado **y** la sesión **y** el perfil propio del niño, porque el saldo viaja dentro del actor.
- [x] 8.3 Escribir `describeTasksError`, que traduce el 409 como «esa tarea ya no está pendiente» y
      no como el tope de perfiles, con el test que impide reutilizar el de `children`.
- [x] 8.4 Añadir el bloque `tasks` a `lib/messages.ts`.
- [x] 8.5 Crear `features/tasks/TaskForm.tsx`: título, descripción, fecha límite opcional, selector
      de varios hijos y valor —el mismo para todos o uno por hijo—, validando con el esquema del
      contrato antes de enviar.
- [x] 8.6 Crear `features/tasks/TaskBatchList.tsx`: los repartos agrupados con el estado de cada hijo,
      y las acciones de aprobar y rechazar sobre las completadas.
- [x] 8.7 Crear la ruta `routes/tasks.tsx` envuelta en `ParentOnly` con su `fallback`, y enlazarla
      desde la home del padre.
- [x] 8.8 Crear `features/tasks/MyTasks.tsx` para el niño: sus tareas con su valor y el botón de
      marcarla hecha, con entrada desde su home.
- [x] 8.9 Tests en `apps/web/tests/tasks-client.test.ts`: las rutas salen del contrato, el query
      string de los filtros es el esperado, el alta no envía campos de más, y una página sin `items`
      falla como forma inesperada.

## 9. Sembrado y cierre

- [x] 9.1 Actualizar `apps/api/prisma/seed.ts` para que siembre tareas en los tres estados y una
      acreditación real con `TASK_APPROVED` enlazada a su tarea, en vez de solo pendientes y un ajuste
      manual. Y que asigne `batchId` a lo que crea.
- [x] 9.2 Actualizar `openspec/config.yaml`: mover `/tasks` a lo construido, con POST en las
      transiciones, y cerrar la pregunta abierta del borrado.
- [x] 9.3 Documentar en `CLAUDE.md` el patrón de transacción interactiva que estrena este change, y
      que la idempotencia viene de la transición condicional y no del libro mayor.
- [x] 9.4 Pasar `pnpm db:generate`, `lint`, `typecheck` y `test` en verde **desde `apps/api`** para la
      batería de la API, nunca con `npx vitest` en la raíz.
- [x] 9.5 Recorrer a mano con `pnpm dev`: repartir una tarea entre dos hijos, entrar como uno y
      marcarla, volver como padre y aprobarla, comprobar que el saldo sube una sola vez, y rechazar
      otra para verla volver a pendiente.
- [x] 9.6 Sincronizar las specs y archivar el change.

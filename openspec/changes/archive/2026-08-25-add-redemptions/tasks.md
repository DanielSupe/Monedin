## 1. Contratos compartidos

- [x] 1.1 Añadir a `packages/contracts/src/constants/domain.ts`: `REDEMPTION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const` y su tipo `RedemptionStatus`.
- [x] 1.2 Crear `packages/contracts/src/schemas/redemptions.ts`: `redemptionStatusSchema`,
      `createRedemptionSchema` (`.strict()`, solo `{ rewardId }`), `redemptionParamsSchema`,
      `listRedemptionsQuerySchema` (extiende `paginationQuerySchema` con `status` y `childId`
      opcionales, padre), `listOwnRedemptionsQuerySchema` (igual sin `childId`, niño),
      `redemptionSchema` (con `child`) y `ownRedemptionSchema` (sin `child`), y sus páginas con
      `pageOf()`.
- [x] 1.3 Exportar el archivo nuevo desde `packages/contracts/src/index.ts`.
- [x] 1.4 Tests en `packages/contracts/tests/contracts.test.ts`: `createRedemptionSchema` rechaza
      `childId` o `coins` en el cuerpo; `listOwnRedemptionsQuerySchema` rechaza `childId`; el filtro
      de estado rechaza un valor inventado.

## 2. Módulo `redemptions`: datos

- [x] 2.1 Crear `apps/api/src/modules/redemptions/redemptions.errors.ts` con
      `RedemptionNotFoundError`, `RedemptionTransitionConflictError`, `InsufficientBalanceError`,
      `DuplicatePendingRedemptionError`, `ParentRoleRequiredError`, `ChildRoleRequiredError`. Todos
      `ConflictError`/`NotFoundError`/`ForbiddenError` según CLAUDE.md sección 3, con el comentario
      de por qué el saldo insuficiente AL APROBAR no tiene clase propia (ver decisión 3 del design).
- [x] 2.2 Añadir el bloque `redemptions` a `apps/api/src/shared/messages/index.ts`: `notFound`,
      `transitionConflict`, `insufficientBalance`, `duplicatePending`, `parentRoleRequired`/
      `childRoleRequired` (reutilizando `rolRequerido`).
- [x] 2.3 Crear `redemptions.repository.ts` con `REDEMPTION_FIELDS` (`id`, `coins`, `status`,
      `createdAt`, `updatedAt`, `reward: {id,title}`, `child: {id,name,avatar}`) y el tipo
      `RedemptionRow`.
- [x] 2.4 Implementar `findOfferForChild(rewardId, childId)`: una lectura por la clave compuesta
      `rewardAssignment.findUnique({ where: { rewardId_childId: { rewardId, childId } } })` que trae
      `coins` de la oferta, `reward.isActive` y `child.coins`, en un solo viaje.
- [x] 2.5 Implementar `existsPendingRedemption(rewardId, childId)`: `rewardRedemption.findFirst({
      where: { rewardId, childId, status: "PENDING" }, select: { id: true } })` (o `count`), para el
      bloqueo de duplicados de la decisión 9 del design.
- [x] 2.6 Implementar `createRedemption({ childId, rewardId, coins })`: `create` simple, sin
      transacción (una sola fila).
- [x] 2.7 Implementar `findRedemptionById(id)` devolviendo `RedemptionRow & { parentId: string }`
      (de `child.parentId`), para que el servicio decida pertenencia por los dos roles.
- [x] 2.8 Implementar `findRedemptionsPage(parentId, filters: {status?, childId?}, {skip,take})`:
      `where: { child: { parentId }, ...filtros }`, contar y leer en la misma transacción,
      desempate por `id` en el `orderBy`.
- [x] 2.9 Implementar `findOwnRedemptionsPage(childId, filters: {status?}, {skip,take})`, mismo
      patrón sobre `childId`.
- [x] 2.10 Implementar `transition(redemptionId, from, to)`, copia de `tasks.repository.transition`
      sobre `rewardRedemption` — la usa el rechazo.
- [x] 2.11 Implementar `approve(redemptionId, childId, coins)`, copia de
      `tasks.repository.approve()`: `updateMany` condicional `PENDING → APPROVED` (409 si
      `count !== 1`), y solo entonces `applyCoinMovement(tx, { childId, amount: -coins, reason:
      "REDEMPTION_APPROVED", redemptionId })` sin capturar su `ConflictError` (decisión 1 y 3 del
      design); relee con `REDEMPTION_FIELDS`.

## 3. Módulo `redemptions`: reglas, autorización y HTTP

- [x] 3.1 Crear `redemptions.service.ts` con `createRedemption(actor, input)`: exige `CHILD`, llama
      `findOfferForChild` (si es `null` o `!reward.isActive` → `RewardNotFoundError` reutilizado de
      `rewards.errors.ts`, decisión 6 del design), luego `existsPendingRedemption` (→
      `DuplicatePendingRedemptionError` si ya hay uno), luego compara saldo (→
      `InsufficientBalanceError` si no alcanza), y solo entonces crea.
- [x] 3.2 Implementar `listRedemptions`/`getRedemption` (padre) y `listOwnRedemptions`/
      `getOwnRedemption` (niño, perfil siempre de `actor.childProfileId`).
- [x] 3.3 Implementar `getRedemptionForActor`, que ramifica por rol en el servicio (patrón de
      `tasks`/`rewards`, nunca en el controlador).
- [x] 3.4 Implementar `approveRedemption`/`rejectRedemption` con el auxiliar
      `ownedRedemption(actor, redemptionId)`: exige `PARENT` y `found.parentId === actor.userId`
      (filtro por `child.parentId`, decisión 4 del design), 404 y no 403 para uno ajeno.
- [x] 3.5 Implementar `toRedemption`/`toOwnRedemption` con `resolveAvatarKey` para el avatar del
      hijo en la vista del padre.
- [x] 3.6 Crear `redemptions.controller.ts`: `handleCreate` (201, `OwnRedemption`), `handleList`,
      `handleOwnList`, `handleDetail`, `handleApprove`, `handleReject` (200 con el canje resultante,
      no 204 — mismo argumento que `tasks`).
- [x] 3.7 Crear `redemptions.routes.ts` con `moduleRouter()` y las seis rutas, con
      **`/redemptions/mine` registrada antes que `/redemptions/:redemptionId`** (comentario
      explícito del fallo silencioso, decisión 7 del design):
      ```
      POST   /redemptions                        niño    solicitar
      GET    /redemptions                        padre   bandeja paginada
      GET    /redemptions/mine                   niño    sus solicitudes
      GET    /redemptions/:redemptionId          ambos   detalle
      POST   /redemptions/:redemptionId/approve  padre
      POST   /redemptions/:redemptionId/reject   padre
      ```
- [x] 3.8 Registrar `redemptionsRouter` en `apps/api/src/app.ts` y comprobar que el test
      `account-only-routes` sigue en verde: ninguna ruta de `redemptions` es de solo cuenta.

## 4. Tests del backend: alta

- [x] 4.1 Crear `apps/api/tests/support/redemptions.ts`: `sembrarCanje(owners, overrides)`
      saltándose la API, reutilizando `familiaOperando`/`saldoDe`/`fijarSaldo` de `support/tasks.ts`
      y `sembrarPremio` de `support/rewards.ts`; `estadoDeCanje(id)` y
      `movimientosDeCanje(redemptionId)`.
- [x] 4.2 `apps/api/tests/redemptions/redemptions-create.test.ts`: camino feliz (precio congelado =
      precio de la oferta en ese momento); premio inexistente, retirado o no ofertado → 404
      indistinguible; duplicado pendiente del mismo premio → 409 y no se crea una segunda fila;
      saldo insuficiente → 409 y no se crea fila; un padre no solicita (403); campos de más
      (`childId`, `coins`) → 422.

## 5. Tests del backend: lecturas

- [x] 5.1 `apps/api/tests/redemptions/redemptions-list.test.ts`: bandeja del padre con filtro por
      `status` y por `childId`; `GET /redemptions/mine` solo trae lo del niño de la sesión; paginación
      con desempate y página posterior a la última en vacío; detalle sirve a los dos roles con su
      forma (`Redemption` con `child`, `OwnRedemption` sin `child`); un canje ajeno o inexistente →
      404 para los dos roles; niño pidiendo la bandeja del padre y viceversa → 403.

## 6. Tests del backend: transiciones y saldo

- [x] 6.1 `apps/api/tests/redemptions/redemptions-transitions.test.ts`: aprobar un `PENDING`
      descuenta exactamente el precio congelado (no el precio actual de la oferta si el padre lo
      cambió mientras tanto); aprobar/rechazar dos veces sobre el mismo id ya resuelto → 409;
      rechazar no mueve monedas; retirar el premio o quitarle la oferta al hijo mientras el canje
      sigue `PENDING` no impide aprobarlo ni rechazarlo después (test explícito de la decisión 8 del
      spec); un niño no aprueba ni rechaza (403).
- [x] 6.2 `apps/api/tests/redemptions/redemptions-concurrency.test.ts` (contra la app por HTTP, sin
      `withRollback`, patrón de `tasks-concurrency.test.ts`):
  - Doble tap sobre `approve`: un 200 + un 409, el saldo baja UNA vez, un solo `coinTransaction`.
  - Aprobar y rechazar a la vez sobre el mismo canje: solo uno gana.
  - Dos canjes `PENDING` del mismo hijo cuyo total excede su saldo, aprobados a la vez → uno 200, el
    otro 409, el perdedor **sigue `PENDING`**, saldo y `coinTransaction` cuadran solo con el ganador.
  - Hijo dado de baja entre solicitar y aprobar → 409 (mismo camino que el saldo insuficiente, sin
    distinguirlo — decisión 3 del design).

## 7. Front: cliente y hooks

- [x] 7.1 Crear `apps/web/src/api/redemptions.ts`: `queryString()`, `createRedemption(input)`
      (POST), `fetchRedemptions(query)` (GET, padre), `fetchOwnRedemptions(query)` (GET
      `/redemptions/mine`), `approveRedemption(id)`/`rejectRedemption(id)` (POST). Claves:
      `redemptionsQueryKey`, `redemptionsPageQueryKey(query)`, `ownRedemptionsQueryKey(query)`.
- [x] 7.2 Crear `apps/web/src/features/redemptions/use-redemptions.ts`: `useRedemptions(query)`,
      `useOwnRedemptions(query)`; `useCreateRedemption()` refresca solo `redemptionsQueryKey`;
      `useApproveRedemption()` refresca `redemptionsQueryKey` + `authApi.sessionQueryKey` +
      `childrenApi.ownChildQueryKey` + `childrenApi.childrenQueryKey` + `rewardsApi.rewardsQueryKey`
      (patrón `useRefreshTasksAndCoins`, más rewards porque `affordable` depende del saldo que este
      canje acaba de descontar); `useRejectRedemption()` refresca solo `redemptionsQueryKey`;
      `describeRedemptionsError(error)` con un único caso `CONFLICT` (cubre transición perdida,
      saldo insuficiente y duplicado — decisión 3 del design), `NOT_FOUND`, `FORBIDDEN`,
      `VALIDATION_ERROR`; `describeRedemptionStatus(status)`.
- [x] 7.3 Añadir el bloque `redemptions` a `apps/web/src/lib/messages.ts` (title, empty,
      approve/reject, filtros, estados, `request`/`alreadyRequested` para el niño,
      `notFound`/`forbidden`/`invalidData`/`conflict`, `previousPage`/`nextPage`).

## 8. Front: pantallas y navegación

- [x] 8.1 Crear `features/redemptions/RedemptionInbox.tsx` (padre): lista paginada con filtro por
      estado, botones aprobar/rechazar condicionados a `status === "PENDING"`, patrón `TaskRow` de
      `TaskBatchList.tsx` sin agrupación por lote.
- [x] 8.2 Crear `features/redemptions/MyRedemptions.tsx` (niño): sus solicitudes con
      `describeRedemptionStatus`, sin selector de hijo, patrón de `MyTasks.tsx`.
- [x] 8.3 Modificar `features/rewards/MyRewards.tsx` (`MyRewardRow`): cuando `reward.affordable`,
      cruzar contra `useOwnRedemptions({ status: "PENDING" })` (un `Set<rewardId>`) — si ya hay una
      solicitud pendiente para ese premio, mostrar `messages.redemptions.alreadyRequested`; si no,
      el botón `messages.redemptions.request` que llama `useCreateRedemption().mutate({ rewardId })`.
      Sin cambio de contrato en `rewards` (decisión 8 del design).
- [x] 8.4 Crear `apps/web/src/routes/redemptions.tsx`: `AuthGate > ParentOnly fallback={NoEsParaTi}
      > RedemptionInbox`, copiando `routes/rewards.tsx`.
- [x] 8.5 En `routes/index.tsx`: `<Link to="/redemptions">` dentro de `ParentOnly`, y un botón
      `misCanjes` (mismo patrón de estado local que `misTareas`/`misPremios`) que abre
      `MyRedemptions` dentro de `ChildOnly`.

## 9. Front: tests

- [x] 9.1 Crear `apps/web/tests/redemptions-client.test.ts` (patrón `rewards-client.test.ts`): rutas
      exactas con `API_PREFIX`; el alta no envía `childId` ni `coins`; el filtro del padre construye
      `?status=&childId=`; `/redemptions/mine` no lleva `childId`; aprobar/rechazar van por POST sin
      cuerpo; una página con forma inesperada falla como `ApiRequestError`.
- [x] 9.2 Test cruzado de `describeRedemptionsError`: para el mismo código (`NOT_FOUND`,
      `FORBIDDEN`, `CONFLICT`), el texto es distinto del de `describeTasksError`/
      `describeRewardsError` con ese mismo código. Fallo de red → `messages.errors.network`.

## 10. Sembrado y cierre

- [x] 10.1 Actualizar `apps/api/prisma/seed.ts`: sembrar los tres estados del canje sobre "Helado"
      (documentar en el propio archivo por qué, ya que con las tareas ya sembradas ningún hijo
      alcanza todavía "Ir al cine"): una solicitud `PENDING`, una `APPROVED` (vía
      `applyCoinMovement` dentro de una transacción, con `reason: "REDEMPTION_APPROVED"`), y una
      `REJECTED`. Actualizar el bloque de limpieza idempotente y el resumen final impreso.
- [x] 10.2 Actualizar `openspec/config.yaml`: mover `/redemptions` de "lo que falta" a "lo ya
      construido", con las seis rutas y la doble validación de saldo.
- [x] 10.3 Revisar `README.md` por si sigue sin mencionar `/redemptions` como construido.
- [x] 10.4 Pasar `pnpm db:generate`, `lint`, `typecheck` y `test` en verde **desde `apps/api`**,
      lanzando la batería completa en segundo plano. Verde: 38 archivos, 520 tests. (Una primera
      corrida tuvo 7 fallos transitorios de `scrypt` bajo contención de recursos en módulos de
      `auth` no tocados por este change — confirmado aislando esos dos archivos, 64/64 en verde — y
      una segunda corrida completa quedó 520/520 sin tocar nada.)
- [x] 10.5 Recorrido manual con `pnpm dev`: pedir un premio que alcance, verlo como `PENDING` en
      `MyRedemptions`; como padre, verlo en la bandeja, aprobarlo y comprobar que el saldo baja y que
      `MyRewards` ya no ofrece el botón para ese premio (o muestra "ya lo pediste"); rechazar otra
      solicitud y comprobar que el saldo no se toca; tocar dos veces "Aprobar" y comprobar que la
      segunda no rompe nada visible. Recorrido hecho con agent-browser contra la API y el front
      levantados directamente (turbo falló por un problema de spawn del sandbox, no del código).
      Confirmado: precio congelado por hijo, "ya lo pediste" cuando ya hay un PENDING del mismo
      premio, la bandeja del padre con las cuatro filas correctas, aprobar descuenta el saldo exacto,
      un doble clic sobre "Aprobar" no rompe nada visible. Sin bugs de aplicación encontrados. Base
      de desarrollo re-sembrada al terminar.
- [x] 10.6 Sincronizar `specs/redemptions/spec.md` con el spec principal y archivar el change.

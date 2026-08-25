## Context

Ver `proposal.md` para la motivación. Lo que condiciona el diseño es lo que ya existe:

- **El modelo ya está completo, sin migración.** `RewardRedemption` (con `coins` como snapshot del
  precio), `RedemptionStatus` y `CoinReason.REDEMPTION_APPROVED` vienen de `add-data-model`, sin
  usarse hasta ahora. `CoinTransaction.redemptionId` ya existe junto a `taskId`.
- **`applyCoinMovement` ya hace la segunda validación de saldo.** Su `updateMany` incluye
  `coins: { gte: -amount }` en el `WHERE` cuando el importe es negativo, y lanza `ConflictError`
  genérico si no alcanza —o si el hijo fue dado de baja mientras tanto—. `redemptions` no reescribe
  esa comprobación: solo la invoca con el importe en negativo.
- **`tasks.repository.approve()`/`transition()` son la plantilla explícita.** El comentario de ese
  archivo dice literalmente que es "la plantilla que copiarán los canjes, que descuentan en vez de
  acreditar", y `rewards.repository.ts` anota que su módulo no mueve monedas "porque eso vuelve en
  `add-redemptions`".
- **La máquina de estados del canje ya está cerrada** en `config.yaml` (ver el contexto de este
  documento): dos transiciones desde `PENDING`, las dos las resuelve el padre. Este design no la
  reabre, solo la implementa.
- **`RewardAssignment` tiene clave compuesta `@@id([rewardId, childId])`**, así que consultar la
  oferta de un hijo a un premio es una sola lectura por esa clave, no un filtro.

## Goals / Non-Goals

**Goals:**

- Que el niño pueda pedir un premio que le alcanza, y que el padre pueda resolverlo, con la misma
  garantía de atomicidad que ya tiene aprobar una tarea (doble tap seguro, saldo nunca inconsistente).
- Que el precio pagado sea siempre el que el niño vio al pedir, nunca uno recalculado después.
- Que el bloqueo de duplicados pendientes sea una prueba automatizada, no una promesa de UI.

**Non-Goals:**

- Ofrecer al niño una forma de arrepentirse (cancelar) — no está pedido y añadiría una tercera
  transición a una máquina de estados que el proyecto ya cerró con dos.
- Garantizar con una restricción de base de datos que nunca habrá dos solicitudes `PENDING` del
  mismo premio bajo concurrencia perfecta — ver decisión 9 y el riesgo asociado.
- Rediseñar `rewards` para que el escaparate sepa de canjes. Se resuelve enteramente del lado del
  cliente.

## Decisions

### 1. `redemptions.repository.ts` copia literalmente `approve()`/`transition()` de `tasks`

```ts
export function approve(redemptionId: string, childId: string, coins: number): Promise<RedemptionRow> {
  return withTranslatedErrors(() =>
    getPrisma().$transaction(async (tx) => {
      const affected = await tx.rewardRedemption.updateMany({
        where: { id: redemptionId, status: "PENDING" },
        data: { status: "APPROVED" },
      });
      if (affected.count !== 1) throw new RedemptionTransitionConflictError();

      // El saldo insuficiente lo detecta ESTA llamada, no una comprobación nueva.
      await applyCoinMovement(tx, {
        childId,
        amount: -coins,
        reason: "REDEMPTION_APPROVED",
        redemptionId,
      });

      return tx.rewardRedemption.findUniqueOrThrow({ where: { id: redemptionId }, select: REDEMPTION_FIELDS });
    }),
  );
}
```

`transition(redemptionId, from, to)` es la misma función genérica que `tasks.repository.transition`,
reutilizada para el rechazo (`PENDING → REJECTED`, sin `applyCoinMovement`).

**Alternativa descartada**: escribir una comprobación de saldo aparte antes de `applyCoinMovement`,
del estilo `if (child.coins < coins) throw ...`. Se descarta porque sería una segunda fuente de
verdad sobre el mismo número que `applyCoinMovement` ya comprueba de forma atómica dentro de la
transacción; una comprobación previa, fuera de la transacción o incluso dentro pero como una
consulta aparte, deja una ventana donde otro canje puede gastarse el saldo entre la lectura y el
descuento — exactamente el error que la sección 4 de CLAUDE.md ya nombra.

### 2. Saldo insuficiente al SOLICITAR: `InsufficientBalanceError extends ConflictError` (409)

Se comprueba en `redemptions.service.createRedemption`, antes de escribir ninguna fila, comparando
`coins` de la oferta contra el saldo leído en la misma consulta que trae la oferta
(`findOfferForChild`). Es un límite de **política** comprobado antes de crear —mismo argumento que
`MaxChildrenReachedError` en `children`—, no una validación de forma de entrada: `rewardId` es un
identificador válido, lo que falla es que el estado actual del saldo no cubre el precio. El 422 de
CLAUDE.md (sección 3) es solo para eso: la entrada no cumple su esquema.

### 3. Saldo insuficiente al APROBAR: el `ConflictError` genérico de `applyCoinMovement`, sin envolver

Se deja subir tal cual desde `redemptions.repository.approve()`. **Alternativa descartada**:
capturarlo y relanzarlo como una clase `InsufficientBalanceAtApprovalError` dedicada. Se descarta
porque ese mismo `ConflictError` genérico también es lo que sale si el hijo fue dado de baja entre
solicitar y aprobar (`applyCoinMovement` no distingue las dos causas en su propio código, ver
`coin-ledger.ts`), y reetiquetarlo como "saldo insuficiente" mentiría en ese segundo caso. El código
HTTP —409, `CONFLICT`— es el contrato; el texto no lo es. El frontend nunca lee `error.message` en
un `CONFLICT`, así que no hay pérdida de experiencia por dejarlo genérico.

### 4. Autorización del padre se filtra por `child.parentId`, no por `reward.parentId`

`RewardRedemption` no tiene `parentId` propio. El dueño canónico del recurso es el **niño** que lo
solicitó: es su saldo el que se mueve y su `CoinTransaction.redemptionId` el que queda. Filtrar por
`child.parentId` sigue siendo correcto aunque el padre haya retirado después la oferta o el premio
(decisión 8), y es una sola relación en vez de comprobar que `reward.parentId === child.parentId`
—siempre coinciden, pero no hace falta leerlo dos veces—.

### 5. `GET /redemptions/:id` con dos formas, igual que `Task`/`OwnTask` y `Reward`/`OwnReward`

`Redemption` (padre, con `child`) y `OwnRedemption` (niño, sin `child`). `GET /redemptions/mine` ya
necesita la forma sin `child`; tener el detalle devolviendo a veces `child` y a veces no según quién
compone la respuesta introduciría la única ambigüedad de tipo del proyecto que no está resuelta con
dos schemas separados.

### 6. Premio no disponible al solicitar reutiliza `RewardNotFoundError`

`redemptions.service.ts` importa `RewardNotFoundError` de `../rewards/rewards.errors.js` en vez de
declarar una clase propia. Es semánticamente el mismo caso —"ese premio no está disponible para
ti"— para las tres causas que lo producen (inexistente, retirado, no ofertado a ese hijo), y una
segunda redacción en `redemptions.errors.ts` se desincroniza de la primera la primera vez que
alguien reescriba un mensaje.

### 7. Seis rutas, no siete

```
POST   /redemptions                        niño    solicitar
GET    /redemptions                        padre   bandeja paginada (status, childId)
GET    /redemptions/mine                   niño    sus solicitudes    <- ANTES que /:redemptionId
GET    /redemptions/:redemptionId          ambos   detalle, su forma
POST   /redemptions/:redemptionId/approve  padre   aprueba y descuenta
POST   /redemptions/:redemptionId/reject   padre   rechaza, no descuenta
```

Un canje no se edita ni se retira, solo se resuelve: sin `PATCH`, `PUT` ni `DELETE`. Como en
`tasks.routes.ts` y `rewards.routes.ts`, `/redemptions/mine` debe registrarse **antes** que
`/redemptions/:redemptionId` — al revés, Express le entrega `"mine"` como si fuera un
`redemptionId`, y el niño recibiría un 404 al pedir su propia bandeja en vez de su lista.

### 8. Sin "Modified Capability" en `rewards`

El front resuelve "ya lo pediste" cruzando en cliente `useOwnRewards()` con
`useOwnRedemptions({ status: "PENDING" })`, construyendo un `Set<rewardId>` de canjes pendientes
para condicionar el botón. **Alternativa descartada**: añadir un campo `hasPendingRedemption` a
`OwnReward`. Se descarta porque obligaría a `rewards.repository.findOwnRewardsPage` a conocer la
existencia de `RewardRedemption` —cruzando la frontera de un módulo que hoy no sabe de canjes—, y
reabriría una spec (`rewards`) ya cerrada sin que su comportamiento observable cambie: el dato ya es
derivable en el cliente combinando dos listados que de todas formas hay que pedir.

### 9. Duplicados pendientes del mismo premio se bloquean en el servicio, no en el esquema

`createRedemption` llama `existsPendingRedemption(rewardId, childId)` antes de crear la fila, y
devuelve 409 si ya hay un `PENDING` de ese mismo par. Es una comprobación de **política**, con el
mismo precedente que `MAX_CHILDREN_PER_FAMILY` en la sección 6 de CLAUDE.md: un límite que cuenta
filas, no un invariante de integridad, así que no exige un `CHECK` ni un índice único en el motor.

**Alternativa descartada**: un índice único parcial en PostgreSQL (`UNIQUE (reward_id, child_id)
WHERE status = 'PENDING'`), que sí cerraría la ventana de carrera por completo. Se descarta para
este change porque exigiría una migración, y este change se anunció explícitamente sin ninguna —la
consecuencia aceptada bajo Read Committed se documenta en Risks/Trade-offs.

### Se difiere a un change posterior

- **Cancelar la propia solicitud** (niño). No hay precedente de que quien pide algo también pueda
  deshacerlo en este proyecto; añadirlo es una tercera transición sobre una máquina de estados que
  `config.yaml` ya cerró con dos.
- **Cerrar la ventana de carrera de los duplicados con un índice único.** Ver decisión 9: hoy es un
  límite de servicio, no de esquema.
- **Notificar al padre** de que tiene algo en su bandeja.
- **Reactivar un canje rechazado.** `REJECTED` sigue terminal, como ya lo decidía la máquina de
  estados antes de este change.

## Risks / Trade-offs

**Bajo Read Committed, dos solicitudes verdaderamente simultáneas del mismo premio pueden colarse
las dos** → Se acepta. `existsPendingRedemption` y el `create` posterior no están en la misma
transacción con un lock que lo impida (igual que `MAX_CHILDREN_PER_FAMILY`, que tiene la misma
ventana documentada en CLAUDE.md). El caso real —el mismo niño tocando el mismo botón dos veces en
milisegundos— ya lo evita el front deshabilitando el botón mientras la mutación está en curso; lo
que queda sin cerrar es el caso de dos pestañas o dos dispositivos a la vez, que es raro y de bajo
impacto (el padre simplemente ve dos solicitudes iguales en su bandeja y resuelve la que quiera).

**Reutilizar el `ConflictError` genérico para "saldo insuficiente al aprobar" y para "hijo dado de
baja" pierde granularidad de mensaje** → Se acepta (decisión 3): el frontend no muestra
`error.message` para un `CONFLICT`, solo un texto fijo por `error.code`, así que no hay pérdida de
información visible para nadie.

**El precio congelado puede quedar por debajo o por encima del precio vigente de la oferta si el
padre lo cambia mientras el canje espera** → Es el comportamiento decidido explícitamente
(`RewardRedemption.coins` es un snapshot, según su propio comentario en el schema), no un riesgo a
mitigar.

## Migration Plan

Ninguna migración de base de datos: el modelo ya existe desde `add-data-model`. El despliegue es el
flujo normal — `pnpm db:generate`, lint, typecheck y la batería de tests en verde. Revertir es
retirar el commit: no hay datos escritos por este change que otro módulo necesite, porque
`RewardRedemption` y `CoinTransaction` ya podían existir vacíos antes de este change.

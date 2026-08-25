## Why

Monedín ya sabe **ganar** (`add-tasks`) y ya sabe **elegir una meta** (`add-rewards`): el niño ve su
saldo y ve lo que podría comprar con él. Lo que no sabe todavía es **gastar**. Sin `/redemptions`,
`affordable` en el escaparate es una promesa sin forma de cumplirse: el niño puede mirar el premio
que le alcanza, pero no hay ningún endpoint que le deje pedirlo. El ciclo completo —esfuerzo →
ingreso → decisión de gasto—, que es la razón de ser del producto, queda cortado justo en el último
paso.

## What Changes

- **Módulo `redemptions` nuevo**: el niño solicita el canje de un premio ofrecido a él
  (`POST /redemptions`), y el padre lo aprueba —lo que descuenta sus monedas— o lo rechaza —lo que
  no descuenta nada—.
- **El precio queda congelado al solicitar**, en `RewardRedemption.coins`. Si el padre cambia el
  precio de la oferta, o retira el premio, o le quita la oferta a ese hijo, un canje ya `PENDING`
  no se ve afectado: sigue su curso con el número que tenía al pedirse.
- **El saldo se valida dos veces**: al solicitar (rechaza de entrada si no alcanza) y otra vez al
  aprobar (puede que, entre medias, otro canje ya se haya gastado ese saldo).
- **Los duplicados pendientes del mismo premio se bloquean en el servicio**: el niño no puede tener
  dos solicitudes `PENDING` a la vez del mismo premio.
- **Front completo**: el niño pide desde su escaparate (`MyRewards`) y ve sus solicitudes
  (`MyRedemptions`); el padre resuelve desde una bandeja nueva (`RedemptionInbox`).
- **Sin migración**: `RewardRedemption`, `RedemptionStatus` y el campo `redemptionId` de
  `CoinTransaction` ya existen desde `add-data-model`, y `CoinReason.REDEMPTION_APPROVED` ya está en
  el enum sin usar.

## Capabilities

### New Capabilities

- `redemptions`: solicitud de canje por el niño y resolución (aprobar/rechazar) por el padre, con
  el precio congelado al solicitar y la doble validación de saldo.

### Modified Capabilities

Ninguna. `rewards` no cambia: "ya lo pediste" se resuelve cruzando en el cliente el escaparate
(`GET /rewards/mine`) con la lista de canjes pendientes del niño (`GET /redemptions/mine`), sin
tocar el contrato de `rewards` ni su spec ya cerrada.

## Impact

**Código nuevo**: `apps/api/src/modules/redemptions/` (las cinco capas),
`packages/contracts/src/schemas/redemptions.ts`, `apps/web/src/api/redemptions.ts`,
`apps/web/src/features/redemptions/` (`use-redemptions.ts`, `RedemptionInbox.tsx`,
`MyRedemptions.tsx`), `apps/web/src/routes/redemptions.tsx`.

**Código modificado**: `apps/web/src/features/rewards/MyRewards.tsx` gana el botón de pedir un
premio; `apps/web/src/routes/index.tsx` gana el enlace del padre y el botón "mis canjes" del niño;
`apps/api/src/app.ts` registra el router nuevo; `apps/api/prisma/seed.ts` siembra canjes de ejemplo
en los tres estados.

**Contrato compartido**: `packages/contracts/src/index.ts` exporta el schema nuevo.
`RewardNotFoundError` de `rewards.errors.ts` se reutiliza desde `redemptions.service.ts` para un
premio no disponible al solicitar.

**Base de datos**: ninguna migración. El modelo, el enum de estado y el motivo de movimiento ya
existían sin usarse.

**API**: seis rutas nuevas bajo `/redemptions`, descritas en `design.md`.

**Arquitectura**: ninguna. `redemptions` sigue la anatomía de módulo estándar y reutiliza
`applyCoinMovement` sin modificarlo.

## No incluye

- **Cancelar la propia solicitud (niño).** Una vez pedido, solo el padre resuelve. La máquina de
  estados de canje ya cerrada en `config.yaml` solo tiene dos transiciones desde `PENDING`, y las
  dos las decide el padre; añadir una tercera es una decisión que se difiere a un change futuro.
- **Reactivar un canje rechazado.** `REJECTED` es terminal, igual que ya lo era en la máquina de
  estados decidida antes de este change. Si el niño lo quiere, vuelve a pedirlo.
- **Notificar al padre** de que tiene algo en su bandeja. Es una mejora de UX ortogonal a que el
  endpoint exista, y no bloquea que el flujo funcione end to end.
- **Restricción única en la base de datos** para impedir duplicados pendientes del mismo premio. El
  bloqueo vive en el servicio, no en el esquema: añadir un índice único aquí exigiría una migración,
  y este change se anunció sin ninguna.

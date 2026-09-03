## Why

**El historial de monedas está construido y no lo lee nadie.**

```
existe en la base       CoinTransaction, append-only, protegida por un disparador
                        de PostgreSQL que hace fallar cualquier UPDATE o DELETE
guarda a propósito      `balanceAfter` en cada fila, «para que auditar el saldo sea
                        una comparación y no una agregación» (decisión 5 de add-data-model)
lo escriben             aprobar una tarea y aprobar un canje, dentro de su transacción
lo expone               nada: cero endpoints, cero módulo
lo ve                   nadie
```

El producto entero enseña un ciclo —se esfuerza, gana, decide en qué gastarlo— y la mitad de ese
ciclo es **poder mirar atrás**. Hoy un niño ve un número y no tiene forma de saber de dónde salió.
Para alguien de seis a once años, cuya primera idea de saldo es esta, «tienes 120» sin «esto vino de
recoger la mesa» es un número mágico.

Y el padre tiene el problema simétrico: si un saldo no le cuadra, no tiene dónde mirar. La tabla que
responde a eso lleva construida desde `add-data-model`, con su columna redundante puesta
precisamente para que la respuesta sea barata.

Es además **el primer cambio de API de esta etapa de interfaz**, que hasta ahora no ha tocado el
servidor ni una vez. Se hace a conciencia y solo de lectura.

## What Changes

- **Dos endpoints de lectura**, paginados como todos los listados del proyecto: el niño lee el suyo,
  el padre lee el de cualquiera de sus hijos.
- **Un módulo nuevo en la API** con sus cinco capas, siguiendo la plantilla.
- **Los contratos** para el movimiento y su listado.
- **Dos pantallas**: el niño ve de dónde salieron sus monedas; el padre, las de cada hijo.
- **Cada movimiento se lee sin cuentas**: qué pasó, cuánto y con qué saldo quedó — que es para lo que
  `balanceAfter` está guardado.

## No incluye

- **El ajuste manual.** `MANUAL_ADJUSTMENT` está en el enum, no lo escribe nadie, y `config.yaml`
  dice que «ese mecanismo todavía no lo expone ningún endpoint». Sigue siendo cierto después de este
  change: **este solo lee**, no mueve dinero, así que no hay atomicidad ni doble tap que probar.
  Queda anotado con lo que costaría.
- **Exportar o filtrar por fecha.** Un listado paginado y en orden.

## Capabilities

### New Capabilities

- `coin-ledger`: qué se puede leer del historial de monedas, quién y con qué garantías.

### Modified Capabilities

- `parent-console`: el padre puede mirar de dónde salió el saldo de un hijo.

## Impact

- **Primer cambio de API de esta etapa.** Módulo nuevo, sin migración: la tabla ya existe.
- `packages/contracts`: esquemas del movimiento, de la query y de la página.
- `apps/api/src/modules/coins/`: las cinco capas.
- `apps/web`: cliente, hooks y dos pantallas, más su sitio en la navegación.
- Cero cambios en el esquema de base de datos.

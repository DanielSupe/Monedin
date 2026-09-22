# coin-ledger

## ADDED Requirements

### Requirement: Cada movimiento del historial dice cuándo fue

Cada fila del historial de monedas SHALL decir en qué fecha ocurrió el movimiento.

Esta pantalla existe para contestar «este saldo no me cuadra». Una fila que dice cuánto y por qué
pero no cuándo no se puede cruzar con nada de lo que pasó en casa, así que no contesta la pregunta
que la trajo. El dato viaja en la respuesta desde el primer día; lo que faltaba era enseñarlo.

La fecha SHALL escribirse en la forma corta del producto: es una celda de una lista que se recorre de
arriba abajo, y la fila ya lleva la frase, el motivo y el saldo.

#### Scenario: Se recorre el historial

- **WHEN** se miran dos movimientos de fechas distintas
- **THEN** cada uno enseña la suya

#### Scenario: La fila ya va cargada

- **WHEN** se enseña la fecha de un movimiento
- **THEN** va en la forma corta y no en la larga

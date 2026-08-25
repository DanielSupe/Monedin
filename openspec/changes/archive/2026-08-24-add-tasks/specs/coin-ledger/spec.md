## ADDED Requirements

### Requirement: El origen de un movimiento no lo produce dos veces

Cuando un movimiento de monedas procede de un hecho concreto —aprobar una tarea, resolver un canje—,
ese hecho SHALL producir **un único movimiento**, aunque la orden llegue repetida o simultánea. La
garantía SHALL venir de condicionar el cambio de estado de ese hecho a su estado de origen y
comprobar que afectó exactamente una fila, dentro de la misma transacción que el movimiento.

Este requisito no se deriva de los anteriores y por eso se escribe aparte. Que cada movimiento sea
atómico y deje rastro NO impide que se apliquen dos movimientos idénticos: la operación de mover
monedas hace exactamente lo que se le pide, tantas veces como se le pida. Lo que impide el duplicado
es que el segundo intento no encuentre el estado de origen que esperaba.

Existe porque un niño con un teléfono lento va a tocar dos veces, y porque la diferencia entre
acreditar cincuenta monedas y acreditar cien es justo lo que el producto enseña a valorar.

#### Scenario: Dos aprobaciones simultáneas de la misma tarea

- **WHEN** llegan a la vez dos órdenes de aprobar la misma tarea
- **THEN** solo una acredita
- **AND** la otra se rechaza señalando el conflicto
- **AND** existe una única entrada de historial que señala esa tarea

#### Scenario: Repetir una orden ya aplicada

- **WHEN** se vuelve a dar una orden que ya tuvo efecto sobre el mismo hecho
- **THEN** se rechaza señalando el conflicto
- **AND** el saldo del hijo no cambia

#### Scenario: El saldo cuadra pese a las órdenes repetidas

- **WHEN** se lanzan órdenes repetidas y simultáneas sobre varios hechos del mismo hijo
- **THEN** su saldo coincide con la suma de las entradas de su historial
- **AND** cada hecho ha producido como mucho un movimiento

#### Scenario: Un rechazo no deja rastro en el historial

- **WHEN** una orden se rechaza por conflicto de estado
- **THEN** no queda ninguna entrada de historial de ese intento
- **AND** el saldo es el que era antes de intentarlo

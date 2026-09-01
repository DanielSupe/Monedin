## ADDED Requirements

### Requirement: El estado de un canje se distingue por su forma

En la lista de canjes de un niño, un canje **pendiente**, uno **aprobado** y uno **rechazado** SHALL
distinguirse entre sí sin leer el texto que los describe.

No son tres variantes de lo mismo. Aprobar descuenta; rechazar es terminal y **no devuelve nada**,
porque el descuento solo ocurre al aprobar. Esa asimetría es justo lo que un niño tiene que poder
ver, y presentarla como tres párrafos iguales la esconde.

#### Scenario: Tres canjes en estados distintos

- **WHEN** un niño ve un canje pendiente, uno aprobado y uno rechazado
- **THEN** los tres se distinguen a simple vista

#### Scenario: Un premio ya pedido en el escaparate

- **WHEN** un premio tiene una solicitud pendiente
- **THEN** el escaparate lo presenta como pedido
- **AND** no ofrece volver a pedirlo

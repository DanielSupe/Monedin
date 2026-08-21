# coin-ledger Specification

## Purpose

Define cómo se guarda el saldo de monedas de un hijo y cómo se registra cada movimiento, de modo que
el saldo nunca pueda quedar en un valor imposible, nunca pueda divergir de su historial, y siempre se
pueda reconstruir cómo se llegó hasta él.

## Requirements

### Requirement: El saldo nunca es negativo

El saldo de monedas de un hijo SHALL ser siempre mayor o igual que cero. El almacén SHALL rechazar
cualquier operación que lo dejaría por debajo, con independencia de qué código la haya originado.

#### Scenario: Un descuento supera el saldo disponible

- **WHEN** se intenta descontar más monedas de las que el hijo tiene
- **THEN** el almacén rechaza la operación
- **AND** el saldo queda como estaba

#### Scenario: Un hijo recién creado

- **WHEN** se crea un perfil de hijo sin indicar saldo
- **THEN** su saldo es cero

### Requirement: Toda mutación de saldo deja su rastro

Cada cambio del saldo de un hijo SHALL escribir una entrada de historial en la **misma transacción**
que el cambio. NO SHALL ser posible que un saldo cambie sin su entrada correspondiente, ni que se
escriba una entrada sin que el saldo cambie.

#### Scenario: Se acredita una tarea aprobada

- **WHEN** se aprueba una tarea y se acreditan sus monedas
- **THEN** el saldo del hijo aumenta en esa cantidad
- **AND** queda una entrada de historial que registra el movimiento y su motivo

#### Scenario: Falla la escritura del historial

- **WHEN** el cambio de saldo se aplica pero la escritura de la entrada de historial falla
- **THEN** ninguna de las dos cosas queda almacenada
- **AND** el saldo es el que era antes de intentarlo

#### Scenario: Cada entrada dice de dónde viene

- **WHEN** se consulta una entrada de historial
- **THEN** indica el motivo del movimiento
- **AND** cuando el movimiento procede de una tarea o de un canje, permite llegar hasta él

### Requirement: El saldo se modifica de forma incremental

El saldo SHALL modificarse mediante operaciones relativas de suma o resta ejecutadas por el motor. NO
SHALL calcularse leyendo el valor actual, operando en memoria y escribiendo el resultado, porque dos
operaciones simultáneas escritas así pierden una de las dos.

#### Scenario: Dos acreditaciones simultáneas

- **WHEN** dos operaciones acreditan monedas al mismo hijo a la vez
- **THEN** el saldo final refleja ambas
- **AND** el historial contiene las dos entradas

#### Scenario: Una acreditación y un descuento simultáneos

- **WHEN** una operación acredita y otra descuenta sobre el mismo hijo a la vez
- **THEN** el saldo final refleja ambos movimientos
- **AND** en ningún momento intermedio queda por debajo de cero

### Requirement: El historial es inmutable

Una entrada de historial de monedas, una vez escrita, NO SHALL poder modificarse ni eliminarse. Esta
restricción SHALL estar garantizada por el almacén, no por la disciplina del código que lo usa.

#### Scenario: Se intenta modificar una entrada

- **WHEN** se intenta cambiar la cantidad o el motivo de una entrada ya escrita
- **THEN** el almacén rechaza la operación

#### Scenario: Se intenta borrar una entrada

- **WHEN** se intenta eliminar una entrada de historial
- **THEN** el almacén rechaza la operación

#### Scenario: Corregir un error se hace añadiendo

- **WHEN** hace falta corregir un movimiento equivocado
- **THEN** se registra un movimiento nuevo que lo compensa
- **AND** ambos quedan visibles en el historial

### Requirement: El historial permite auditar el saldo

Cada entrada de historial SHALL registrar el saldo resultante después de aplicar el movimiento, de
modo que se pueda comprobar la coherencia entre el saldo actual y su historia sin recalcular toda la
secuencia.

#### Scenario: El saldo actual coincide con su historia

- **WHEN** se suman todos los movimientos de un hijo desde el principio
- **THEN** el total coincide con su saldo actual
- **AND** coincide con el saldo resultante de la entrada más reciente

#### Scenario: Se detecta una divergencia

- **WHEN** el saldo de un hijo no coincide con el resultado de su último movimiento
- **THEN** la comprobación de coherencia lo señala indicando de qué hijo se trata

### Requirement: El historial sobrevive a la baja de un hijo

Los movimientos de monedas SHALL conservarse aunque el hijo al que pertenecen deje de estar activo.

#### Scenario: Se consulta el historial de un hijo dado de baja

- **WHEN** se consulta el historial de un hijo que ya no está activo
- **THEN** sus movimientos siguen disponibles íntegros

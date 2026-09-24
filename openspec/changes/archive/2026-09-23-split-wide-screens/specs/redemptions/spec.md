# redemptions

## ADDED Requirements

### Requirement: La lista de canjes del niño explica cuándo se van las monedas

La pantalla de canjes de un niño SHALL explicar los dos hechos que su tabla de estados no dice: que
las monedas se descuentan **al aprobar** y no al pedir, y que un canje rechazado no le cuesta nada
porque el precio se congeló el día que lo pidió.

Es la mitad del ciclo que un niño no puede deducir de una lista de estados. El producto ya se la
cuenta a quien reparte, en las dos altas del padre; contárselo solo a quien reparte deja suponiendo
a quien pide, que es donde se lleva el chasco.

La pantalla SHALL además resumir **cuántos canjes hay en cada estado**, para repasar sin leer la
tabla entera.

Ese resumen SHALL contar las filas que la pantalla tiene delante, y SHALL decir que es de la página
que se ve. NO SHALL presentarse como el total de la familia: este listado pagina por fila, así que su
total cuenta canjes y no estados, y un resumen que dijera «3 aprobados» sobre un total mayor estaría
afirmando algo que no ha contado.

#### Scenario: Un niño abre sus canjes

- **WHEN** un niño abre su lista de canjes
- **THEN** la pantalla explica que las monedas se van al aprobar y no al pedir
- **AND** explica que un rechazo no le cuesta nada

#### Scenario: Hay canjes en varios estados

- **WHEN** la página que se ve tiene canjes esperando, aprobados y rechazados
- **THEN** cada estado dice cuántos hay en esa página

#### Scenario: Un estado sin ninguno

- **WHEN** en la página que se ve no hay ningún canje de un estado
- **THEN** ese estado dice cero, y no desaparece

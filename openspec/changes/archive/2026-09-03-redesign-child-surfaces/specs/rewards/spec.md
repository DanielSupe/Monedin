## ADDED Requirements

### Requirement: El escaparate del niño se recorre como una rejilla, no como una lista

El escaparate del niño SHALL presentar sus premios en una **rejilla de más de una columna** en el
ancho habitual de una tablet, y NO SHALL presentarlos como una única columna de filas.

Un escaparate se recorre con los ojos y se compara de un vistazo. Una sola columna obliga a
desplazar para tener dos precios delante a la vez, que es exactamente lo que hay que hacer para
elegir entre dos premios — y elegir en qué gastar es la mitad del ciclo que el producto enseña.

Cada premio SHALL ser **una sola unidad**: su imagen o su respaldo, su título, su precio, si le
alcanza y su acción, sin que ninguna de esas partes se salga a otra parte de la pantalla. Cada uno
SHALL seguir siendo un elemento de una lista para quien recorre la pantalla sin verla.

La rejilla NO SHALL desbordar horizontalmente la pantalla en el ancho más estrecho que el producto
admite.

#### Scenario: El niño mira su escaparate

- **WHEN** un niño abre su escaparate con varios premios ofrecidos
- **THEN** cada premio se presenta como una unidad con su imagen, su título, su precio y su acción
- **AND** siguen anunciándose como una lista de elementos

#### Scenario: Un premio con foto y otro sin ella conviven en la rejilla

- **WHEN** en el escaparate hay un premio con foto y otro sin ella
- **THEN** los dos ocupan una posición equivalente en la rejilla
- **AND** el que no tiene foto muestra su respaldo, sin dejar hueco

#### Scenario: Un escaparate vacío

- **WHEN** un niño abre su escaparate y no se le ofrece ningún premio
- **THEN** ve el estado vacío del sistema y no una rejilla sin nada dentro

### Requirement: El escaparate dice cuántos premios hay antes de recorrerlo

El escaparate SHALL indicar **cuántos premios** se le ofrecen al niño, junto a su título y antes de
la rejilla.

En una rejilla, «cuántos hay» deja de leerse solo: una columna se recorre hasta el final y una
rejilla se abarca de un vistazo sin llegar a contarla. La cifra SHALL salir de las filas recibidas y
NO SHALL escribirse a mano en el texto.

#### Scenario: Se dice cuántos premios hay

- **WHEN** un niño abre su escaparate con premios ofrecidos
- **THEN** ve cuántos son

#### Scenario: Sin premios no se anuncia ninguna cifra

- **WHEN** el escaparate está vacío
- **THEN** no se anuncia una cuenta, solo el estado vacío

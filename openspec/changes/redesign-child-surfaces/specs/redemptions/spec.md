## ADDED Requirements

### Requirement: Los canjes del niño se leen como un historial en filas alineadas

Los canjes del niño SHALL presentarse como **filas con las mismas columnas**, con el premio, la
cantidad, el estado y cuándo ocurrió en posiciones fijas, y NO SHALL presentarse como tarjetas
independientes.

Un historial no se explora, se repasa: lo que se hace con él es recorrer una columna hacia abajo
—cuánto costó cada cosa, cómo acabó cada una—, y para eso las mismas posiciones ganan a repetir la
etiqueta dentro de cada tarjeta. Es además el único de los tres destinos del niño donde **no hay nada
que hacer**, así que es el que menos sitio necesita por fila.

El historial SHALL anunciarse como datos tabulares a quien recorre la pantalla sin verla, con sus
encabezados de columna asociados a los valores. Un lector de pantalla es donde más se nota la
diferencia entre una tabla y una lista de párrafos.

Las cantidades SHALL alinearse verticalmente, con las cifras de ancho fijo que el sistema ya declara
para eso.

Los canjes SHALL ir del más reciente al más antiguo.

#### Scenario: El niño repasa lo que ha pedido

- **WHEN** un niño abre su historial de canjes con varios canjes
- **THEN** ve una fila por canje con el premio, la cantidad, el estado y cuándo
- **AND** las columnas se anuncian como encabezados de esos valores

#### Scenario: Del más reciente al más antiguo

- **WHEN** un niño tiene canjes de días distintos
- **THEN** el más reciente aparece primero

#### Scenario: Un historial vacío

- **WHEN** un niño no ha pedido nada todavía
- **THEN** ve el estado vacío del sistema y no una tabla con encabezados y ninguna fila

#### Scenario: El historial no ofrece acciones

- **WHEN** un niño mira su historial de canjes
- **THEN** ninguna fila ofrece cancelar, repetir ni modificar nada

### Requirement: Los tres estados de un canje siguen distinguiéndose en el historial

Cada fila del historial SHALL indicar el estado de su canje, y los tres SHALL distinguirse **entre
sí**, no solo estar escritos.

Rechazado SHALL seguir leyéndose como advertencia y NO como error: que un padre diga que no a un
premio no es algo que el niño hiciera mal. Aprobado SHALL leerse como éxito y pendiente como algo
todavía en curso.

Pasar de tarjetas a filas NO SHALL perder esta distinción, que es lo que `redesign-child-shop` dejó
establecido y sigue valiendo con otra forma.

#### Scenario: Los tres estados se distinguen

- **WHEN** un niño tiene un canje pendiente, uno aprobado y uno rechazado
- **THEN** los tres se distinguen entre sí y no solo por su texto
- **AND** el rechazado no se presenta como un error del niño

### Requirement: El historial dice cuántos canjes hay

El historial SHALL indicar **cuántos canjes** tiene el niño, junto a su título.

La cifra SHALL salir del total del listado, que aquí sí es la cifra: los canjes paginan **por fila**,
a diferencia de las tareas del padre, que paginan por reparto y cuyo total cuenta repartos y no
filas.

#### Scenario: Se dice cuántos canjes hay

- **WHEN** un niño abre su historial con canjes
- **THEN** ve cuántos son

## ADDED Requirements

### Requirement: Las tareas del niño se distinguen en forma de sus otros destinos

Las tareas del niño SHALL presentarse en **una sola columna de tarjetas**, y esa forma SHALL ser
distinguible de la del escaparate y de la del historial de canjes.

Las tres pantallas se veían igual, y no son lo mismo: el escaparate es «qué puedo conseguir», las
tareas son «qué hago ahora» y los canjes son «qué ya pasó». Una tarea es la única de las tres que
lleva **una acción que cambia el mundo** —marcarla hecha— y una foto opcional que adjuntar, así que
es la que necesita sitio, no la que hay que comprimir.

Que se quede en tarjetas NO SHALL ser el resultado de no haber elegido: cada tarea SHALL ocupar el
ancho de la columna, con su estado visible y su acción al alcance sin desplegar nada.

Una tarea que no está pendiente NO SHALL ofrecer la acción de marcarla, como hasta ahora.

#### Scenario: El niño mira sus tareas

- **WHEN** un niño abre sus tareas
- **THEN** cada tarea ocupa el ancho de la columna con su título, su valor en monedas y su estado
- **AND** solo las pendientes ofrecen marcarlas

#### Scenario: Las tres pantallas del niño no se confunden

- **WHEN** se comparan las tareas, el escaparate y el historial de canjes
- **THEN** cada uno presenta sus elementos de una forma distinta de los otros dos

### Requirement: Las tareas dicen cuántas quedan por hacer

La pantalla de tareas del niño SHALL indicar **cuántas están pendientes**, junto a su título.

Es la respuesta a «¿qué hago ahora?», y es distinta de cuántas tareas hay: una lista con ocho tareas
de las que siete están aprobadas no es una lista de ocho cosas por hacer.

La cifra SHALL contarse sobre las tareas recibidas con ese estado, y NO SHALL escribirse a mano en el
texto ni deducirse del total de la página.

#### Scenario: Se dice cuántas quedan pendientes

- **WHEN** un niño tiene tareas en varios estados
- **THEN** ve cuántas están pendientes, y no cuántas tiene en total

#### Scenario: Ninguna pendiente

- **WHEN** todas las tareas del niño están completadas o aprobadas
- **THEN** la pantalla lo dice, en vez de anunciar una cuenta en cero como si fuera trabajo

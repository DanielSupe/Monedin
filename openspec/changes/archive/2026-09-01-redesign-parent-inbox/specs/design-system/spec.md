## ADDED Requirements

### Requirement: La paginación es una pieza del sistema, no un bloque copiado

El sistema SHALL ofrecer una pieza de paginación que dibuje la posición dentro del total y los pasos
a la página anterior y siguiente. Ninguna pantalla SHALL reescribir ese bloque.

Hoy lo reescriben cuatro pantallas, con la misma disposición y los mismos textos declarados cuatro
veces en el catálogo de mensajes. Es la definición de lo que un sistema de diseño existe para evitar.

La pieza SHALL no dibujarse cuando solo haya una página, y SHALL omitir el paso que no existe: no hay
anterior en la primera ni siguiente en la última.

#### Scenario: Una sola página

- **WHEN** el listado cabe entero en una página
- **THEN** la paginación no aparece

#### Scenario: La primera página de varias

- **WHEN** se mira la primera página de un listado con varias
- **THEN** aparece el paso a la siguiente
- **AND** no aparece el paso a la anterior

### Requirement: Una pieza del sistema no depende del router

Una pieza SHALL recibir los enlaces que necesite como contenido, no construirlos. NO SHALL importar
el router.

Es la misma frontera que ya impide a una pieza importar de `features/` o de `api/`: lo que la hace
montable en un test sin proveedores y en el catálogo vivo sin aplicación. Una paginación que
construyera sus propios enlaces necesitaría saber a qué ruta pertenece, que es justo lo que la pieza
no puede saber.

Quien la usa SHALL poner los enlaces, porque es quien sabe a dónde van.

#### Scenario: Se monta la pieza en el catálogo

- **WHEN** el catálogo vivo dibuja la paginación
- **THEN** se monta sin router y sin proveedores

### Requirement: Cuando un enlace tiene que verse como una pieza, la pieza exporta sus clases

Cuando el aspecto de un control del sistema deba aplicarse a un enlace, la pieza SHALL exportar sus
clases y NO SHALL duplicarse el aspecto en la pantalla que lo necesita.

Ya existe el precedente: `buttonClasses` sale de `Button.tsx` porque un enlace que se ve como un
botón no puede ser un botón dentro de un enlace. El filtro por estado es el mismo caso: se ve como
pestañas y **es** un conjunto de enlaces, porque el filtro vive en la dirección.

#### Scenario: El filtro por estado de un listado

- **WHEN** una pantalla dibuja su filtro por estado
- **THEN** cada opción es un enlace con las clases que exporta la pieza
- **AND** la pantalla no declara su propio aspecto para ellas

### Requirement: Una pieza no afirma un uso que no va a tener

El comentario de una pieza SHALL describir lo que la pieza hace y para qué existe. NO SHALL prometer
un estreno concreto que su forma no admite.

`Tabs` dice desde `add-design-system` que la estrenarán los filtros por estado del padre. No es
cierto y no podía serlo: `Tabs` posee su contenido y cambia por callback, mientras que el filtro es
un conjunto de direcciones sobre una sola lista. Una afirmación falsa en una pieza es peor que
ninguna: manda al siguiente que la lea a usarla donde no encaja.

#### Scenario: Se lee la cabecera de una pieza sin usar

- **WHEN** una pieza del sistema no la usa ninguna pantalla
- **THEN** su cabecera dice para qué sirve
- **AND** no nombra un estreno que ya se descartó

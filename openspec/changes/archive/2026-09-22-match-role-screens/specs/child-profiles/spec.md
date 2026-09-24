# child-profiles

## ADDED Requirements

### Requirement: La lista de hijos distingue dar de baja de bloquear, antes de pulsar

La pantalla que lista los hijos SHALL explicar la diferencia entre dar de baja un perfil y
desbloquearlo, y SHALL hacerlo sin que haga falta abrir ningún diálogo.

Las dos acciones se ofrecen en la misma fila y suenan a lo mismo. No lo son: desbloquear se deshace
pulsando otra vez, y dar de baja se lleva el saldo y el historial de un niño para siempre. Además
bloquear no lo decide nadie: ocurre al fallar el PIN varias veces.

El diálogo de confirmación ya lo explica, pero allí llega quien YA pulsó. La explicación tiene que
estar donde se elige.

#### Scenario: Se abre la lista de hijos

- **WHEN** se muestra la lista, sin abrir nada
- **THEN** se puede leer que dar de baja no se recupera y que bloquear es otra cosa

### Requirement: La edad de un hijo se escribe con su unidad y declinada

Donde se enseñe la edad de un hijo SHALL escribirse con su unidad —«8 años»— y NO SHALL escribirse
como una etiqueta seguida de una cifra.

El mismo dato se escribía de dos maneras: con etiqueta en la lista del padre y con su unidad en el
perfil del propio niño. Y la etiqueta sobra: un número seguido de «años» ya dice que es una edad.

La unidad SHALL declinar con la cifra, porque componer un número con un texto fijo produce «1 años».

#### Scenario: Un hijo tiene un año

- **WHEN** se enseña su edad
- **THEN** la unidad va en singular

#### Scenario: Un hijo tiene más de un año

- **WHEN** se enseña su edad
- **THEN** la unidad va en plural

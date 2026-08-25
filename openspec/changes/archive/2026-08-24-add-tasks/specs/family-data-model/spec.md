## ADDED Requirements

### Requirement: Las tareas creadas en un mismo reparto quedan enlazadas

Cuando una misma tarea se asigna a varios hijos, el almacén SHALL guardar una fila por hijo y SHALL
registrar en cada una **a qué reparto pertenece**, de modo que las creadas en el mismo acto puedan
recuperarse juntas. Toda tarea SHALL pertenecer a un reparto, incluidas las asignadas a un solo hijo.

Sin este dato, dos tareas con el mismo título asignadas al mismo hijo en semanas distintas serían
indistinguibles de dos hermanas del mismo reparto, y agruparlas por su título uniría cosas que nunca
se crearon juntas.

#### Scenario: Un reparto entre varios hijos

- **WHEN** se asigna una misma tarea a dos hijos
- **THEN** quedan dos filas, una por hijo
- **AND** las dos indican el mismo reparto

#### Scenario: Repartos distintos con el mismo título

- **WHEN** se asigna dos veces, en momentos distintos, una tarea con el mismo título al mismo hijo
- **THEN** cada fila indica un reparto distinto

#### Scenario: Una tarea para un solo hijo también tiene reparto

- **WHEN** se asigna una tarea a un único hijo
- **THEN** su fila indica un reparto, igual que si fueran varias

#### Scenario: Las tareas anteriores al reparto siguen siendo recuperables

- **WHEN** se consultan tareas creadas antes de que el almacén registrara el reparto
- **THEN** cada una aparece como un reparto propio
- **AND** ninguna queda sin reparto

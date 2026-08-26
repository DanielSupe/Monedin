## MODIFIED Requirements

### Requirement: El niño marca su tarea como hecha

Un niño SHALL poder marcar como hecha una tarea **suya que esté pendiente**, lo que la deja a la
espera de que su padre la resuelva, y SHALL poder adjuntar **opcionalmente** una foto como evidencia
de que la hizo. NO SHALL poder marcar la de un hermano, ni una que ya esté marcada o aprobada.
Marcarla NO SHALL acreditar ninguna moneda.

Que marcarla no pague es lo que hace que la aprobación del padre signifique algo. Que la foto sea
opcional es lo que hace que siga siendo posible marcarla sin cámara a mano: adjuntar una evidencia es
una forma de enseñar el trabajo, no un peaje para declararlo.

Si la evidencia adjunta no se puede confirmar, la tarea NO SHALL quedar marcada: es preferible que el
niño reintente a que quede como hecha con una foto que no está.

#### Scenario: El niño marca una tarea pendiente

- **WHEN** un niño marca como hecha una tarea suya que estaba pendiente
- **THEN** la tarea queda a la espera de que su padre la resuelva
- **AND** su saldo no ha cambiado

#### Scenario: El niño marca una tarea sin adjuntar nada

- **WHEN** un niño marca como hecha una tarea suya sin adjuntar ninguna foto
- **THEN** la tarea queda marcada exactamente igual
- **AND** queda registrada sin evidencia

#### Scenario: El niño marca una tarea adjuntando una foto

- **WHEN** un niño sube una foto y marca como hecha una tarea suya adjuntándola
- **THEN** la tarea queda marcada
- **AND** la evidencia queda asociada a esa tarea

#### Scenario: La evidencia no se puede confirmar

- **WHEN** un niño intenta marcar una tarea adjuntando una evidencia que no llegó a subirse, o que
  pertenece a otra tarea
- **THEN** la operación se rechaza como entrada inválida
- **AND** la tarea **sigue pendiente**, sin marcar

#### Scenario: Marcar dos veces a la vez

- **WHEN** llegan dos peticiones simultáneas para marcar la misma tarea
- **THEN** una tiene efecto y la otra se rechaza señalando el conflicto

#### Scenario: El niño marca la tarea de un hermano

- **WHEN** un niño intenta marcar como hecha una tarea de su hermano
- **THEN** la respuesta es la misma que para una tarea inexistente
- **AND** la tarea del hermano sigue como estaba

#### Scenario: El niño marca una tarea ya aprobada

- **WHEN** un niño intenta marcar una tarea suya que ya estaba aprobada
- **THEN** la operación se rechaza señalando el conflicto de estado

#### Scenario: Un padre no marca tareas

- **WHEN** el perfil activo es el del padre e intenta marcar una tarea como hecha
- **THEN** la operación se rechaza por falta de permiso

## ADDED Requirements

### Requirement: El padre ve la evidencia antes de resolver la tarea

Cuando una tarea marcada como hecha lleve una evidencia adjunta, el padre SHALL verla al consultar sus
tareas, antes de aprobarla o rechazarla. El sistema SHALL entregarla resuelta y lista para pintarse,
sin exponer la clave interna.

La evidencia es información para decidir, no un requisito para hacerlo: el padre SHALL poder aprobar o
rechazar igual una tarea que no la lleva.

#### Scenario: El padre consulta una tarea con evidencia

- **WHEN** un padre consulta una tarea suya marcada como hecha que lleva evidencia
- **THEN** la respuesta trae una URL con la que mostrarla

#### Scenario: El padre resuelve una tarea sin evidencia

- **WHEN** un padre aprueba o rechaza una tarea marcada como hecha que no lleva evidencia
- **THEN** la operación se resuelve con normalidad

#### Scenario: El niño ve su propia evidencia

- **WHEN** un niño consulta una tarea suya que marcó adjuntando una foto
- **THEN** la respuesta trae la evidencia que él mismo adjuntó

#### Scenario: La evidencia de un hermano no se ve

- **WHEN** un niño consulta su lista de tareas
- **THEN** no aparece ninguna evidencia de una tarea de su hermano

### Requirement: Solo se adjunta evidencia a una tarea que sigue pendiente

Pedir subir una evidencia SHALL exigir que la tarea siga pendiente. Una tarea ya marcada o ya aprobada
NO SHALL admitir una evidencia nueva: lo que se enseña es el trabajo antes de declararlo hecho, no
después de que su padre lo resolviera.

#### Scenario: Se pide subir evidencia de una tarea pendiente

- **WHEN** un niño pide subir la evidencia de una tarea suya que está pendiente
- **THEN** recibe una URL de subida

#### Scenario: Se pide subir evidencia de una tarea ya marcada

- **WHEN** un niño pide subir la evidencia de una tarea suya que ya está marcada o aprobada
- **THEN** la operación se rechaza señalando el conflicto de estado

#### Scenario: Se pide subir evidencia de la tarea de un hermano

- **WHEN** un niño pide subir la evidencia de una tarea de su hermano
- **THEN** la respuesta es la misma que para una tarea inexistente

#### Scenario: Un padre no adjunta evidencia

- **WHEN** el perfil activo es el del padre e intenta subir una evidencia
- **THEN** la operación se rechaza por falta de permiso

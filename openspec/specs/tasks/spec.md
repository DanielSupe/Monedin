# tasks Specification

## Purpose

Define cómo una tarea vale monedas: cómo un padre la reparte entre sus hijos, cómo cada hijo la marca
cuando la hace, y cómo el padre la aprueba —acreditando— o la rechaza, de modo que el vínculo entre
el esfuerzo y el ingreso sea el que el producto enseña y que ningún doble toque acredite de más.

## Requirements

### Requirement: Un padre reparte una tarea entre sus hijos

El sistema SHALL permitir a un padre crear una tarea para uno o varios de sus hijos, indicando su
título, su valor en monedas y, opcionalmente, una descripción y una fecha límite. SHALL crearse **una
tarea independiente por hijo**, cada una con su propio estado, y todas SHALL quedar identificadas
como parte del mismo reparto.

El valor SHALL poder indicarse de dos formas, y SHALL cumplirse exactamente una: el mismo para todos
los hijos, o uno distinto para cada uno. Un padre NO SHALL poder repartir a hijos que no sean suyos.

Una tarea por hijo y no una compartida es lo que permite que el mayor la tenga hecha y el menor no, y
que cada una se apruebe por separado.

#### Scenario: Se reparte con el mismo valor para todos

- **WHEN** un padre crea una tarea para dos hijos suyos con un mismo valor en monedas
- **THEN** quedan dos tareas, una por hijo, ambas pendientes y con ese valor
- **AND** las dos pertenecen al mismo reparto

#### Scenario: Se reparte con un valor distinto por hijo

- **WHEN** un padre crea una tarea indicando un valor propio para cada hijo
- **THEN** cada tarea queda con el valor que le corresponde a su hijo

#### Scenario: Las dos formas a la vez, o ninguna

- **WHEN** se intenta crear una tarea indicando las dos formas de valor a la vez, o ninguna de las dos
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Una tarea nace pendiente

- **WHEN** se crea una tarea
- **THEN** su estado es pendiente
- **AND** no se ha acreditado ninguna moneda

#### Scenario: Un valor fuera del rango del producto

- **WHEN** se intenta crear una tarea con un valor de cero monedas, negativo o por encima del máximo
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Un niño no reparte tareas

- **WHEN** el perfil activo es el de un niño e intenta crear una tarea
- **THEN** la operación se rechaza por falta de permiso

### Requirement: El reparto es todo o nada

Antes de crear ninguna tarea, el sistema SHALL comprobar que **todos** los hijos indicados existen,
están activos y pertenecen a quien reparte. Si alguno no cumple, NO SHALL crearse ninguna tarea, ni
siquiera las de los hijos correctos.

Un reparto a medias es peor que uno fallido: el padre creería que sus tres hijos tienen la tarea
cuando solo la tienen dos, y no habría nada en la interfaz que se lo dijera.

#### Scenario: Un hijo de otra familia entre los indicados

- **WHEN** un padre reparte una tarea entre dos hijos suyos y uno de otra familia
- **THEN** la operación se rechaza como si ese hijo no existiera
- **AND** no queda creada ninguna tarea, tampoco las de sus propios hijos

#### Scenario: Un hijo dado de baja entre los indicados

- **WHEN** entre los hijos indicados hay uno dado de baja
- **THEN** la operación se rechaza
- **AND** no queda creada ninguna tarea

#### Scenario: Un identificador inexistente

- **WHEN** entre los hijos indicados hay un identificador que no existe
- **THEN** la respuesta es la misma que para un hijo de otra familia, sin permitir deducir cuál era
  el caso

### Requirement: El padre ve sus tareas agrupadas por reparto

El sistema SHALL ofrecer al padre sus tareas **agrupadas por el reparto que las creó**, y SHALL
paginar por reparto, de modo que las tareas de un mismo reparto NO SHALL quedar partidas entre dos
páginas. Cada grupo SHALL mostrar, por cada hijo, su tarea con su valor y su estado.

El listado SHALL poder filtrarse por estado y por hijo. Filtrar por completadas es lo que le da al
padre la lista de lo que le toca aprobar.

#### Scenario: Un reparto se ve entero

- **WHEN** un padre lista sus tareas y una de ellas se repartió entre dos hijos
- **THEN** aparece como un único grupo con las dos tareas dentro
- **AND** cada una indica de qué hijo es, cuánto vale y en qué estado está

#### Scenario: Un reparto no se parte entre páginas

- **WHEN** se recorren todas las páginas del listado
- **THEN** cada reparto aparece completo en una sola página
- **AND** ningún reparto aparece en dos páginas

#### Scenario: El total cuenta repartos

- **WHEN** un padre tiene tres repartos que suman siete tareas
- **THEN** el total del listado es tres

#### Scenario: Se filtra lo que hay que aprobar

- **WHEN** un padre filtra por tareas completadas
- **THEN** obtiene únicamente las que sus hijos han marcado y él no ha resuelto

#### Scenario: Se filtra por hijo

- **WHEN** un padre filtra por uno de sus hijos
- **THEN** obtiene solo las tareas de ese hijo

#### Scenario: El listado no cruza familias

- **WHEN** un padre lista sus tareas
- **THEN** no aparece ninguna tarea de otra familia

#### Scenario: Un niño no usa el listado del padre

- **WHEN** el perfil activo es el de un niño y pide el listado de repartos
- **THEN** la operación se rechaza por falta de permiso

### Requirement: El niño ve sus tareas y solo las suyas

El sistema SHALL ofrecer a un niño sus propias tareas, con su título, su valor en monedas, su estado
y su fecha límite si la tiene. Las tareas ofrecidas SHALL determinarse por la sesión y NUNCA por un
identificador enviado en la petición.

#### Scenario: El niño ve lo suyo

- **WHEN** un niño con su perfil activo pide sus tareas
- **THEN** obtiene las suyas con su valor en monedas y su estado

#### Scenario: El niño no ve las de su hermano

- **WHEN** un niño pide sus tareas y tiene un hermano con tareas propias
- **THEN** ninguna de las devueltas es de su hermano

#### Scenario: El niño consulta una tarea que no es suya

- **WHEN** un niño pide el detalle de una tarea de su hermano
- **THEN** la respuesta es la misma que para una tarea inexistente

#### Scenario: Un padre no usa el listado del niño

- **WHEN** el perfil activo es el del padre y pide la vista de tareas propias de niño
- **THEN** la operación se rechaza por falta de permiso

### Requirement: Una tarea solo se modifica mientras está pendiente

Un padre SHALL poder cambiar el título, la descripción, el valor en monedas y la fecha límite de una
tarea suya **mientras siga pendiente**. Una vez el hijo la ha marcado o el padre la ha aprobado, el
sistema NO SHALL permitir modificarla. NO SHALL poder cambiarse a qué hijo pertenece.

Cambiar el valor de una tarea ya aprobada reescribiría lo que el niño ya ganó, y el historial de
monedas no se reescribe.

#### Scenario: Se corrige una tarea pendiente

- **WHEN** un padre cambia el título o el valor de una tarea suya que sigue pendiente
- **THEN** el cambio queda guardado

#### Scenario: Se intenta modificar una tarea ya marcada

- **WHEN** un padre intenta modificar una tarea que su hijo marcó como hecha
- **THEN** la operación se rechaza señalando el conflicto de estado
- **AND** la tarea sigue como estaba

#### Scenario: Se intenta modificar una tarea aprobada

- **WHEN** un padre intenta modificar una tarea ya aprobada
- **THEN** la operación se rechaza señalando el conflicto de estado

#### Scenario: No se reasigna a otro hijo

- **WHEN** se intenta cambiar el hijo al que pertenece una tarea
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Un niño no modifica sus tareas

- **WHEN** un niño intenta cambiar el valor o el título de una tarea suya
- **THEN** la operación se rechaza por falta de permiso

### Requirement: Una tarea solo se elimina mientras está pendiente

Un padre SHALL poder eliminar una tarea suya **mientras siga pendiente**. En cualquier otro estado el
sistema SHALL rechazarlo señalando el conflicto.

Una tarea aprobada tiene una entrada en el historial de monedas que la señala, y ese historial no se
destruye. Una tarea ya marcada por el hijo tampoco se borra: el niño hizo el trabajo y merece una
respuesta, sea aprobarla o rechazarla.

#### Scenario: Se elimina una tarea pendiente

- **WHEN** un padre elimina una tarea suya que sigue pendiente
- **THEN** la tarea deja de existir y desaparece de los listados

#### Scenario: Se intenta eliminar una tarea marcada o aprobada

- **WHEN** un padre intenta eliminar una tarea completada o aprobada
- **THEN** la operación se rechaza señalando el conflicto de estado
- **AND** la tarea sigue existiendo, igual que su historial si lo tiene

#### Scenario: Una tarea de otra familia

- **WHEN** un padre intenta eliminar una tarea que no es suya
- **THEN** la respuesta es la misma que para una tarea inexistente

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

### Requirement: Aprobar una tarea acredita sus monedas

Un padre SHALL poder aprobar una tarea suya **que su hijo haya marcado como hecha**. Aprobarla SHALL
acreditar su valor al saldo de ese hijo y SHALL dejar la entrada de historial correspondiente, en la
**misma unidad de trabajo** que el cambio de estado: NO SHALL quedar una tarea aprobada sin sus
monedas, ni monedas acreditadas sin la tarea aprobada.

Una tarea que sigue pendiente NO SHALL poder aprobarse: el niño todavía no ha dicho que la hizo.

#### Scenario: El padre aprueba una tarea marcada

- **WHEN** un padre aprueba una tarea que su hijo había marcado como hecha
- **THEN** la tarea queda aprobada
- **AND** el saldo del hijo aumenta exactamente en el valor de la tarea
- **AND** queda una entrada de historial que señala esa tarea

#### Scenario: No se puede aprobar lo que nadie ha hecho

- **WHEN** un padre intenta aprobar una tarea que sigue pendiente
- **THEN** la operación se rechaza señalando el conflicto de estado
- **AND** no se acredita ninguna moneda

#### Scenario: Falla la acreditación

- **WHEN** el cambio de estado se aplica pero la acreditación no puede completarse
- **THEN** la tarea sigue sin aprobar
- **AND** el saldo del hijo es el que era

#### Scenario: Un padre sobre una tarea ajena

- **WHEN** un padre intenta aprobar una tarea de otra familia
- **THEN** la respuesta es la misma que para una tarea inexistente
- **AND** no se acredita ninguna moneda a nadie

#### Scenario: Un niño no aprueba

- **WHEN** el perfil activo es el de un niño e intenta aprobar una tarea, la suya incluida
- **THEN** la operación se rechaza por falta de permiso

### Requirement: Una misma tarea nunca acredita dos veces

Aprobar una tarea SHALL tener efecto **una sola vez**, incluso si la petición llega repetida o
simultánea. El sistema SHALL condicionar el cambio de estado a que la tarea siga estando marcada como
hecha, y SHALL rechazar como conflicto cualquier intento que no lo consiga.

Esto existe porque un niño con un teléfono lento va a tocar dos veces, y porque la operación de mover
monedas no impide por sí sola que se la llame dos veces: la garantía viene de la condición sobre el
estado.

#### Scenario: Doble toque sobre aprobar

- **WHEN** llegan dos peticiones simultáneas para aprobar la misma tarea
- **THEN** una acredita y la otra se rechaza señalando el conflicto
- **AND** el saldo del hijo aumenta una sola vez
- **AND** queda una única entrada de historial para esa tarea

#### Scenario: Aprobar algo ya aprobado

- **WHEN** un padre intenta aprobar una tarea que ya había aprobado antes
- **THEN** la operación se rechaza señalando el conflicto
- **AND** el saldo del hijo no cambia

#### Scenario: El saldo cuadra con su historia

- **WHEN** se aprueban varias tareas del mismo hijo, algunas a la vez
- **THEN** su saldo coincide con la suma de las entradas de su historial

### Requirement: Rechazar devuelve la tarea a pendiente

Un padre SHALL poder rechazar una tarea suya que su hijo haya marcado como hecha, lo que la SHALL
devolver a pendiente para que el hijo la reintente. Rechazar NO SHALL acreditar ni descontar monedas,
y NO SHALL existir un estado terminal de rechazo.

#### Scenario: El padre rechaza una tarea marcada

- **WHEN** un padre rechaza una tarea que su hijo había marcado como hecha
- **THEN** la tarea vuelve a estar pendiente
- **AND** el hijo puede volver a marcarla
- **AND** el saldo del hijo no ha cambiado

#### Scenario: No se rechaza lo que ya está aprobado

- **WHEN** un padre intenta rechazar una tarea ya aprobada
- **THEN** la operación se rechaza señalando el conflicto de estado
- **AND** las monedas ya acreditadas siguen acreditadas

#### Scenario: No se rechaza lo que sigue pendiente

- **WHEN** un padre intenta rechazar una tarea que nadie ha marcado
- **THEN** la operación se rechaza señalando el conflicto de estado

#### Scenario: Rechazar dos veces a la vez

- **WHEN** llegan dos peticiones simultáneas para rechazar la misma tarea
- **THEN** una tiene efecto y la otra se rechaza señalando el conflicto

### Requirement: La fecha límite es informativa

Una tarea SHALL poder llevar una fecha límite opcional, que el sistema SHALL mostrar. Esa fecha NO
SHALL cambiar ninguna regla: una tarea vencida SHALL poder marcarse y aprobarse con normalidad, NO
SHALL cambiar de estado por sí sola y NO SHALL perder valor.

Se declara así a propósito. Vencimientos con consecuencias traen preguntas —si caduca, si avisa, si
sigue valiendo— que merecen decidirse aparte y probablemente con notificaciones.

#### Scenario: Una tarea vencida se completa igual

- **WHEN** un niño marca como hecha una tarea cuya fecha límite ya pasó
- **THEN** la operación se atiende con normalidad
- **AND** al aprobarla se acredita su valor completo

#### Scenario: Una fecha límite que pasa no cambia nada

- **WHEN** pasa la fecha límite de una tarea pendiente
- **THEN** su estado sigue siendo pendiente
- **AND** su valor en monedas sigue siendo el mismo

#### Scenario: Una tarea sin fecha límite

- **WHEN** se crea una tarea sin indicar fecha límite
- **THEN** queda creada igualmente y sin fecha

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

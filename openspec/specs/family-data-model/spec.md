# family-data-model Specification

## Purpose

Define qué entidades componen el mundo de una familia en Monedín, de quién es cada una y qué datos el
sistema se niega a almacenar, de modo que las reglas de pertenencia y los límites del producto estén
garantizados por el almacén y no dependan de que cada módulo se acuerde de comprobarlos.

## Requirements

### Requirement: Un hijo pertenece a exactamente un padre

Todo perfil de hijo SHALL estar asociado a un único padre, y esa asociación SHALL ser obligatoria. El
sistema NO SHALL permitir almacenar un perfil de hijo sin padre, ni un perfil cuyo padre no exista.

#### Scenario: Se intenta guardar un hijo sin padre

- **WHEN** se intenta crear un perfil de hijo sin indicar a qué padre pertenece
- **THEN** el almacén rechaza la operación
- **AND** no queda ningún perfil huérfano

#### Scenario: Se intenta guardar un hijo con un padre inexistente

- **WHEN** se intenta crear un perfil de hijo referido a un padre que no existe
- **THEN** el almacén rechaza la operación

#### Scenario: Un padre tiene varios hijos

- **WHEN** un padre crea un segundo perfil de hijo
- **THEN** ambos perfiles coexisten y cada uno mantiene su propio saldo

### Requirement: El hijo no es un usuario del sistema

El hijo SHALL existir únicamente como perfil dentro de la cuenta de su padre, con su propio nombre y
su propia credencial de acceso. NO SHALL existir una cuenta de usuario independiente para un hijo, ni
un registro público que permita crear una.

#### Scenario: Los datos del hijo viven en un solo sitio

- **WHEN** se actualiza el nombre y la edad de un hijo
- **THEN** ambos cambios afectan a una única entidad
- **AND** no se puede quedar a medias con el nombre actualizado y la edad no

#### Scenario: Solo el padre puede originar un hijo

- **WHEN** se crea un perfil de hijo
- **THEN** siempre queda registrado el padre que lo creó
- **AND** no existe ninguna vía de alta que no parta de un padre existente

### Requirement: La identidad del padre es única

El correo de un padre SHALL ser único en todo el sistema. Un intento de registrar un correo ya
existente SHALL ser rechazado por el almacén y NO SHALL depender de una comprobación previa hecha por
el código, que podría perder la carrera con otra petición simultánea.

#### Scenario: Dos registros con el mismo correo

- **WHEN** dos peticiones intentan registrar el mismo correo a la vez
- **THEN** solo una de ellas queda almacenada
- **AND** la otra se rechaza señalando el conflicto, no como un fallo inesperado

### Requirement: El almacén rechaza datos fuera de los límites del producto

Los límites de dominio (edad del hijo, valor en monedas de una tarea o de un premio) SHALL estar
garantizados por el almacén, no solo por la validación de entrada. Un dato que incumpla un límite
SHALL ser rechazado aunque llegue por una vía que se saltó la validación, como una consulta escrita a
mano o una migración de datos.

#### Scenario: Edad fuera del rango del producto

- **WHEN** se intenta guardar un hijo con una edad fuera del rango que el producto declara
- **THEN** el almacén rechaza la operación

#### Scenario: Tarea sin valor

- **WHEN** se intenta guardar una tarea con un valor de cero monedas o negativo
- **THEN** el almacén rechaza la operación

#### Scenario: Premio por encima del máximo

- **WHEN** se intenta asignar a un premio un precio por encima del máximo declarado
- **THEN** el almacén rechaza la operación

#### Scenario: Los límites del almacén y los del contrato compartido coinciden

- **WHEN** se cambia un límite de dominio en el contrato compartido sin actualizar el almacén
- **THEN** la verificación del proyecto falla indicando qué límite ha quedado descuadrado

### Requirement: Un premio se asigna a cada hijo con su propio precio

Un premio SHALL poder asignarse a varios hijos, y cada asignación SHALL llevar su propio precio en
monedas. El sistema NO SHALL permitir dos asignaciones del mismo premio al mismo hijo.

#### Scenario: El mismo premio cuesta distinto a cada hijo

- **WHEN** un padre asigna un premio a dos hijos con precios distintos
- **THEN** cada hijo ve el precio que le corresponde

#### Scenario: Asignación duplicada

- **WHEN** se intenta asignar el mismo premio al mismo hijo por segunda vez
- **THEN** el almacén rechaza la operación en vez de crear una segunda asignación

### Requirement: Un canje conserva el precio que tenía al solicitarse

Una solicitud de canje SHALL almacenar el precio en monedas vigente en el momento de solicitarla. Un
cambio posterior del precio del premio NO SHALL alterar las solicitudes ya existentes.

#### Scenario: El precio cambia con un canje pendiente

- **WHEN** un hijo solicita un premio y el padre cambia después su precio
- **THEN** la solicitud pendiente conserva el precio original
- **AND** aprobarla descuenta ese precio original, no el nuevo

### Requirement: Rechazar una tarea la devuelve a pendiente

El ciclo de vida de una tarea SHALL contemplar únicamente los estados pendiente, completada y
aprobada. NO SHALL existir un estado de tarea rechazada: rechazar devuelve la tarea a pendiente para
que el hijo la reintente.

#### Scenario: El padre rechaza una tarea completada

- **WHEN** el padre rechaza una tarea que el hijo había marcado como completada
- **THEN** la tarea vuelve a estar pendiente
- **AND** el hijo puede volver a marcarla como completada

#### Scenario: No existe un estado terminal de rechazo

- **WHEN** se inspeccionan los estados posibles de una tarea
- **THEN** no hay ninguno que represente un rechazo definitivo

### Requirement: Dar de baja no destruye historial

Dar de baja un hijo o retirar un premio SHALL ocultarlos de los listados sin eliminar sus datos ni
los movimientos de monedas asociados. El sistema NO SHALL permitir eliminar físicamente un perfil de
hijo que tenga historial de monedas.

#### Scenario: Se da de baja un hijo

- **WHEN** un padre da de baja a un hijo
- **THEN** el hijo deja de aparecer en los listados del padre
- **AND** su historial de monedas sigue existiendo y siendo consultable

#### Scenario: Se intenta borrar físicamente un hijo con historial

- **WHEN** se intenta eliminar del almacén un perfil de hijo que tiene movimientos de monedas
- **THEN** el almacén rechaza la operación

#### Scenario: Se retira un premio ya canjeado

- **WHEN** un padre retira un premio que tenía canjes aprobados
- **THEN** el premio deja de poder canjearse
- **AND** los canjes ya realizados siguen siendo consultables

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

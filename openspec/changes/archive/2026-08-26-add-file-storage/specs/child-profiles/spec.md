## MODIFIED Requirements

### Requirement: El niño elige su avatar y nada más de su perfil

Un niño con su perfil activo SHALL poder cambiar su avatar, **eligiendo otro del catálogo o subiendo
una imagen propia**. NO SHALL poder cambiar su nombre, su edad ni su saldo: eso lo lleva su padre.

Es un gesto de autonomía deliberadamente pequeño. Elegir su animal —o su foto— es suyo; lo que le
identifica ante su familia, no.

#### Scenario: El niño cambia su avatar

- **WHEN** un niño elige otro avatar del catálogo
- **THEN** queda guardado y se refleja en la rejilla y en su propio perfil

#### Scenario: El niño sube su propia foto

- **WHEN** un niño sube una imagen propia y la confirma como su avatar
- **THEN** queda guardada y se refleja en la rejilla y en su propio perfil
- **AND** su nombre, su edad y su saldo siguen siendo los que eran

#### Scenario: Un avatar fuera del catálogo

- **WHEN** un niño intenta guardar una referencia de avatar que no está en el catálogo
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: El niño confirma la foto de un hermano

- **WHEN** un niño intenta confirmar como suya una imagen que pertenece al perfil de un hermano
- **THEN** la operación se rechaza como entrada inválida
- **AND** su avatar sigue siendo el que era

#### Scenario: El niño no cambia su nombre ni su edad

- **WHEN** un niño intenta cambiar su nombre, su edad o su saldo
- **THEN** la operación se rechaza como entrada inválida
- **AND** esos datos siguen siendo los que eran

## ADDED Requirements

### Requirement: El padre puede cambiar el avatar de un hijo suyo, y solo suyo

Un padre SHALL poder cambiar el avatar de un hijo suyo, tanto eligiendo del catálogo como subiendo una
imagen. Un hijo ajeno, inexistente o dado de baja SHALL responder como inexistente, sin confirmar que
existe.

#### Scenario: El padre sube la foto de un hijo suyo

- **WHEN** un padre sube una imagen y la confirma como avatar de un hijo suyo
- **THEN** queda guardada y se refleja en la rejilla y en el listado de sus hijos

#### Scenario: El padre intenta subir sobre un hijo ajeno

- **WHEN** un padre pide subir el avatar de un hijo que no es suyo
- **THEN** la respuesta es la misma que para un hijo inexistente
- **AND** no se entrega ninguna URL de subida

#### Scenario: El padre confirma la foto de un hijo sobre otro

- **WHEN** un padre confirma sobre un hijo suyo una imagen que pertenece al perfil de otro hijo suyo
- **THEN** la operación se rechaza como entrada inválida
- **AND** ninguno de los dos avatares cambia

### Requirement: El avatar se lee siempre resuelto

Toda respuesta que incluya el avatar de un perfil SHALL entregarlo listo para pintarse: o una
referencia del catálogo, o una URL con la que mostrar la imagen propia. El sistema NO SHALL entregar
la clave interna con la que la imagen está guardada.

#### Scenario: Un perfil con avatar del catálogo

- **WHEN** se consulta un perfil cuyo avatar es del catálogo
- **THEN** la respuesta trae la referencia del catálogo, como siempre

#### Scenario: Un perfil con imagen propia

- **WHEN** se consulta un perfil cuyo avatar es una imagen propia
- **THEN** la respuesta trae una URL con la que se puede mostrar directamente
- **AND** no trae la clave interna del almacén

#### Scenario: Un listado con perfiles de los dos tipos

- **WHEN** se pide un listado con perfiles de catálogo y perfiles con foto propia
- **THEN** cada uno viene resuelto en su forma, en la misma respuesta

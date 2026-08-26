## MODIFIED Requirements

### Requirement: Los avatares salen de un catálogo cerrado

El avatar de un perfil SHALL ser **una de dos cosas**: una referencia al catálogo de ilustraciones que
acompaña a la aplicación, compartido por API y front, o una imagen propia que el dueño del perfil ha
subido. El sistema NO SHALL aceptar una referencia de catálogo que no esté en el catálogo, NO SHALL
aceptar una imagen propia que no sea de ese perfil, y SHALL asignar una del catálogo por defecto a un
perfil que no tenga ninguna de las dos.

Las dos formas conviven a propósito: elegir un animal es inmediato y no necesita cámara ni conexión,
y sigue siendo una respuesta completa a «¿quién eres?». Subir una foto es la otra forma del mismo
campo, no su sustituto, y por eso ningún perfil existente necesita migrarse.

#### Scenario: Se guarda un avatar del catálogo

- **WHEN** se asigna a un perfil un avatar del catálogo
- **THEN** queda guardado y la rejilla lo muestra

#### Scenario: Se guarda una imagen propia

- **WHEN** el dueño de un perfil sube una imagen propia y la confirma
- **THEN** queda guardada como su avatar
- **AND** la rejilla la muestra en lugar de la ilustración del catálogo

#### Scenario: Se intenta guardar un avatar que no existe

- **WHEN** se asigna una referencia de avatar que no está en el catálogo
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Se intenta elegir catálogo y foto a la vez

- **WHEN** se intenta guardar en la misma operación una referencia de catálogo y una imagen propia
- **THEN** la operación se rechaza como entrada inválida
- **AND** el avatar del perfil no cambia

#### Scenario: Un perfil sin avatar

- **WHEN** un perfil no tiene avatar asignado
- **THEN** la rejilla lo muestra igualmente, con uno por defecto
- **AND** el perfil sigue siendo distinguible por su nombre

#### Scenario: El catálogo es el mismo en las dos apps

- **WHEN** se añade o se retira una ilustración del catálogo
- **THEN** el cambio se refleja a la vez en la validación de la API y en lo que pinta el front
- **AND** no hay una segunda lista que mantener

#### Scenario: Un perfil que ya tenía avatar de catálogo sigue igual

- **WHEN** existen perfiles con un avatar del catálogo desde antes de poder subir imágenes
- **THEN** siguen mostrándose exactamente igual
- **AND** no hace falta convertirlos ni volver a elegir

## ADDED Requirements

### Requirement: El padre ve su propio avatar también dentro de su sesión

El avatar del padre SHALL viajar con su perfil activo, y no solo con la rejilla previa. Un padre que
eligió su avatar SHALL poder verlo mientras usa la aplicación, igual que ya ocurre con el de un hijo.

Hoy el padre elige su avatar, entra a su perfil y deja de verlo: la rejilla lo conoce y su sesión no.
Es el mismo dato en los dos sitios y debe comportarse igual en los dos.

#### Scenario: El padre entra a su perfil

- **WHEN** un padre entra a su propio perfil
- **THEN** la información de su perfil activo incluye su avatar, resuelto y listo para mostrarse

#### Scenario: El padre consulta su sesión

- **WHEN** se consulta el estado de la sesión con el perfil del padre activo
- **THEN** el actor devuelto incluye su avatar

#### Scenario: El padre sube su propia foto

- **WHEN** un padre sube una imagen propia y la confirma como su avatar
- **THEN** queda guardada
- **AND** se ve tanto en la rejilla como dentro de su sesión

#### Scenario: Un niño no cambia el avatar del padre

- **WHEN** un perfil de niño intenta cambiar el avatar del padre
- **THEN** la operación se rechaza por falta de permiso

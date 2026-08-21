## Purpose

Define qué es una sesión en Monedín, cómo viaja entre el navegador y la API, cuánto dura, cómo se
revoca, y cómo una petición cualquiera se convierte en el actor que reciben los servicios, de modo
que la autorización de todo el sistema descanse sobre una sola pieza y no sobre lo que decida cada
módulo.

## ADDED Requirements

### Requirement: La sesión viaja en una cookie inaccesible desde el navegador

El identificador de sesión SHALL viajar en una cookie marcada como inaccesible desde JavaScript y
restringida a peticiones del mismo sitio. Fuera de desarrollo SHALL exigir además conexión segura. El
identificador NO SHALL viajar en la URL, ni en el cuerpo, ni quedar accesible al código de la página.

#### Scenario: Se inicia sesión

- **WHEN** un acceso es correcto
- **THEN** la respuesta establece la cookie de sesión
- **AND** la cookie está marcada como inaccesible desde JavaScript y restringida al mismo sitio

#### Scenario: En producción se exige conexión segura

- **WHEN** el sistema se ejecuta fuera de desarrollo
- **THEN** la cookie de sesión exige conexión segura

#### Scenario: El identificador no aparece en ningún otro sitio

- **WHEN** se examina una respuesta de acceso correcto
- **THEN** el identificador de sesión no aparece en el cuerpo ni en la URL

### Requirement: El identificador de sesión no se almacena en claro

El sistema SHALL guardar únicamente una derivación irreversible del identificador de sesión. Quien
lea la tabla de sesiones NO SHALL poder suplantar a nadie con lo que encuentre allí.

#### Scenario: Se inspecciona la tabla de sesiones

- **WHEN** se consulta directamente el almacén de sesiones
- **THEN** no aparece ningún identificador utilizable
- **AND** lo almacenado no permite reconstruir la cookie de ningún usuario

#### Scenario: El identificador es impredecible

- **WHEN** se generan muchos identificadores de sesión seguidos
- **THEN** todos son distintos
- **AND** proceden de una fuente criptográficamente segura, no de un contador ni de la hora

### Requirement: Las sesiones caducan

Toda sesión SHALL tener un instante de caducidad. Una sesión caducada NO SHALL conceder acceso,
aunque su cookie siga presente en el navegador.

#### Scenario: Se usa una sesión caducada

- **WHEN** llega una petición con una cookie cuya sesión ya caducó
- **THEN** se trata como si no hubiera sesión
- **AND** la cookie se retira del navegador

#### Scenario: Una sesión de niño no sobrevive a la de su padre

- **WHEN** caduca o se revoca la sesión de padre de la que depende una sesión de niño
- **THEN** la sesión de niño deja de conceder acceso

#### Scenario: El uso prolonga la sesión

- **WHEN** se usa una sesión activa
- **THEN** su caducidad se prolonga, para que un uso continuado no expulse a nadie a mitad de tarea

### Requirement: Las sesiones se pueden revocar

El sistema SHALL poder invalidar una sesión concreta o todas las de una cuenta, con efecto inmediato
sobre las peticiones siguientes. Cerrar sesión SHALL revocar, no solo borrar la cookie.

#### Scenario: Cierre de sesión

- **WHEN** se cierra sesión
- **THEN** la sesión queda revocada en el servidor
- **AND** presentar de nuevo la misma cookie no concede acceso

#### Scenario: Revocación de todas las sesiones de una cuenta

- **WHEN** se revocan todas las sesiones de una cuenta
- **THEN** ninguna de sus cookies previas concede acceso

#### Scenario: Una cookie robada deja de valer al revocar

- **WHEN** una sesión se revoca mientras alguien conserva una copia de su cookie
- **THEN** esa copia deja de conceder acceso a partir de ese momento

### Requirement: Una petición se resuelve a un actor, o a ninguno

El sistema SHALL resolver cada petición a un actor —un padre o un niño— antes de que se ejecute
ninguna lógica de negocio, o determinar que no hay sesión. Los servicios SHALL recibir ese actor y NO
SHALL reconstruirlo por su cuenta ni leer la sesión directamente.

#### Scenario: Petición con sesión de padre

- **WHEN** llega una petición con una sesión de padre válida
- **THEN** el actor que recibe la capa de negocio es el de ese padre

#### Scenario: Petición con sesión de niño

- **WHEN** llega una petición con una sesión de niño válida
- **THEN** el actor que recibe la capa de negocio es el de ese niño
- **AND** lleva también el identificador de su padre, para poder filtrar por familia sin otra consulta

#### Scenario: Petición sin sesión a una ruta protegida

- **WHEN** llega una petición sin sesión válida a una ruta que la requiere
- **THEN** la respuesta es 401 con el cuerpo de error estándar
- **AND** no se ejecuta nada de la lógica de negocio

#### Scenario: Ningún módulo lee la sesión por su cuenta

- **WHEN** se revisa un módulo de dominio cualquiera
- **THEN** no accede al almacén de sesiones
- **AND** obtiene quién llama únicamente del actor que se le pasa

### Requirement: Las rutas nacen protegidas

Toda ruta de la API SHALL requerir sesión salvo que se declare explícitamente como pública. Añadir
una ruta sin decir nada SHALL dejarla protegida, nunca abierta.

#### Scenario: Se añade una ruta sin declarar nada

- **WHEN** se registra una ruta nueva sin indicar que es pública
- **THEN** una petición sin sesión a esa ruta responde 401

#### Scenario: Ruta pública declarada

- **WHEN** una ruta se declara explícitamente como pública
- **THEN** responde sin sesión

#### Scenario: La sonda de salud sigue siendo pública

- **WHEN** se llama a la sonda de salud sin credenciales
- **THEN** responde correctamente, como antes de existir la autenticación

### Requirement: Una ruta puede exigir un rol concreto

El sistema SHALL permitir que una ruta exija sesión de padre o sesión de niño. Esta comprobación de
rol NO SHALL sustituir a la autorización sobre el recurso concreto, que sigue viviendo en la capa de
negocio.

#### Scenario: Ruta de padre llamada por un niño

- **WHEN** una sesión de niño llama a una ruta que exige rol de padre
- **THEN** la respuesta es 403

#### Scenario: Ruta de niño llamada por un padre

- **WHEN** una sesión de padre llama a una ruta que exige rol de niño
- **THEN** la respuesta es 403

#### Scenario: El rol correcto no basta para operar sobre cualquier recurso

- **WHEN** un padre con el rol correcto opera sobre un recurso de otra familia
- **THEN** la capa de negocio lo rechaza igualmente
- **AND** la comprobación de rol de la ruta no ha servido de autorización

### Requirement: El estado de la sesión es consultable

El sistema SHALL ofrecer un punto donde el cliente pueda preguntar quién está autenticado, para que
la aplicación web sepa qué mostrar al cargarse. SHALL responder correctamente también cuando no hay
sesión, y NO SHALL exponer datos de credenciales ni el identificador de sesión.

#### Scenario: Hay sesión de padre

- **WHEN** el cliente consulta el estado de la sesión con una sesión de padre
- **THEN** obtiene que hay un padre autenticado y sus datos básicos

#### Scenario: Hay sesión de niño

- **WHEN** el cliente consulta el estado con una sesión de niño
- **THEN** obtiene que hay un niño autenticado, sus datos básicos y su saldo
- **AND** obtiene que hay una sesión de padre disponible detrás

#### Scenario: No hay sesión

- **WHEN** el cliente consulta el estado sin sesión
- **THEN** la respuesta indica que no hay nadie autenticado
- **AND** no es un error: la aplicación web necesita preguntarlo al arrancar

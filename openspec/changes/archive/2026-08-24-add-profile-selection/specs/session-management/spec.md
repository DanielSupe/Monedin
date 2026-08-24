## MODIFIED Requirements

### Requirement: Una petición se resuelve a un actor, o a ninguno

El sistema SHALL resolver cada petición a un actor —un padre o un niño— antes de que se ejecute
ninguna lógica de negocio, o determinar que no hay actor. Los servicios SHALL recibir ese actor y NO
SHALL reconstruirlo por su cuenta ni leer la sesión directamente.

La resolución tiene **dos niveles**, y esa es la diferencia respecto a antes. La sesión de cuenta
acredita que el dispositivo pertenece a una cuenta y NO SHALL bastar para obtener un actor. El actor
sale del **perfil activo**, que se consigue eligiéndolo en la rejilla y tecleando su PIN. Una sesión
de cuenta sin perfil activo se resuelve a ninguno.

Sin esta separación el PIN de adulto sería solo una pantalla: bastaría con llamar al endpoint
directamente para operar como el padre.

#### Scenario: Petición con perfil de padre activo

- **WHEN** llega una petición con una sesión de cuenta válida y el perfil del padre activo
- **THEN** el actor que recibe la capa de negocio es el de ese padre

#### Scenario: Petición con perfil de niño activo

- **WHEN** llega una petición con una sesión de cuenta válida y el perfil de un niño activo
- **THEN** el actor que recibe la capa de negocio es el de ese niño
- **AND** lleva también el identificador de su padre, para poder filtrar por familia sin otra consulta

#### Scenario: Petición con sesión de cuenta y sin perfil elegido

- **WHEN** llega una petición a una ruta protegida con sesión de cuenta y ningún perfil activo
- **THEN** la respuesta es 401 con el cuerpo de error estándar
- **AND** no se ejecuta nada de la lógica de negocio

#### Scenario: Petición sin sesión a una ruta protegida

- **WHEN** llega una petición sin sesión válida a una ruta que la requiere
- **THEN** la respuesta es 401 con el cuerpo de error estándar
- **AND** no se ejecuta nada de la lógica de negocio

#### Scenario: El perfil activo caduca antes que la cuenta

- **WHEN** el perfil activo caduca y la sesión de cuenta sigue vigente
- **THEN** las peticiones a rutas protegidas responden 401
- **AND** volver a operar exige elegir perfil de nuevo, no la contraseña

#### Scenario: Ningún módulo lee la sesión por su cuenta

- **WHEN** se revisa un módulo de dominio cualquiera
- **THEN** no accede al almacén de sesiones
- **AND** obtiene quién llama únicamente del actor que se le pasa

### Requirement: El estado de la sesión es consultable

El sistema SHALL ofrecer un punto donde el cliente pueda preguntar quién está autenticado, para que
la aplicación web sepa qué mostrar al cargarse. SHALL responder correctamente también cuando no hay
sesión, y NO SHALL exponer datos de credenciales ni el identificador de sesión.

La respuesta SHALL distinguir **tres situaciones**, no dos: sin sesión de cuenta, con sesión de
cuenta y sin perfil elegido, y con un perfil activo. La aplicación web las necesita para saber si
pintar el acceso, la rejilla o la pantalla del perfil.

#### Scenario: No hay sesión

- **WHEN** el cliente consulta el estado sin sesión
- **THEN** la respuesta indica que no hay cuenta ni perfil
- **AND** no es un error: la aplicación web necesita preguntarlo al arrancar

#### Scenario: Hay cuenta y no se ha elegido perfil

- **WHEN** el cliente consulta el estado con sesión de cuenta y sin perfil activo
- **THEN** la respuesta indica que hay cuenta y que falta elegir perfil
- **AND** no incluye ningún dato de un perfil concreto

#### Scenario: Hay perfil de padre activo

- **WHEN** el cliente consulta el estado con el perfil del padre activo
- **THEN** obtiene que hay un padre autenticado y sus datos básicos

#### Scenario: Hay perfil de niño activo

- **WHEN** el cliente consulta el estado con el perfil de un niño activo
- **THEN** obtiene que hay un niño autenticado, sus datos básicos y su saldo

#### Scenario: La respuesta nunca lleva credenciales

- **WHEN** se consulta el estado en cualquiera de las tres situaciones
- **THEN** la respuesta no contiene credenciales ni el identificador de sesión

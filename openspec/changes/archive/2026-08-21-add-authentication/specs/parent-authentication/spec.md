## Purpose

Define cómo un padre crea su cuenta en Monedín y cómo demuestra ser quien dice ser, de modo que la
credencial que abre el acceso a los datos de sus hijos no se pueda adivinar, no se guarde nunca en
claro, y no revele a un desconocido qué correos están registrados.

## ADDED Requirements

### Requirement: Registro público de un padre

El sistema SHALL permitir que cualquier persona cree una cuenta de padre indicando nombre, correo y
contraseña. NO SHALL existir ninguna vía pública de registro para un niño.

#### Scenario: Registro con datos válidos

- **WHEN** alguien se registra con un nombre, un correo no usado y una contraseña que cumple la política
- **THEN** queda creada su cuenta de padre
- **AND** queda con la sesión iniciada, sin tener que acceder acto seguido

#### Scenario: El correo ya está registrado

- **WHEN** alguien intenta registrarse con un correo que ya existe
- **THEN** el registro se rechaza
- **AND** la comprobación la garantiza el almacén, de modo que dos registros simultáneos del mismo
  correo no crean dos cuentas

#### Scenario: La contraseña no cumple la política

- **WHEN** alguien se registra con una contraseña más corta que el mínimo exigido
- **THEN** el registro se rechaza indicando el campo que falla
- **AND** no queda ninguna cuenta a medio crear

#### Scenario: No hay registro de niños

- **WHEN** se recorren los puntos de entrada públicos del sistema
- **THEN** ninguno permite crear un perfil de niño
- **AND** la única forma de que exista un niño es que lo cree un padre desde su sesión

### Requirement: Acceso con correo y contraseña

El sistema SHALL permitir a un padre iniciar sesión con su correo y su contraseña. Ante credenciales
incorrectas SHALL responder de la misma forma tanto si el correo no existe como si la contraseña no
coincide, para no revelar qué correos están registrados.

#### Scenario: Credenciales correctas

- **WHEN** un padre accede con su correo y su contraseña
- **THEN** obtiene una sesión activa
- **AND** la respuesta incluye sus datos básicos, nunca su credencial

#### Scenario: La contraseña no coincide

- **WHEN** un padre accede con su correo y una contraseña equivocada
- **THEN** el acceso se rechaza sin indicar cuál de los dos datos falla

#### Scenario: El correo no está registrado

- **WHEN** alguien accede con un correo que no existe
- **THEN** la respuesta es indistinguible de la de una contraseña equivocada
- **AND** el tiempo que tarda tampoco permite distinguir los dos casos

### Requirement: Las credenciales nunca se guardan ni se transmiten en claro

El sistema SHALL almacenar únicamente una derivación irreversible y con sal de la contraseña. NO
SHALL guardarla en claro, ni reversiblemente cifrada, ni escribirla en logs, ni devolverla en ninguna
respuesta, ni siquiera a su propio dueño.

#### Scenario: Se inspecciona la cuenta almacenada

- **WHEN** se consulta directamente el registro de un padre en el almacén
- **THEN** no aparece la contraseña
- **AND** lo que hay almacenado no permite recuperarla

#### Scenario: Dos cuentas con la misma contraseña

- **WHEN** dos padres eligen exactamente la misma contraseña
- **THEN** lo almacenado para cada uno es distinto

#### Scenario: La credencial no aparece en la salida del sistema

- **WHEN** se registra un acceso, correcto o fallido, en el log
- **THEN** la entrada de log no contiene la contraseña ni su derivación

#### Scenario: La respuesta del propio perfil

- **WHEN** un padre consulta sus propios datos
- **THEN** la respuesta no incluye ningún campo de credencial

### Requirement: Bloqueo tras intentos fallidos repetidos

Tras un número consecutivo de accesos fallidos sobre la misma cuenta, el sistema SHALL rechazar los
intentos siguientes durante un periodo, aunque la contraseña sea correcta. Un acceso correcto antes
de alcanzar el límite SHALL poner el contador a cero.

#### Scenario: Se supera el límite de intentos

- **WHEN** se falla la contraseña de una cuenta tantas veces como el límite permite
- **THEN** el intento siguiente se rechaza por bloqueo, no por credencial incorrecta
- **AND** se rechaza aunque la contraseña sea la correcta

#### Scenario: El bloqueo caduca

- **WHEN** transcurre el periodo de bloqueo
- **THEN** la cuenta vuelve a admitir intentos

#### Scenario: Un acceso correcto limpia el contador

- **WHEN** un padre falla algunos intentos por debajo del límite y después acierta
- **THEN** obtiene su sesión
- **AND** el contador de fallos vuelve a cero

#### Scenario: El bloqueo no delata cuentas existentes

- **WHEN** se falla repetidamente contra un correo que no está registrado
- **THEN** la respuesta no permite deducir si la cuenta existe

### Requirement: Cambio de contraseña

Un padre con sesión SHALL poder cambiar su contraseña indicando la actual. Al cambiarla, el sistema
SHALL invalidar las demás sesiones abiertas de esa cuenta y SHALL conservar la que hizo el cambio.

#### Scenario: Cambio con la contraseña actual correcta

- **WHEN** un padre cambia su contraseña indicando correctamente la actual
- **THEN** la nueva queda en vigor
- **AND** la sesión desde la que hizo el cambio sigue activa

#### Scenario: Las demás sesiones dejan de valer

- **WHEN** un padre cambia su contraseña teniendo sesión abierta en otro dispositivo
- **THEN** la sesión del otro dispositivo deja de ser válida

#### Scenario: La contraseña actual no coincide

- **WHEN** un padre intenta cambiarla indicando mal la actual
- **THEN** el cambio se rechaza
- **AND** la contraseña anterior sigue siendo la válida

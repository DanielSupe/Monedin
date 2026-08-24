## ADDED Requirements

### Requirement: El padre tiene un PIN de adulto

El padre SHALL tener un PIN además de su contraseña. La contraseña vincula un dispositivo a la
cuenta; el PIN activa su perfil en el día a día. El PIN SHALL almacenarse como derivación
irreversible y con sal, igual que cualquier otra credencial, y NO SHALL aparecer en respuestas ni en
logs.

Son dos fronteras con frecuencias muy distintas. Vincular un dispositivo pasa una vez; cambiar de
perfil pasa varias veces al día. Exigir la contraseña completa en una tablet para lo segundo es lo
que hace que la gente acabe eligiendo una contraseña corta.

#### Scenario: Se establece el PIN al registrarse

- **WHEN** un padre crea su cuenta
- **THEN** queda establecido su PIN de adulto
- **AND** puede activar su perfil con él sin volver a teclear la contraseña

#### Scenario: El PIN no se puede recuperar del almacén

- **WHEN** se consulta directamente la cuenta del padre en el almacén
- **THEN** no aparece el PIN
- **AND** lo almacenado no permite deducirlo

#### Scenario: El PIN del padre y el de un hijo son independientes

- **WHEN** un padre y un hijo eligen el mismo PIN
- **THEN** lo almacenado para cada uno es distinto
- **AND** el PIN de uno no sirve para entrar al perfil del otro

#### Scenario: El PIN no viaja en ninguna respuesta

- **WHEN** un padre consulta sus propios datos o el estado de su sesión
- **THEN** la respuesta no incluye su PIN ni su derivación

### Requirement: El padre puede cambiar su PIN de adulto

Con su perfil activo, un padre SHALL poder cambiar su PIN indicando el actual. Cambiarlo NO SHALL
cerrar su sesión de cuenta, pero SÍ SHALL desactivar los perfiles activos en otros dispositivos de
esa cuenta.

#### Scenario: Cambio con el PIN actual correcto

- **WHEN** un padre cambia su PIN indicando correctamente el actual
- **THEN** el nuevo queda en vigor y el anterior deja de servir
- **AND** su perfil sigue activo en el dispositivo desde el que lo cambió

#### Scenario: El PIN actual no coincide

- **WHEN** lo intenta indicando mal el actual
- **THEN** el cambio se rechaza y el PIN anterior sigue siendo el válido

#### Scenario: Un niño no puede cambiar el PIN del padre

- **WHEN** el perfil activo es el de un niño e intenta cambiar el PIN de adulto
- **THEN** la operación se rechaza por falta de permiso

### Requirement: El PIN de adulto olvidado se restablece con la contraseña

Un padre que olvide su PIN SHALL poder establecer uno nuevo demostrando su contraseña. Es la vía de
recuperación, y existe precisamente porque el PIN se usa a diario y la contraseña casi nunca.

#### Scenario: Se restablece el PIN con la contraseña

- **WHEN** un padre establece un PIN nuevo indicando su contraseña correcta
- **THEN** el nuevo PIN queda en vigor
- **AND** su perfil queda desbloqueado si estaba bloqueado por intentos

#### Scenario: La contraseña no coincide

- **WHEN** lo intenta con una contraseña equivocada
- **THEN** se rechaza igual que cualquier acceso con credenciales incorrectas
- **AND** el PIN anterior sigue siendo el válido

#### Scenario: Restablecer el PIN no exige perfil activo

- **WHEN** un padre bloqueado fuera de su propio perfil restablece el PIN con su contraseña
- **THEN** la operación se atiende
- **AND** puede volver a entrar a su perfil de inmediato

### Requirement: El perfil del padre se bloquea tras intentos fallidos

Tras un número consecutivo de PIN de adulto incorrectos, el sistema SHALL rechazar los intentos
siguientes durante un periodo, aunque el PIN sea correcto. Un acierto antes del límite SHALL poner el
contador a cero.

#### Scenario: Se supera el límite de intentos

- **WHEN** se falla el PIN de adulto tantas veces como el límite permite
- **THEN** el intento siguiente se rechaza por bloqueo
- **AND** se rechaza aunque el PIN sea el correcto

#### Scenario: El bloqueo del PIN no bloquea la cuenta

- **WHEN** el perfil del padre está bloqueado por intentos de PIN
- **THEN** sus hijos pueden seguir entrando a los suyos con normalidad
- **AND** la contraseña sigue sirviendo para restablecer el PIN

#### Scenario: El bloqueo caduca

- **WHEN** transcurre el periodo de bloqueo
- **THEN** el perfil vuelve a admitir intentos de PIN

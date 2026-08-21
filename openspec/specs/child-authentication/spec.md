# child-authentication Specification

## Purpose

Define cómo un niño entra a sus tareas, su saldo y sus premios desde el dispositivo que la familia
comparte, de modo que sea rápido para él y siga siendo una frontera de verdad: ni un hermano puede
entrar en su perfil probando números, ni un niño puede hacerse pasar por su padre.

## Requirements

### Requirement: El niño entra desde la sesión de su padre

Para entrar a un perfil de niño SHALL existir una sesión de padre activa en el dispositivo. El
sistema SHALL ofrecer únicamente los perfiles de hijos de ese padre que estén activos.

#### Scenario: El padre entrega el dispositivo

- **WHEN** hay una sesión de padre activa y se pide cambiar a un perfil de niño
- **THEN** se ofrecen los perfiles de sus hijos activos
- **AND** cada uno se identifica por su nombre y su avatar, sin exponer ningún otro dato

#### Scenario: No hay sesión de padre

- **WHEN** se intenta entrar a un perfil de niño sin sesión de padre en el dispositivo
- **THEN** la operación se rechaza por falta de sesión

#### Scenario: Un hijo dado de baja no aparece

- **WHEN** el padre dio de baja a un hijo y se listan los perfiles
- **THEN** ese perfil no se ofrece
- **AND** tampoco se puede entrar a él indicando su identificador directamente

#### Scenario: Un perfil de otra familia

- **WHEN** se intenta entrar a un perfil de niño que no es hijo del padre de la sesión
- **THEN** la operación se rechaza
- **AND** la respuesta no permite deducir si ese perfil existe

### Requirement: El PIN abre el perfil del niño

Entrar a un perfil de niño SHALL requerir su PIN. El PIN SHALL almacenarse únicamente como derivación
irreversible y con sal, igual que cualquier otra credencial, y NO SHALL aparecer en respuestas ni en
logs.

#### Scenario: PIN correcto

- **WHEN** se elige un perfil y se teclea su PIN correcto
- **THEN** la sesión pasa a ser la de ese niño

#### Scenario: PIN incorrecto

- **WHEN** se teclea un PIN equivocado
- **THEN** la operación se rechaza
- **AND** la sesión sigue siendo la del padre, sin degradarse ni cerrarse

#### Scenario: El PIN no se puede recuperar del almacén

- **WHEN** se consulta directamente el perfil de un niño en el almacén
- **THEN** no aparece el PIN
- **AND** lo almacenado no permite deducirlo

#### Scenario: Dos niños con el mismo PIN

- **WHEN** dos hermanos eligen el mismo PIN
- **THEN** lo almacenado para cada uno es distinto

### Requirement: Bloqueo del perfil tras intentos fallidos

Tras un número consecutivo de PIN incorrectos sobre el mismo perfil, el sistema SHALL rechazar los
intentos siguientes durante un periodo, aunque el PIN sea correcto. Un acierto antes del límite SHALL
poner el contador a cero.

Este bloqueo es lo que convierte un número de cuatro dígitos en una frontera: sin él, probar todas
las combinaciones es cuestión de minutos.

#### Scenario: Se supera el límite de intentos

- **WHEN** se falla el PIN de un perfil tantas veces como el límite permite
- **THEN** el intento siguiente se rechaza por bloqueo
- **AND** se rechaza aunque el PIN sea el correcto

#### Scenario: El bloqueo es por perfil, no por dispositivo

- **WHEN** un perfil queda bloqueado por intentos fallidos
- **THEN** otro hermano puede entrar al suyo con normalidad

#### Scenario: El padre puede desbloquear

- **WHEN** un perfil está bloqueado y su padre lo desbloquea desde su sesión
- **THEN** el perfil vuelve a admitir intentos de inmediato

#### Scenario: El bloqueo caduca solo

- **WHEN** transcurre el periodo de bloqueo sin que nadie intervenga
- **THEN** el perfil vuelve a admitir intentos

### Requirement: El padre gestiona el PIN de sus hijos

Un padre SHALL poder establecer y restablecer el PIN de cualquiera de sus hijos desde su sesión. NO
SHALL poder hacerlo sobre un perfil que no sea hijo suyo, y un niño NO SHALL poder cambiar ningún
PIN, ni el suyo.

#### Scenario: El padre restablece el PIN de un hijo

- **WHEN** un padre establece un PIN nuevo para un hijo suyo
- **THEN** el PIN anterior deja de servir
- **AND** el perfil queda desbloqueado si lo estaba

#### Scenario: Un padre sobre un hijo ajeno

- **WHEN** un padre intenta cambiar el PIN de un perfil que no es hijo suyo
- **THEN** la operación se rechaza

#### Scenario: Un niño intenta cambiar un PIN

- **WHEN** una sesión de niño intenta establecer un PIN, el suyo o el de un hermano
- **THEN** la operación se rechaza por falta de permiso

### Requirement: La sesión del padre se suspende, no se cierra

Al entrar a un perfil de niño, la sesión del padre SHALL quedar suspendida y recuperable en el mismo
dispositivo, sin volver a pedir la contraseña. Salir del perfil del niño SHALL devolver la sesión del
padre.

#### Scenario: Volver al padre

- **WHEN** se sale del perfil de un niño
- **THEN** vuelve a estar activa la sesión del padre
- **AND** no se pide de nuevo la contraseña

#### Scenario: Cambiar de un hijo a otro

- **WHEN** estando en el perfil de un hijo se cambia al de otro
- **THEN** se pide el PIN del segundo
- **AND** la sesión del padre sigue disponible detrás de ambos

#### Scenario: Cerrar la sesión del padre se lo lleva todo

- **WHEN** se cierra la sesión del padre
- **THEN** deja de haber acceso a los perfiles de niño de ese dispositivo
- **AND** entrar a cualquiera de ellos vuelve a exigir la contraseña del padre

### Requirement: Un niño no puede asumir el papel de su padre

Una sesión de niño SHALL operar exclusivamente como ese niño. NO SHALL poder ejecutar ninguna
operación reservada al padre, ni recuperar la sesión del padre sin la contraseña, aunque ambas
convivan en el mismo dispositivo.

#### Scenario: Operación de padre desde una sesión de niño

- **WHEN** una sesión de niño intenta una operación reservada al padre
- **THEN** se rechaza por falta de permiso

#### Scenario: El niño no ve a sus hermanos

- **WHEN** una sesión de niño consulta datos
- **THEN** solo obtiene los suyos
- **AND** ninguna respuesta incluye datos de otro hijo de la familia

#### Scenario: El niño no puede recuperar la sesión del padre a voluntad

- **WHEN** desde una sesión de niño se intenta volver al padre manipulando la petición
- **THEN** la operación solo tiene efecto si la sesión de padre suspendida sigue siendo válida
- **AND** en ningún caso concede permisos de padre a la sesión del niño

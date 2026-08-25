## MODIFIED Requirements

### Requirement: El niño entra desde la sesión de su padre

Para entrar a un perfil de niño SHALL existir una sesión de cuenta acreditada en el dispositivo, es
decir, una cuenta a la que alguien vinculó el dispositivo con la contraseña del padre. NO SHALL hacer
falta que el perfil del padre esté activo. El sistema SHALL ofrecer únicamente los perfiles de hijos
de esa cuenta que estén activos.

El requisito decía antes "una sesión de padre activa". Dejó de ser cierto al partir la sesión en
cuenta y perfil: desde entonces, salir del perfil de un niño devuelve a la rejilla y no al padre, y
entrar a otro perfil solo exige la cuenta. Exigir perfil de padre activo describiría un sistema en el
que el padre tendría que teclear su PIN antes de cada relevo.

#### Scenario: El padre entrega el dispositivo

- **WHEN** hay una sesión de cuenta acreditada y se pide cambiar a un perfil de niño
- **THEN** se ofrecen los perfiles de los hijos activos de esa cuenta
- **AND** cada uno se identifica por su nombre y su avatar, sin exponer ningún otro dato

#### Scenario: No hay sesión de cuenta

- **WHEN** se intenta entrar a un perfil de niño sin sesión de cuenta en el dispositivo
- **THEN** la operación se rechaza por falta de sesión

#### Scenario: Se entra a un perfil de niño desde otro perfil de niño

- **WHEN** el perfil activo es el de un niño y se sale a la rejilla para entrar al de otro
- **THEN** basta la sesión de cuenta y el PIN del perfil de destino
- **AND** no se pide la contraseña ni el PIN de adulto

#### Scenario: Un hijo dado de baja no aparece

- **WHEN** el padre dio de baja a un hijo y se listan los perfiles
- **THEN** ese perfil no se ofrece
- **AND** tampoco se puede entrar a él indicando su identificador directamente

#### Scenario: Un perfil de otra familia

- **WHEN** se intenta entrar a un perfil de niño que no pertenece a la cuenta de la sesión
- **THEN** la operación se rechaza
- **AND** la respuesta no permite deducir si ese perfil existe

### Requirement: El padre gestiona el PIN de sus hijos

Un padre SHALL poder establecer el PIN de cualquiera de sus hijos desde su perfil activo, **sin
conocer el anterior**: es la vía de rescate de un niño que lo olvidó. NO SHALL poder hacerlo sobre un
perfil que no sea hijo suyo, y un niño NO SHALL poder cambiar el PIN de un hermano ni el de su padre.

Lo que sí puede un niño es cambiar el suyo sabiendo el actual, y eso lo cubre un requisito aparte.

#### Scenario: El padre restablece el PIN de un hijo

- **WHEN** un padre establece un PIN nuevo para un hijo suyo
- **THEN** el PIN anterior deja de servir
- **AND** el perfil queda desbloqueado si lo estaba

#### Scenario: Un padre sobre un hijo ajeno

- **WHEN** un padre intenta cambiar el PIN de un perfil que no es hijo suyo
- **THEN** la operación se rechaza

#### Scenario: Un niño sobre el PIN de otro perfil

- **WHEN** una sesión de niño intenta establecer el PIN de otro perfil, sea el de un hermano o el de
  adulto
- **THEN** la operación se rechaza por falta de permiso

#### Scenario: Un niño no usa la vía de rescate sobre sí mismo

- **WHEN** una sesión de niño intenta establecer su propio PIN por la vía del padre, que no exige
  conocer el anterior
- **THEN** la operación se rechaza por falta de permiso
- **AND** cambiar el suyo sigue siendo posible únicamente demostrando el actual

## ADDED Requirements

### Requirement: El niño puede cambiar su propio PIN sabiendo el actual

Un niño con su perfil activo SHALL poder cambiar su PIN indicando correctamente el actual. El cambio
SHALL alcanzar únicamente a su propio perfil, determinado por la sesión, sin que ningún identificador
enviado en la petición pueda desviarlo a otro. Un PIN actual equivocado SHALL rechazarse y SHALL
contar para el bloqueo del perfil con el mismo límite que se aplica al entrar.

El límite es lo que impide que quien recibe la tablet con el perfil de otro abierto pruebe
combinaciones hasta poder cambiarle el PIN y dejarlo fuera de su propio perfil.

#### Scenario: El niño cambia su PIN

- **WHEN** un niño indica su PIN actual correcto y uno nuevo
- **THEN** el nuevo queda en vigor y el anterior deja de servir
- **AND** su perfil sigue activo en el dispositivo desde el que lo cambió

#### Scenario: El PIN actual no coincide

- **WHEN** lo intenta indicando mal el actual
- **THEN** el cambio se rechaza y el PIN anterior sigue siendo el válido

#### Scenario: Insistir con el PIN actual equivocado bloquea el perfil

- **WHEN** se falla el PIN actual tantas veces como el límite permite
- **THEN** el perfil queda bloqueado igual que si se hubiera fallado al entrar
- **AND** se rechaza aunque después se indique el PIN correcto

#### Scenario: El cambio no alcanza a ningún hermano

- **WHEN** un niño cambia su PIN
- **THEN** el PIN de cada uno de sus hermanos sigue siendo el mismo

#### Scenario: Un padre no usa la vía del niño

- **WHEN** el perfil activo es el del padre e intenta cambiar un PIN por la vía reservada al niño
- **THEN** la operación se rechaza por falta de permiso

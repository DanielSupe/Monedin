## ADDED Requirements

### Requirement: La rejilla ofrece administrar los perfiles

La rejilla SHALL ofrecer un modo de **administración** que se enciende y se apaga a voluntad. Con el
modo encendido, cada perfil al que se pueda entrar SHALL presentarse como una invitación a
**editarlo** y no a usarlo, y SHALL anunciarse como tal a quien no ve la pantalla.

Sin este modo, editar un perfil exige entrar en él y encontrar la pantalla por dentro. Quien acaba
de crear una cuenta no sabe que existe, y cambiar la foto de un hijo es la primera cosa que una
familia quiere hacer.

El modo SHALL formar parte de la dirección de la pantalla, y no de un estado interno. Esa es la
diferencia entre que el botón atrás salga del modo y que saque de la aplicación.

#### Scenario: Se enciende el modo de administración

- **WHEN** se pide administrar los perfiles desde la rejilla
- **THEN** cada perfil al que se pueda entrar se ofrece para editarlo
- **AND** el nombre con el que se anuncia cada uno dice que lleva a editarlo

#### Scenario: Se apaga el modo de administración

- **WHEN** se termina de administrar
- **THEN** la rejilla vuelve a ofrecer los perfiles para entrar en ellos

#### Scenario: El botón atrás sale del modo, no de la aplicación

- **WHEN** se enciende el modo y a continuación se pide volver atrás
- **THEN** se vuelve a la rejilla sin el modo encendido

#### Scenario: La pantalla se recarga con el modo encendido

- **WHEN** se recarga la pantalla estando en modo de administración
- **THEN** el modo sigue encendido

#### Scenario: Un perfil bloqueado no se ofrece para editar

- **WHEN** hay un perfil bloqueado por intentos fallidos y el modo está encendido
- **THEN** ese perfil no se ofrece para editarlo
- **AND** sigue mostrándose como bloqueado

### Requirement: Administrar un perfil exige su propio PIN y lleva a su edición

Editar un perfil desde el modo de administración SHALL exigir **el PIN de ese mismo perfil**, y no el
de otro. Al acertarlo, el sistema SHALL llevar directamente a la pantalla donde ese perfil se edita,
en lugar de al inicio.

Cada quien edita lo suyo con su propia llave: es la misma regla que ya gobierna el resto del
producto, donde un hijo cambia su avatar y su PIN, y el padre los suyos.

Aterrizar en el inicio después de haber pedido explícitamente editar obligaría a buscar otra vez la
pantalla que se pidió, que es justo lo que este modo existe para evitar.

#### Scenario: Se administra el perfil del padre

- **WHEN** se elige editar el perfil del padre y se teclea su PIN correcto
- **THEN** el perfil del padre queda activo
- **AND** se aterriza en la pantalla donde el padre edita lo suyo

#### Scenario: Se administra el perfil de un hijo

- **WHEN** se elige editar el perfil de un hijo y se teclea el PIN de ese hijo
- **THEN** ese perfil queda activo
- **AND** se aterriza en la pantalla donde ese hijo edita lo suyo

#### Scenario: Entrar sin administrar sigue llevando al inicio

- **WHEN** se entra a un perfil desde la rejilla sin el modo de administración
- **THEN** se aterriza en el inicio de ese perfil, como siempre

#### Scenario: El PIN falla estando en modo de administración

- **WHEN** se teclea un PIN equivocado al administrar un perfil
- **THEN** no queda ningún perfil activo
- **AND** se sigue ofreciendo teclear el PIN para editar ese mismo perfil

#### Scenario: Con un perfil ya activo no se administra otro

- **WHEN** se pide la rejilla teniendo ya un perfil activo
- **THEN** no se ofrece administrar ningún perfil
- **AND** en ningún caso se llega a la pantalla de edición de un perfil sin haber tecleado el PIN de
  **ese** perfil

### Requirement: El teclado de PIN permite corregir sin gastar un intento

El teclado de PIN SHALL permitir borrar el último dígito tecleado antes de completar el PIN.

Sin borrado, quien se equivoca en un dígito intermedio está obligado a completar un PIN que sabe
equivocado y **gastar un intento**. Los intentos fallidos bloquean el perfil, así que un error de
dedo se paga con una cuenta atrás. Para un niño, eso se lee como que la aplicación le echó.

#### Scenario: Se corrige un dígito antes de completar el PIN

- **WHEN** se han tecleado dos dígitos y se pide borrar
- **THEN** queda un solo dígito tecleado
- **AND** no se ha consumido ningún intento

#### Scenario: Se pide borrar sin nada tecleado

- **WHEN** se pide borrar con el PIN vacío
- **THEN** no ocurre nada y el PIN sigue vacío

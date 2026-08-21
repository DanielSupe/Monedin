## MODIFIED Requirements

### Requirement: La sesión del padre se suspende, no se cierra

Al salir de un perfil, la sesión de **cuenta** SHALL conservarse en el dispositivo, de modo que
elegir otro perfil NO SHALL exigir la contraseña. Lo que SÍ SHALL exigirse es el PIN del perfil al
que se entra, el del padre incluido.

Antes, salir del perfil de un niño devolvía directamente la sesión del padre. Ahora devuelve a la
rejilla: en un dispositivo que la familia comparte, volver del perfil de un hijo y encontrarse siendo
el padre sin haber tecleado nada es exactamente cómo un niño acaba aprobándose sus propias tareas.

Lo que no cambia: la contraseña se teclea al vincular el dispositivo y no vuelve a pedirse mientras
la sesión de cuenta viva. Es lo que hace tolerable el paso extra.

#### Scenario: Volver del perfil de un niño

- **WHEN** se sale del perfil de un niño
- **THEN** se vuelve a la rejilla de perfiles
- **AND** no se pide la contraseña

#### Scenario: Volver a ser el padre exige su PIN

- **WHEN** desde la rejilla se elige el perfil del padre
- **THEN** se pide su PIN de adulto
- **AND** con el PIN correcto queda activo su perfil

#### Scenario: Cambiar de un hijo a otro

- **WHEN** estando en el perfil de un hijo se cambia al de otro
- **THEN** se pide el PIN del segundo
- **AND** la sesión de cuenta sigue siendo la misma detrás de ambos

#### Scenario: Cerrar la sesión de cuenta se lo lleva todo

- **WHEN** se cierra la sesión de la cuenta
- **THEN** deja de haber acceso a los perfiles de ese dispositivo
- **AND** entrar a cualquiera de ellos vuelve a exigir la contraseña

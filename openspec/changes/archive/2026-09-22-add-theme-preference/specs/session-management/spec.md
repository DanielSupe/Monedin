# session-management

## ADDED Requirements

### Requirement: El perfil recuerda qué tema prefiere

Cada perfil SHALL tener una preferencia de tema propia, guardada **en su propia fila** y no en el
navegador. El padre la tiene en su cuenta y cada hijo en su perfil.

La preferencia SHALL admitir tres valores: seguir al sistema, claro, y oscuro. **Seguir al sistema
SHALL ser el valor por defecto**, que es el comportamiento que el producto ya tenía: así el cambio no
altera lo que ve nadie que no lo toque.

NO SHALL guardarse en el navegador. Es el argumento por el que esto no se hizo antes: la tablet es
compartida, y una preferencia del dispositivo haría que un hijo heredase el tema de su padre —o se lo
cambiase sin querer—. Guardándola en el perfil, el mismo niño ve su tema en la tablet y en el móvil
de su madre, y su hermano no ve el de él.

#### Scenario: Un perfil recién creado

- **WHEN** se crea un perfil y nadie ha elegido tema
- **THEN** su preferencia es seguir al sistema

#### Scenario: Dos perfiles de la misma familia con temas distintos

- **WHEN** un perfil elige el tema oscuro y otro de la misma familia el claro
- **THEN** cada uno ve el suyo, en cualquier dispositivo, sin afectar al otro

### Requirement: El estado de la sesión dice qué tema prefiere el perfil

Cuando haya un perfil activo, el estado de la sesión SHALL indicar su preferencia de tema.

Viaja **con el actor** y no por un camino aparte, por lo mismo que el recorrido de bienvenida y el
avatar del padre: el cliente lo necesita para decidir qué pintar nada más cargar, y un segundo camino
trae su propia caché que puede separarse de la del actor.

#### Scenario: Con perfil activo

- **WHEN** el cliente consulta el estado con un perfil activo
- **THEN** la respuesta incluye su preferencia de tema

#### Scenario: Sin perfil activo no hay nada que decir

- **WHEN** el cliente consulta el estado sin perfil activo
- **THEN** la respuesta no dice nada del tema

### Requirement: Un perfil puede cambiar su tema

El sistema SHALL ofrecer una operación para cambiar la preferencia de tema del perfil activo.

SHALL exigir actor: hay que saber a QUIÉN se le guarda, así que no basta con la cuenta acreditada.

SHALL ser UNA sola operación para los dos roles, con la rama por rol resuelta en la capa de negocio.
Tener una por rol invita a proteger una y olvidarse de la otra, que es el argumento que ya sostiene la
operación del recorrido de bienvenida.

Un valor fuera de los tres admitidos SHALL rechazarse con error de validación, y no guardarse
silenciosamente como el valor por defecto.

#### Scenario: Un niño elige el tema oscuro

- **WHEN** un perfil de hijo cambia su preferencia a oscuro
- **THEN** se guarda en su perfil y el estado de la sesión lo refleja

#### Scenario: Un padre vuelve a seguir al sistema

- **WHEN** un perfil de padre cambia su preferencia a seguir al sistema
- **THEN** se guarda en su cuenta y el estado de la sesión lo refleja

#### Scenario: Sin perfil activo

- **WHEN** se intenta cambiar el tema con la cuenta acreditada pero sin perfil elegido
- **THEN** la operación se rechaza por falta de actor

#### Scenario: Un valor que no existe

- **WHEN** se intenta guardar una preferencia que no es ninguna de las tres
- **THEN** la operación se rechaza con error de validación

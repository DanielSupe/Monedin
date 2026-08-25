## MODIFIED Requirements

### Requirement: Elegir perfil es obligatorio antes de operar

Una sesión de cuenta SHALL acreditar únicamente que el dispositivo pertenece a esa cuenta. NO SHALL
conceder por sí sola la capacidad de operar sobre los datos de la familia: mientras no haya un perfil
activo, toda ruta que exija actor SHALL rechazar la petición.

Las excepciones SHALL declararse una a una y SHALL limitarse a los pasos previos a ser alguien:
listar los perfiles, entrar a uno, salir a la rejilla, restablecer el PIN de adulto con la contraseña
y crear un perfil de hijo. Ninguna ruta de solo cuenta SHALL leer ni modificar monedas, tareas,
premios ni canjes, y ninguna SHALL admitir que la ejecute un perfil de niño activo.

Es lo que hace que el PIN de adulto sea una frontera y no un adorno de la interfaz: sin esto, un niño
podría saltarse la rejilla llamando directamente al endpoint y aprobarse sus propias tareas. Que la
lista sea corta y cerrada es la mitad de la garantía; la otra mitad es que solo cuenta no significa
sin autorización, y cada una de esas rutas sigue decidiendo quién puede ejecutarla.

#### Scenario: Hay cuenta pero no se ha elegido perfil

- **WHEN** llega una petición a una ruta protegida con sesión de cuenta y sin perfil activo
- **THEN** la respuesta es 401
- **AND** no se ejecuta nada de la lógica de negocio

#### Scenario: No se puede saltar la rejilla llamando al endpoint

- **WHEN** se llama con solo la sesión de cuenta a una operación que exige actor —listar los hijos,
  ver el detalle de uno, editarlo o darlo de baja—
- **THEN** se rechaza igual que si no hubiera sesión

#### Scenario: Con perfil activo se opera con normalidad

- **WHEN** hay un perfil activo y se llama a una ruta que ese perfil puede usar
- **THEN** la petición se atiende

#### Scenario: Listar los perfiles no exige perfil activo

- **WHEN** se piden los perfiles con sesión de cuenta y sin perfil elegido
- **THEN** la petición se atiende, porque es justo el paso para elegirlo

#### Scenario: Crear un perfil tampoco exige perfil activo

- **WHEN** se crea un perfil de hijo con sesión de cuenta y sin perfil elegido
- **THEN** la petición se atiende, porque es otro de los pasos previos a ser alguien

#### Scenario: La lista de rutas de solo cuenta es cerrada y verificable

- **WHEN** se registra una ruta nueva que se conforma con la sesión de cuenta
- **THEN** la verificación del proyecto falla hasta que esa ruta se declara a conciencia
- **AND** ninguna de las declaradas lee ni modifica monedas, tareas, premios ni canjes

### Requirement: La rejilla ofrece crear un perfil nuevo

La rejilla SHALL incluir, junto a los perfiles, la forma de crear uno nuevo, disponible únicamente
cuando el perfil activo es el del padre o cuando aún no se ha elegido ninguno. Crear NO SHALL exigir
el PIN de adulto, y el sistema SHALL rechazar la creación cuando la familia haya alcanzado su tope de
perfiles activos.

#### Scenario: El padre ve la opción de crear

- **WHEN** se muestra la rejilla a quien tiene la sesión de cuenta
- **THEN** aparece la opción de crear un perfil nuevo

#### Scenario: Crear un perfil no exige el PIN de adulto

- **WHEN** desde la rejilla, sin haber elegido perfil, se crea un perfil de hijo
- **THEN** queda creado y aparece en la rejilla de inmediato
- **AND** no se ha pedido el PIN de adulto en ningún momento

#### Scenario: Un niño no puede crear perfiles

- **WHEN** el perfil activo es el de un niño
- **THEN** no se le ofrece crear perfiles
- **AND** intentarlo por la vía directa se rechaza por falta de permiso

#### Scenario: Una familia sin hijos todavía

- **WHEN** la cuenta no tiene ningún hijo
- **THEN** la rejilla muestra el perfil del padre y la opción de crear
- **AND** no aparece vacía ni bloqueada

#### Scenario: La familia ha alcanzado su tope de perfiles

- **WHEN** se intenta crear un perfil y la cuenta ya tiene el máximo de hijos activos
- **THEN** la operación se rechaza señalando el conflicto
- **AND** dar de baja a un hijo libera un hueco

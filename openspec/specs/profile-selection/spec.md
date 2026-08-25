# profile-selection Specification

## Purpose

Define la pantalla con la que empieza cualquier uso de Monedín —elegir quién eres entre los perfiles
de la familia— y qué significa esa elección para el resto del sistema, de modo que en un dispositivo
compartido nadie opere sin querer como otra persona y ningún niño pueda actuar como su padre.

## Requirements

### Requirement: La rejilla ofrece todos los perfiles de la familia

Con una sesión de cuenta válida, el sistema SHALL ofrecer los perfiles de esa familia: el del padre
y el de cada hijo activo. Cada uno SHALL identificarse por su nombre y su avatar, y NO SHALL exponer
ningún otro dato antes de entrar.

#### Scenario: Se abre la aplicación en el dispositivo familiar

- **WHEN** hay una sesión de cuenta válida y se piden los perfiles
- **THEN** se obtienen el del padre y los de sus hijos activos
- **AND** de cada uno solo su nombre y su avatar

#### Scenario: Ni el saldo ni la edad se ven antes de entrar

- **WHEN** se listan los perfiles
- **THEN** ninguno incluye saldo, edad ni ningún dato personal más allá del nombre y el avatar

#### Scenario: Un hijo dado de baja no está en la rejilla

- **WHEN** un hijo está dado de baja
- **THEN** su perfil no se ofrece
- **AND** tampoco se puede entrar a él indicando su identificador

#### Scenario: Sin sesión de cuenta no hay rejilla

- **WHEN** se piden los perfiles sin una sesión de cuenta válida
- **THEN** la petición se rechaza por falta de sesión

#### Scenario: Los perfiles son los de esa familia y de ninguna otra

- **WHEN** se listan los perfiles con la sesión de una cuenta
- **THEN** no aparece ningún perfil de otra familia

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

### Requirement: Entrar a un perfil exige su PIN

Activar cualquier perfil, el del padre incluido, SHALL requerir el PIN de ese perfil. El sistema NO
SHALL conceder un perfil activo sin comprobarlo.

#### Scenario: Se entra al perfil de un hijo

- **WHEN** se elige el perfil de un hijo y se teclea su PIN correcto
- **THEN** ese perfil queda activo

#### Scenario: Se entra al perfil del padre

- **WHEN** se elige el perfil del padre y se teclea su PIN de adulto correcto
- **THEN** el perfil del padre queda activo
- **AND** no se ha vuelto a pedir la contraseña

#### Scenario: PIN incorrecto

- **WHEN** se teclea un PIN equivocado, sea de un hijo o del padre
- **THEN** no queda ningún perfil activo
- **AND** la sesión de cuenta sigue intacta

#### Scenario: Un perfil bloqueado no se puede activar

- **WHEN** se intenta entrar a un perfil bloqueado por intentos fallidos
- **THEN** se rechaza por bloqueo, aunque el PIN sea correcto

### Requirement: Se puede volver a la rejilla y cambiar de perfil

Desde cualquier perfil activo SHALL poder volverse a la rejilla. Volver SHALL desactivar el perfil y
SHALL conservar la sesión de cuenta, de modo que elegir otro no exija la contraseña.

#### Scenario: Volver a la rejilla desde el perfil de un hijo

- **WHEN** se sale del perfil de un hijo
- **THEN** deja de haber perfil activo
- **AND** se ofrecen de nuevo los perfiles, sin pedir la contraseña

#### Scenario: Volver a la rejilla desde el perfil del padre

- **WHEN** se sale del perfil del padre
- **THEN** deja de haber perfil activo
- **AND** volver a entrar exige su PIN de adulto

#### Scenario: Cambiar directamente de un perfil a otro

- **WHEN** estando en un perfil se entra a otro con su PIN
- **THEN** el segundo queda activo y el primero deja de estarlo
- **AND** no quedan dos perfiles activos a la vez

#### Scenario: Cerrar la sesión de cuenta se lo lleva todo

- **WHEN** se cierra la sesión de la cuenta
- **THEN** deja de haber perfil activo y de haber sesión
- **AND** volver a usar la aplicación exige la contraseña

### Requirement: Los avatares salen de un catálogo cerrado

El avatar de un perfil SHALL ser una referencia a un catálogo de ilustraciones que acompaña a la
aplicación, compartido por API y front. El sistema NO SHALL aceptar una referencia que no esté en el
catálogo, y SHALL asignar una por defecto a un perfil que no la tenga.

#### Scenario: Se guarda un avatar del catálogo

- **WHEN** se asigna a un perfil un avatar del catálogo
- **THEN** queda guardado y la rejilla lo muestra

#### Scenario: Se intenta guardar un avatar que no existe

- **WHEN** se asigna una referencia de avatar que no está en el catálogo
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Un perfil sin avatar

- **WHEN** un perfil no tiene avatar asignado
- **THEN** la rejilla lo muestra igualmente, con uno por defecto
- **AND** el perfil sigue siendo distinguible por su nombre

#### Scenario: El catálogo es el mismo en las dos apps

- **WHEN** se añade o se retira una ilustración del catálogo
- **THEN** el cambio se refleja a la vez en la validación de la API y en lo que pinta el front
- **AND** no hay una segunda lista que mantener

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

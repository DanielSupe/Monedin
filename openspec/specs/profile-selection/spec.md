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

El avatar de un perfil SHALL ser **una de dos cosas**: una referencia al catálogo de ilustraciones que
acompaña a la aplicación, compartido por API y front, o una imagen propia que el dueño del perfil ha
subido. El sistema NO SHALL aceptar una referencia de catálogo que no esté en el catálogo, NO SHALL
aceptar una imagen propia que no sea de ese perfil, y SHALL asignar una del catálogo por defecto a un
perfil que no tenga ninguna de las dos.

Las dos formas conviven a propósito: elegir un animal es inmediato y no necesita cámara ni conexión,
y sigue siendo una respuesta completa a «¿quién eres?». Subir una foto es la otra forma del mismo
campo, no su sustituto, y por eso ningún perfil existente necesita migrarse.

#### Scenario: Se guarda un avatar del catálogo

- **WHEN** se asigna a un perfil un avatar del catálogo
- **THEN** queda guardado y la rejilla lo muestra

#### Scenario: Se guarda una imagen propia

- **WHEN** el dueño de un perfil sube una imagen propia y la confirma
- **THEN** queda guardada como su avatar
- **AND** la rejilla la muestra en lugar de la ilustración del catálogo

#### Scenario: Se intenta guardar un avatar que no existe

- **WHEN** se asigna una referencia de avatar que no está en el catálogo
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Se intenta elegir catálogo y foto a la vez

- **WHEN** se intenta guardar en la misma operación una referencia de catálogo y una imagen propia
- **THEN** la operación se rechaza como entrada inválida
- **AND** el avatar del perfil no cambia

#### Scenario: Un perfil sin avatar

- **WHEN** un perfil no tiene avatar asignado
- **THEN** la rejilla lo muestra igualmente, con uno por defecto
- **AND** el perfil sigue siendo distinguible por su nombre

#### Scenario: El catálogo es el mismo en las dos apps

- **WHEN** se añade o se retira una ilustración del catálogo
- **THEN** el cambio se refleja a la vez en la validación de la API y en lo que pinta el front
- **AND** no hay una segunda lista que mantener

#### Scenario: Un perfil que ya tenía avatar de catálogo sigue igual

- **WHEN** existen perfiles con un avatar del catálogo desde antes de poder subir imágenes
- **THEN** siguen mostrándose exactamente igual
- **AND** no hace falta convertirlos ni volver a elegir

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

### Requirement: El padre ve su propio avatar también dentro de su sesión

El avatar del padre SHALL viajar con su perfil activo, y no solo con la rejilla previa. Un padre que
eligió su avatar SHALL poder verlo mientras usa la aplicación, igual que ya ocurre con el de un hijo.

Hoy el padre elige su avatar, entra a su perfil y deja de verlo: la rejilla lo conoce y su sesión no.
Es el mismo dato en los dos sitios y debe comportarse igual en los dos.

#### Scenario: El padre entra a su perfil

- **WHEN** un padre entra a su propio perfil
- **THEN** la información de su perfil activo incluye su avatar, resuelto y listo para mostrarse

#### Scenario: El padre consulta su sesión

- **WHEN** se consulta el estado de la sesión con el perfil del padre activo
- **THEN** el actor devuelto incluye su avatar

#### Scenario: El padre sube su propia foto

- **WHEN** un padre sube una imagen propia y la confirma como su avatar
- **THEN** queda guardada
- **AND** se ve tanto en la rejilla como dentro de su sesión

#### Scenario: Un niño no cambia el avatar del padre

- **WHEN** un perfil de niño intenta cambiar el avatar del padre
- **THEN** la operación se rechaza por falta de permiso

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


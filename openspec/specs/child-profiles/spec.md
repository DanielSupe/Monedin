# child-profiles Specification

## Purpose

Define el ciclo de vida de un perfil de hijo como entidad de producto —cómo nace, quién lo ve, quién
puede cambiarlo y cómo se retira— de modo que el hijo, que es aquello de lo que cuelgan el saldo, las
tareas y los canjes, exista sin que ningún dato de una familia se cruce con el de otra ni un hermano
vea lo que no es suyo.

## Requirements

### Requirement: Un hijo se crea desde la rejilla, sin haber elegido perfil

El sistema SHALL permitir crear un perfil de hijo teniendo únicamente una sesión de cuenta
acreditada, sin exigir que se haya entrado a ningún perfil y por tanto sin pedir el PIN de adulto. El
padre dueño del perfil SHALL deducirse siempre de la sesión y NUNCA de la petición.

Es lo que hace que una familia recién registrada pueda empezar: el padre acaba de teclear su
contraseña y pedirle otra credencial para añadir a su primer hijo convierte la rejilla en un trámite.

#### Scenario: Se crea el primer hijo de la familia

- **WHEN** con sesión de cuenta y sin perfil activo se crea un hijo con su nombre y su PIN
- **THEN** el perfil queda creado y aparece de inmediato en la rejilla
- **AND** no se ha pedido el PIN de adulto en ningún momento

#### Scenario: El hijo nace sin monedas

- **WHEN** se crea un perfil de hijo
- **THEN** su saldo es cero
- **AND** la petición no puede fijar el saldo inicial: intentarlo se rechaza como entrada inválida

#### Scenario: El PIN elegido sirve para entrar

- **WHEN** se crea un hijo con un PIN y acto seguido se entra a su perfil con ese PIN
- **THEN** el perfil queda activo

#### Scenario: El perfil nace dentro de la familia de la sesión

- **WHEN** se crea un hijo indicando en la petición un padre distinto del de la sesión
- **THEN** la petición se rechaza como entrada inválida
- **AND** en ningún caso queda un hijo colgando de otra familia

#### Scenario: Sin sesión de cuenta no se crea nada

- **WHEN** se intenta crear un hijo sin una sesión de cuenta válida
- **THEN** la operación se rechaza por falta de sesión

#### Scenario: Un hijo creado con perfil de padre activo

- **WHEN** el perfil activo es el del padre y se crea un hijo
- **THEN** el perfil queda creado igualmente

### Requirement: Un perfil de niño activo no puede crear perfiles

Cuando el perfil activo es el de un niño, el sistema NO SHALL crear perfiles, aunque la sesión de
cuenta sea válida. Que la cookie de cuenta alcance para esta operación no significa que valga
cualquiera que la traiga.

#### Scenario: Un niño intenta crear un hermano

- **WHEN** el perfil activo es el de un niño y se intenta crear un perfil
- **THEN** la operación se rechaza por falta de permiso
- **AND** no queda ningún perfil creado

### Requirement: Una familia tiene un tope de hijos activos

El sistema SHALL rechazar la creación de un hijo cuando la familia ya tenga el máximo de hijos
activos. Los hijos dados de baja NO SHALL contar para ese tope.

El tope es lo que acota que el alta no pida PIN de adulto: quien no ha entrado al perfil del padre no
puede dar de baja a nadie, así que tampoco puede liberar huecos y volver a llenarlos.

#### Scenario: Se alcanza el tope

- **WHEN** la familia ya tiene el máximo de hijos activos y se intenta crear otro
- **THEN** la operación se rechaza señalando el conflicto
- **AND** el mensaje permite entender que el límite es el número de perfiles, no otra cosa

#### Scenario: Dar de baja libera un hueco

- **WHEN** una familia en el tope da de baja a un hijo y crea otro
- **THEN** el perfil nuevo queda creado

#### Scenario: El tope es por familia

- **WHEN** una familia alcanza su tope
- **THEN** otra familia puede seguir creando hijos con normalidad

### Requirement: El padre ve a sus hijos en un listado paginado

El sistema SHALL ofrecer al padre el listado de sus hijos activos, con el nombre, el avatar, la edad
y el saldo de cada uno. El listado SHALL paginarse, SHALL informar del total sin paginar, y SHALL
tener un orden estable que no dependa de coincidencias de tiempo.

Aquí el saldo SÍ se muestra, a diferencia de la rejilla: la rejilla es una pantalla previa a
identificarse, y esta es la de gestión de un padre ya acreditado.

#### Scenario: El padre lista a sus hijos

- **WHEN** un padre pide el listado de sus hijos
- **THEN** obtiene sus hijos activos con nombre, avatar, edad y saldo
- **AND** el total refleja cuántos hay en total, no cuántos caben en la página

#### Scenario: El listado usa un tamaño de página por defecto

- **WHEN** se pide el listado sin indicar paginación
- **THEN** se aplican la página y el tamaño por defecto del contrato compartido

#### Scenario: Un tamaño de página excesivo se rechaza

- **WHEN** se pide un tamaño de página mayor que el máximo permitido
- **THEN** la petición se rechaza como entrada inválida señalando ese campo
- **AND** NO se recorta en silencio, porque un recorte escondería el error de quien llama

#### Scenario: Paginación con valores sin sentido

- **WHEN** se pide una página cero, negativa, no numérica o con decimales
- **THEN** la petición se rechaza como entrada inválida

#### Scenario: Una página más allá del final

- **WHEN** se pide una página posterior a la última
- **THEN** la respuesta es un listado vacío y no un error

#### Scenario: El orden es estable aunque coincidan los tiempos

- **WHEN** varios hijos se crearon en el mismo instante y se recorren todas las páginas
- **THEN** cada hijo aparece exactamente una vez
- **AND** ninguno se queda fuera ni se repite entre páginas

#### Scenario: El listado no cruza familias ni incluye bajas

- **WHEN** un padre lista a sus hijos
- **THEN** no aparece ningún hijo de otra familia ni ninguno dado de baja
- **AND** tampoco cuentan para el total

#### Scenario: Un niño no puede listar hijos

- **WHEN** el perfil activo es el de un niño y se pide el listado de hijos
- **THEN** la operación se rechaza por falta de permiso

### Requirement: El padre consulta y edita a un hijo suyo

Un padre SHALL poder consultar y modificar el nombre, la edad y el avatar de cualquier hijo suyo. NO
SHALL poder modificar su saldo, que solo se mueve con tareas y canjes. Sobre un hijo que no es suyo,
o que está dado de baja, el sistema SHALL responder como si no existiera.

Responder "no existe" y no "no puedes" es deliberado: un 403 sobre un identificador ajeno confirmaría
que ese perfil existe.

#### Scenario: El padre consulta a un hijo suyo

- **WHEN** un padre pide el detalle de un hijo suyo
- **THEN** obtiene su nombre, avatar, edad y saldo

#### Scenario: El padre edita a un hijo suyo

- **WHEN** un padre cambia el nombre, la edad o el avatar de un hijo suyo
- **THEN** el cambio queda guardado
- **AND** los campos que no envió conservan su valor anterior

#### Scenario: El saldo no se edita

- **WHEN** un padre intenta fijar el saldo de un hijo al editarlo
- **THEN** la operación se rechaza como entrada inválida
- **AND** el saldo sigue siendo el que era

#### Scenario: Un hijo de otra familia

- **WHEN** un padre pide o edita el detalle de un hijo que no es suyo
- **THEN** la respuesta es la misma que para un identificador inexistente
- **AND** no permite deducir si ese perfil existe

#### Scenario: Datos fuera de los límites del producto

- **WHEN** se crea o edita un hijo con un nombre demasiado corto o largo, una edad fuera del rango
  del producto, un PIN que no son dígitos, o un avatar que no está en el catálogo
- **THEN** la operación se rechaza como entrada inválida
- **AND** se señalan TODOS los campos que fallan, no solo el primero

#### Scenario: Una edición vacía

- **WHEN** se pide editar un hijo sin indicar ningún campo
- **THEN** la operación se rechaza como entrada inválida

### Requirement: La baja de un hijo es lógica y definitiva

Un padre SHALL poder dar de baja a un hijo suyo. La baja SHALL retirarlo de la rejilla y de los
listados, SHALL cerrar las sesiones abiertas de ese perfil, y SHALL conservar íntegro su historial de
monedas. NO SHALL existir forma de reactivarlo ni de destruir sus datos.

#### Scenario: El padre da de baja a un hijo

- **WHEN** un padre da de baja a un hijo suyo
- **THEN** ese hijo deja de aparecer en la rejilla y en el listado
- **AND** su historial de monedas sigue existiendo

#### Scenario: La baja echa al niño del dispositivo

- **WHEN** se da de baja a un hijo que tenía su perfil activo en algún dispositivo
- **THEN** esa sesión de perfil deja de valer

#### Scenario: Dar de baja dos veces a la vez

- **WHEN** llegan dos bajas simultáneas sobre el mismo hijo
- **THEN** una tiene efecto y la otra responde que ese hijo ya no existe
- **AND** la fecha de baja registrada es la de la primera, sin pisarse

#### Scenario: Un hijo ya dado de baja

- **WHEN** se intenta consultar, editar o dar de baja a un hijo ya dado de baja
- **THEN** la respuesta es la misma que para un identificador inexistente

#### Scenario: Un padre no da de baja a un hijo ajeno

- **WHEN** un padre intenta dar de baja a un hijo de otra familia
- **THEN** la respuesta es la misma que para un identificador inexistente
- **AND** ese hijo sigue activo

#### Scenario: Un niño no puede dar de baja a nadie

- **WHEN** el perfil activo es el de un niño e intenta dar de baja un perfil
- **THEN** la operación se rechaza por falta de permiso

### Requirement: El niño ve su propio perfil con su saldo

Un niño con su perfil activo SHALL poder consultar su nombre, su avatar, su edad y su saldo. El
perfil consultado SHALL ser siempre el suyo, determinado por la sesión, sin que ningún identificador
enviado en la petición pueda desviarlo a otro.

Que el perfil salga de la sesión y no de la petición es lo que hace que "un niño no ve a sus
hermanos" sea cierto por construcción y no por una comprobación que alguien pueda olvidar.

#### Scenario: El niño consulta lo suyo

- **WHEN** un niño con su perfil activo consulta su perfil
- **THEN** obtiene su nombre, avatar, edad y saldo

#### Scenario: El niño no ve a su hermano

- **WHEN** un niño pide el perfil de un hermano indicando su identificador
- **THEN** la operación se rechaza por falta de permiso
- **AND** se rechaza igual que si el identificador no existiera, sin distinguir los dos casos

#### Scenario: Un padre no usa la vista del niño

- **WHEN** el perfil activo es el del padre y pide la vista de perfil propio de niño
- **THEN** la operación se rechaza por falta de permiso

#### Scenario: Un niño dado de baja mientras estaba dentro

- **WHEN** se da de baja a un niño que tenía su perfil activo y este consulta su perfil
- **THEN** la operación se rechaza por falta de sesión

### Requirement: El niño elige su avatar y nada más de su perfil

Un niño con su perfil activo SHALL poder cambiar su avatar, **eligiendo otro del catálogo o subiendo
una imagen propia**. NO SHALL poder cambiar su nombre, su edad ni su saldo: eso lo lleva su padre.

Es un gesto de autonomía deliberadamente pequeño. Elegir su animal —o su foto— es suyo; lo que le
identifica ante su familia, no.

#### Scenario: El niño cambia su avatar

- **WHEN** un niño elige otro avatar del catálogo
- **THEN** queda guardado y se refleja en la rejilla y en su propio perfil

#### Scenario: El niño sube su propia foto

- **WHEN** un niño sube una imagen propia y la confirma como su avatar
- **THEN** queda guardada y se refleja en la rejilla y en su propio perfil
- **AND** su nombre, su edad y su saldo siguen siendo los que eran

#### Scenario: Un avatar fuera del catálogo

- **WHEN** un niño intenta guardar una referencia de avatar que no está en el catálogo
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: El niño confirma la foto de un hermano

- **WHEN** un niño intenta confirmar como suya una imagen que pertenece al perfil de un hermano
- **THEN** la operación se rechaza como entrada inválida
- **AND** su avatar sigue siendo el que era

#### Scenario: El niño no cambia su nombre ni su edad

- **WHEN** un niño intenta cambiar su nombre, su edad o su saldo
- **THEN** la operación se rechaza como entrada inválida
- **AND** esos datos siguen siendo los que eran

### Requirement: Las respuestas no filtran datos internos

Ninguna respuesta sobre un perfil de hijo SHALL incluir su PIN ni derivación alguna de él, el
identificador de su padre, su fecha de baja, ni los contadores de intentos fallidos.

#### Scenario: Se inspecciona cualquier respuesta de perfil

- **WHEN** se examina la respuesta de crear, listar, consultar o editar un hijo
- **THEN** no contiene el PIN ni su derivación
- **AND** tampoco el identificador del padre, la fecha de baja ni los intentos fallidos

### Requirement: El padre puede cambiar el avatar de un hijo suyo, y solo suyo

Un padre SHALL poder cambiar el avatar de un hijo suyo, tanto eligiendo del catálogo como subiendo una
imagen. Un hijo ajeno, inexistente o dado de baja SHALL responder como inexistente, sin confirmar que
existe.

#### Scenario: El padre sube la foto de un hijo suyo

- **WHEN** un padre sube una imagen y la confirma como avatar de un hijo suyo
- **THEN** queda guardada y se refleja en la rejilla y en el listado de sus hijos

#### Scenario: El padre intenta subir sobre un hijo ajeno

- **WHEN** un padre pide subir el avatar de un hijo que no es suyo
- **THEN** la respuesta es la misma que para un hijo inexistente
- **AND** no se entrega ninguna URL de subida

#### Scenario: El padre confirma la foto de un hijo sobre otro

- **WHEN** un padre confirma sobre un hijo suyo una imagen que pertenece al perfil de otro hijo suyo
- **THEN** la operación se rechaza como entrada inválida
- **AND** ninguno de los dos avatares cambia

### Requirement: El avatar se lee siempre resuelto

Toda respuesta que incluya el avatar de un perfil SHALL entregarlo listo para pintarse: o una
referencia del catálogo, o una URL con la que mostrar la imagen propia. El sistema NO SHALL entregar
la clave interna con la que la imagen está guardada.

#### Scenario: Un perfil con avatar del catálogo

- **WHEN** se consulta un perfil cuyo avatar es del catálogo
- **THEN** la respuesta trae la referencia del catálogo, como siempre

#### Scenario: Un perfil con imagen propia

- **WHEN** se consulta un perfil cuyo avatar es una imagen propia
- **THEN** la respuesta trae una URL con la que se puede mostrar directamente
- **AND** no trae la clave interna del almacén

#### Scenario: Un listado con perfiles de los dos tipos

- **WHEN** se pide un listado con perfiles de catálogo y perfiles con foto propia
- **THEN** cada uno viene resuelto en su forma, en la misma respuesta

# parent-authentication Specification

## Purpose

Define cómo un padre crea su cuenta en Monedín y cómo demuestra ser quien dice ser, de modo que la
credencial que abre el acceso a los datos de sus hijos no se pueda adivinar, no se guarde nunca en
claro, y no revele a un desconocido qué correos están registrados.
## Requirements
### Requirement: Registro público de un padre

El sistema SHALL permitir que cualquier persona cree una cuenta de padre indicando nombre, correo y
contraseña. NO SHALL existir ninguna vía pública de registro para un niño.

#### Scenario: Registro con datos válidos

- **WHEN** alguien se registra con un nombre, un correo no usado y una contraseña que cumple la política
- **THEN** queda creada su cuenta de padre
- **AND** queda con la sesión iniciada, sin tener que acceder acto seguido

#### Scenario: El correo ya está registrado

- **WHEN** alguien intenta registrarse con un correo que ya existe
- **THEN** el registro se rechaza
- **AND** la comprobación la garantiza el almacén, de modo que dos registros simultáneos del mismo
  correo no crean dos cuentas

#### Scenario: La contraseña no cumple la política

- **WHEN** alguien se registra con una contraseña más corta que el mínimo exigido
- **THEN** el registro se rechaza indicando el campo que falla
- **AND** no queda ninguna cuenta a medio crear

#### Scenario: No hay registro de niños

- **WHEN** se recorren los puntos de entrada públicos del sistema
- **THEN** ninguno permite crear un perfil de niño
- **AND** crear uno exige una sesión de cuenta ya acreditada, es decir, un dispositivo previamente
  vinculado a una familia con la contraseña de su padre
- **AND** el perfil creado queda siempre dentro de esa cuenta, porque el padre dueño sale de la
  sesión y nunca del cuerpo de la petición

### Requirement: Acceso con correo y contraseña

El sistema SHALL permitir a un padre iniciar sesión con su correo y su contraseña. Ante credenciales
incorrectas SHALL responder de la misma forma tanto si el correo no existe como si la contraseña no
coincide, para no revelar qué correos están registrados.

#### Scenario: Credenciales correctas

- **WHEN** un padre accede con su correo y su contraseña
- **THEN** obtiene una sesión activa
- **AND** la respuesta incluye sus datos básicos, nunca su credencial

#### Scenario: La contraseña no coincide

- **WHEN** un padre accede con su correo y una contraseña equivocada
- **THEN** el acceso se rechaza sin indicar cuál de los dos datos falla

#### Scenario: El correo no está registrado

- **WHEN** alguien accede con un correo que no existe
- **THEN** la respuesta es indistinguible de la de una contraseña equivocada
- **AND** el tiempo que tarda tampoco permite distinguir los dos casos

### Requirement: Las credenciales nunca se guardan ni se transmiten en claro

El sistema SHALL almacenar únicamente una derivación irreversible y con sal de la contraseña. NO
SHALL guardarla en claro, ni reversiblemente cifrada, ni escribirla en logs, ni devolverla en ninguna
respuesta, ni siquiera a su propio dueño.

#### Scenario: Se inspecciona la cuenta almacenada

- **WHEN** se consulta directamente el registro de un padre en el almacén
- **THEN** no aparece la contraseña
- **AND** lo que hay almacenado no permite recuperarla

#### Scenario: Dos cuentas con la misma contraseña

- **WHEN** dos padres eligen exactamente la misma contraseña
- **THEN** lo almacenado para cada uno es distinto

#### Scenario: La credencial no aparece en la salida del sistema

- **WHEN** se registra un acceso, correcto o fallido, en el log
- **THEN** la entrada de log no contiene la contraseña ni su derivación

#### Scenario: La respuesta del propio perfil

- **WHEN** un padre consulta sus propios datos
- **THEN** la respuesta no incluye ningún campo de credencial

### Requirement: Bloqueo tras intentos fallidos repetidos

Tras un número consecutivo de accesos fallidos sobre la misma cuenta, el sistema SHALL rechazar los
intentos siguientes durante un periodo, aunque la contraseña sea correcta. Un acceso correcto antes
de alcanzar el límite SHALL poner el contador a cero.

#### Scenario: Se supera el límite de intentos

- **WHEN** se falla la contraseña de una cuenta tantas veces como el límite permite
- **THEN** el intento siguiente se rechaza por bloqueo, no por credencial incorrecta
- **AND** se rechaza aunque la contraseña sea la correcta

#### Scenario: El bloqueo caduca

- **WHEN** transcurre el periodo de bloqueo
- **THEN** la cuenta vuelve a admitir intentos

#### Scenario: Un acceso correcto limpia el contador

- **WHEN** un padre falla algunos intentos por debajo del límite y después acierta
- **THEN** obtiene su sesión
- **AND** el contador de fallos vuelve a cero

#### Scenario: El bloqueo no delata cuentas existentes

- **WHEN** se falla repetidamente contra un correo que no está registrado
- **THEN** la respuesta no permite deducir si la cuenta existe

### Requirement: Cambio de contraseña

Un padre con sesión SHALL poder cambiar su contraseña indicando la actual. Al cambiarla, el sistema
SHALL invalidar las demás sesiones abiertas de esa cuenta y SHALL conservar la que hizo el cambio.

#### Scenario: Cambio con la contraseña actual correcta

- **WHEN** un padre cambia su contraseña indicando correctamente la actual
- **THEN** la nueva queda en vigor
- **AND** la sesión desde la que hizo el cambio sigue activa

#### Scenario: Las demás sesiones dejan de valer

- **WHEN** un padre cambia su contraseña teniendo sesión abierta en otro dispositivo
- **THEN** la sesión del otro dispositivo deja de ser válida

#### Scenario: La contraseña actual no coincide

- **WHEN** un padre intenta cambiarla indicando mal la actual
- **THEN** el cambio se rechaza
- **AND** la contraseña anterior sigue siendo la válida

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
cerrar su sesión de cuenta ni desactivar ningún perfil activo, ni el suyo en este dispositivo ni el
de ningún otro. Lo único que cambia es cuál es el PIN que sirve la próxima vez que haya que teclearlo.

El requisito prometía antes desactivar los perfiles activos en otros dispositivos. Nunca se
implementó, y al escribir el cambio de PIN del niño hubo que fijar la regla para ambos. Se elige
describir lo que el sistema hace: un PIN abre un perfil, y un perfil ya abierto en otro dispositivo
sigue siendo el mismo perfil de la misma persona. Quien quiera echar a alguien de otro dispositivo
tiene la vía que sí existe y sí revoca, que es cerrar la sesión de cuenta.

#### Scenario: Cambio con el PIN actual correcto

- **WHEN** un padre cambia su PIN indicando correctamente el actual
- **THEN** el nuevo queda en vigor y el anterior deja de servir
- **AND** su perfil sigue activo en el dispositivo desde el que lo cambió

#### Scenario: Un perfil abierto en otro dispositivo sigue abierto

- **WHEN** un padre cambia su PIN teniendo su perfil activo en otro dispositivo
- **THEN** ese otro perfil sigue activo
- **AND** volver a entrar allí, una vez salga, exigirá el PIN nuevo

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

### Requirement: El formulario dice lo que exige antes de rechazarlo

Los requisitos de una credencial SHALL mostrarse **antes** de intentar enviarla, junto al campo que
los pide.

Hoy la longitud mínima de la contraseña solo se descubre fallando, y de uno en uno, porque el
formulario muestra un único problema. Quien elige una contraseña corta se entera después de
escribirla entera.

#### Scenario: Se abre el formulario de crear cuenta

- **WHEN** se muestra el formulario por primera vez, sin haber escrito nada
- **THEN** junto al campo de la contraseña se indica su longitud mínima

### Requirement: Se explica por qué hacen falta dos credenciales

El formulario de crear cuenta SHALL explicar **para qué sirve cada una** de las dos credenciales que
pide: la contraseña y el PIN.

Sin esa explicación, pedir dos claves distintas en la misma pantalla parece un error del producto.
Son cosas distintas: la contraseña vincula un dispositivo nuevo y se usa muy de vez en cuando; el PIN
se teclea cada vez que alguien entra a su perfil.

#### Scenario: Se muestra el formulario de crear cuenta

- **WHEN** se pide la contraseña y el PIN en la misma pantalla
- **THEN** se dice para qué se usa cada uno

### Requirement: La cuenta del padre es un destino vestido, no dos pantallas apiladas

`/account` SHALL presentar la foto y el PIN del padre como **un** destino con dos partes, usando las
piezas del sistema de diseño. NO SHALL usar estilos en línea, colores literales ni repetir un enlace
de vuelta por cada parte que contenga.

Hoy son dos componentes montados uno debajo del otro, cada uno con su propio «Volver» y su propio
`color: "#b00020"` para los errores. Tres enlaces de vuelta en una pantalla no son tres salidas: son
la señal de que nadie miró la pantalla entera.

#### Scenario: Se abre la cuenta

- **WHEN** el padre abre `/account`
- **THEN** ve su foto y el cambio de PIN como partes de una misma pantalla
- **AND** ningún módulo de esa pantalla figura en la lista de deuda de estilos

#### Scenario: Falla el cambio de PIN

- **WHEN** el cambio de PIN devuelve un error
- **THEN** el error se anuncia con la pieza de aviso del sistema
- **AND** su color sale de un token, no de un literal

### Requirement: Cerrar sesión vive en la cuenta, no en el inicio

Cerrar sesión SHALL ofrecerse desde la cuenta del padre. NO SHALL ofrecerse en su inicio junto a los
atajos de uso diario.

Cerrar sesión y cambiar de perfil se parecen y no lo son: cambiar de perfil devuelve a la rejilla
—varias veces al día, y sin credenciales para volver—, y cerrar sesión obliga a teclear correo y
contraseña otra vez. Ponerlas del mismo tamaño y una al lado de la otra es cómo un padre acaba
tecleando su contraseña porque quería pasarle la tablet a su hijo.

Cambiar de perfil SHALL seguir en el inicio, que es donde está su gemela en el inicio del niño.

#### Scenario: El inicio del padre

- **WHEN** el padre mira su inicio
- **THEN** puede cambiar de perfil
- **AND** no puede cerrar sesión desde ahí

#### Scenario: La cuenta del padre

- **WHEN** el padre abre su cuenta
- **THEN** puede cerrar sesión


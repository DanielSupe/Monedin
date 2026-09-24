# app-navigation Specification

## Purpose
Define qué destinos existen en la aplicación, quién puede llegar a cada uno y qué ocurre cuando
alguien abre una dirección que no le corresponde; qué marco rodea a cada rol; y qué garantiza que el
botón atrás, la recarga y un enlace compartido se comporten como en cualquier aplicación y no como en
un andamio.
## Requirements
### Requirement: Todo destino tiene su propia dirección

Cada pantalla a la que una persona puede llegar SHALL tener una dirección propia. El estado local de
un componente NO SHALL usarse para decidir qué pantalla se muestra.

Esto vale para las dos audiencias por igual. Que las pantallas de un rol tengan dirección y las del
otro no es la asimetría que este requisito elimina.

#### Scenario: El niño recorre sus destinos

- **WHEN** un niño abre cada una de sus pantallas
- **THEN** la dirección del navegador cambia en cada una
- **AND** cada dirección identifica una sola pantalla

#### Scenario: Un componente decide qué pantalla mostrar con estado local

- **WHEN** un componente de pantalla guarda en su estado cuál de varias vistas mostrar
- **THEN** se considera un defecto, y la verificación del proyecto lo señala

#### Scenario: Un formulario que se abre desde una lista

- **WHEN** se abre el formulario de alta desde una lista
- **THEN** tiene dirección propia, distinta de la de la lista

### Requirement: El botón atrás y la recarga se comportan como en cualquier aplicación

Volver atrás SHALL devolver a la pantalla anterior dentro de la aplicación mientras exista una.
Recargar SHALL mantener a la persona en la pantalla en la que estaba.

Es el requisito que más se nota en el dispositivo real: en una tablet, el gesto de volver es el que
más se usa, y una aplicación que se cierra al usarlo se percibe rota.

#### Scenario: Volver desde un destino del niño

- **WHEN** un niño entra a una de sus pantallas y pulsa volver
- **THEN** regresa a la pantalla anterior
- **AND** NO sale de la aplicación

#### Scenario: Recargar en una pantalla cualquiera

- **WHEN** se recarga estando en un destino
- **THEN** se vuelve a mostrar ese mismo destino
- **AND** no se vuelve al inicio

#### Scenario: Abrir un enlace guardado

- **WHEN** alguien con la sesión adecuada abre directamente la dirección de un destino
- **THEN** llega a ese destino

### Requirement: Cada rol recibe su propio marco, y el marco declara la escala

La aplicación SHALL envolver el contenido en un marco de navegación que **persista** entre destinos y
que se elija por el rol de quien está operando. Ese marco SHALL declarar la escala de la audiencia,
que es lo que hace que las mismas piezas rindan distinto para un niño y para un padre.

El marco SHALL construirse únicamente con piezas del sistema de diseño.

#### Scenario: Un niño con su perfil activo

- **WHEN** un niño está dentro de la aplicación
- **THEN** ve el marco de navegación del niño
- **AND** el contenedor declara la escala del niño

#### Scenario: Un padre con su perfil activo

- **WHEN** un padre está dentro de la aplicación
- **THEN** ve el marco de navegación del padre
- **AND** el contenedor declara la escala del padre

#### Scenario: El marco sobrevive a la navegación

- **WHEN** se navega de un destino a otro dentro del mismo rol
- **THEN** el marco no se desmonta ni se vuelve a construir

#### Scenario: Objetivo de toque de la navegación del niño

- **WHEN** se rinde la navegación bajo la escala del niño
- **THEN** cada destino tiene un área tocable de al menos 44 píxeles en su lado menor

### Requirement: El acceso a un destino se decide antes de pintarlo

La comprobación de si alguien puede estar en un destino SHALL ocurrir **antes** de mostrarlo, y su
resultado SHALL ser una redirección a la dirección que sí corresponde, no una pantalla distinta bajo
la dirección equivocada.

Esta guarda NO es la de verdad: la de verdad sigue en el servidor, que responde 401 o 403 a quien no
debe. Esta solo evita enseñar una interfaz que no va a funcionar, y evita dejar a alguien parado en
una dirección que no es suya.

Cuando no hay sesión de ningún tipo, el destino SHALL ser la **puerta pública**, no la pantalla de
acceso. Es una sola regla para todos los destinos, sin excepciones por ruta: quien llega sin sesión
puede no conocer el producto, y un formulario no se lo explica. Desde la puerta pública se llega a la
pantalla de acceso, que sigue existiendo y siendo alcanzable.

#### Scenario: Sin sesión

- **WHEN** alguien sin sesión abre cualquier destino de la aplicación
- **THEN** acaba en la puerta pública
- **AND** desde ahí puede llegar a la pantalla de acceso

#### Scenario: Con cuenta acreditada y sin perfil elegido

- **WHEN** alguien con la cuenta acreditada pero sin perfil activo abre un destino que exige actor
- **THEN** acaba en la rejilla de selección de perfil
- **AND** no se muestra el contenido del destino

#### Scenario: Un niño abre un destino del padre

- **WHEN** un niño abre la dirección de una pantalla de gestión del padre
- **THEN** acaba en su propio inicio
- **AND** no se le acusa de nada: no aparece ningún mensaje de error

#### Scenario: Un padre abre un destino del niño

- **WHEN** un padre abre la dirección de una pantalla del niño
- **THEN** acaba en su propio inicio

#### Scenario: Una dirección que no existe

- **WHEN** se abre una dirección que no corresponde a ningún destino
- **THEN** se muestra una pantalla que lo dice
- **AND** ofrece una salida hacia un destino válido

#### Scenario: La pantalla de acceso sigue siendo alcanzable

- **WHEN** alguien sin sesión pide la pantalla de acceso desde la puerta pública
- **THEN** la ve
- **AND** no se le devuelve a la puerta pública

### Requirement: El filtro y la página de un listado viajan en la dirección

En un listado con filtros o paginación, el filtro aplicado y la página SHALL formar parte de la
dirección. Volver atrás desde una pantalla abierta desde ese listado SHALL devolver el listado **con
su filtro y su página**, no reiniciado.

Un padre que filtra por «esperando mi aprobación», entra a resolver una y vuelve, no debería tener
que volver a filtrar.

#### Scenario: Volver a un listado filtrado

- **WHEN** se filtra un listado, se abre otra pantalla desde él y se vuelve atrás
- **THEN** el listado conserva el filtro y la página que tenía

#### Scenario: Compartir un listado filtrado

- **WHEN** se abre directamente la dirección de un listado con un filtro
- **THEN** el listado aparece ya filtrado

#### Scenario: Un filtro inválido en la dirección

- **WHEN** la dirección trae un filtro o una página que no son válidos
- **THEN** el listado se muestra con los valores por defecto
- **AND** no se rompe ni se queda en blanco

### Requirement: La navegación no se cablea a mano entre componentes

Una pantalla NO SHALL recibir una función cuyo cometido sea cerrarla o devolver a quien la abrió,
**se llame como se llame**. Navegar es trabajo del router.

Un evento de DOMINIO sí es legítimo: `onSaved` dice «esto ocurrió», y quien lo escucha decide a dónde
ir — el mismo formulario se usa desde dos sitios que navegan a destinos distintos. Lo que no vale es
`onDone`, `onCancel`, `onClose`, `onBack` o cualquier otro que signifique «ciérrame»: eso empuja la
navegación a quien llama y ata la pantalla a su punto de uso.

La regla SHALL comprobarse por la FORMA y no por una lista de nombres. `add-app-shell` la dejó atada
a `onDone`, y `onCancel` —que es lo mismo con otra palabra— pasó por delante del test en cinco
archivos sin que saltara. Una convención que se comprueba por su nombre está a un sinónimo de morirse.

#### Scenario: Un componente recibe una función de vuelta

- **WHEN** un componente de pantalla declara una propiedad para que quien lo usa le diga cómo volver
- **THEN** se considera un defecto, y la verificación del proyecto lo señala

#### Scenario: Llegar a la misma pantalla desde dos sitios

- **WHEN** se llega a un mismo destino desde dos pantallas distintas
- **THEN** funciona igual en ambos casos, sin que el destino sepa desde dónde se llegó

#### Scenario: Una pantalla que se abre desde dos sitios distintos

- **WHEN** un formulario se usa desde dos destinos que van a sitios distintos al terminar
- **THEN** avisa de que guardó
- **AND** no recibe ninguna función para cerrarse

#### Scenario: Aparece un sinónimo

- **WHEN** una pantalla recibe una función que significa «ciérrame», con el nombre que sea
- **THEN** falla un test

#### Scenario: Cancelar

- **WHEN** alguien abandona un formulario sin guardar
- **THEN** navega a un destino, como cualquier otra navegación

### Requirement: Las pantallas previas a tener un rol también reciben marco

Las pantallas por las que se pasa **antes de que exista un actor** —el acceso, la rejilla, el teclado
de PIN, el alta de un perfil y el restablecimiento del PIN— SHALL recibir un marco propio, y NO
SHALL quedarse sin marca.

El marco SHALL mostrar la marca del producto en la parte superior izquierda y SHALL centrar su
contenido **horizontal y verticalmente** en el espacio disponible.

Sin esto, se entra por una página con marca, se pasa por cuatro pantallas anónimas y la marca vuelve
al final. Quien está en un paso intermedio no tiene nada que le diga dónde está, y el contenido queda
pegado al borde superior con la pantalla vacía debajo.

Qué pantallas son SHALL deducirse del estado —no hay actor y la ruta no pide el ancho completo— y NO
SHALL escribirse como una lista de direcciones. Una lista se desincroniza en cuanto alguien renombra
o añade una ruta, y nada lo detecta.

#### Scenario: Se está eligiendo perfil

- **WHEN** se muestra cualquiera de las pantallas previas a tener un rol
- **THEN** la marca del producto se ve en la parte superior izquierda
- **AND** el contenido queda centrado en la pantalla

#### Scenario: Se avanza de un paso al siguiente

- **WHEN** se pasa de la rejilla al teclado de PIN
- **THEN** la marca sigue en el mismo sitio
- **AND** no cambia el encuadre del contenido

#### Scenario: Ya hay un perfil activo

- **WHEN** hay un actor
- **THEN** se ve el marco de su rol y no el de entrada

#### Scenario: La puerta pública trae el suyo

- **WHEN** se muestra una pantalla que pide el ancho completo
- **THEN** se rinde sin el marco de entrada
- **AND** no se muestran dos marcas a la vez

#### Scenario: Se añade una pantalla previa al rol

- **WHEN** se añade un destino nuevo que se alcanza sin actor
- **THEN** recibe el marco de entrada sin declararlo en ninguna lista

### Requirement: La rejilla se toca con el dedo de un niño

Los perfiles de la rejilla SHALL presentarse con un área tocable holgada, pensada para el dedo de un
niño de seis años y no para el cursor de un adulto.

La medida SHALL salir del sistema de diseño y NO SHALL escribirse en la pantalla que la usa: si una
pieza compartida no tiene la talla que hace falta, se le añade la talla.

#### Scenario: Se elige perfil en una tablet

- **WHEN** se muestra la rejilla
- **THEN** cada perfil ofrece un área tocable claramente mayor que el mínimo del sistema

#### Scenario: La talla no se improvisa

- **WHEN** una pantalla necesita un avatar de un tamaño que la pieza no ofrece
- **THEN** la talla se añade a la pieza
- **AND** no se escribe una medida suelta en la pantalla

### Requirement: Entrar y registrarse son dos destinos, no dos estados

Acceder con una cuenta existente y crear una cuenta nueva SHALL ser **dos destinos con su propia
dirección**. NO SHALL decidirse cuál se muestra con estado interno de un componente.

Son la misma clase de cosa que el resto del producto ya resolvió así: recargar tiene que volver al
mismo sitio, el botón atrás tiene que volver al anterior y no salir de la aplicación, y un enlace
tiene que poder llevar a uno de los dos en concreto.

Cada uno SHALL ofrecer el otro mediante un enlace.

#### Scenario: Se recarga estando en el registro

- **WHEN** se recarga la página estando en el formulario de crear cuenta
- **THEN** se sigue viendo el formulario de crear cuenta

#### Scenario: Se vuelve atrás desde el registro

- **WHEN** se llega al registro desde la puerta pública y se pide volver atrás
- **THEN** se vuelve a la puerta pública
- **AND** no se sale de la aplicación

#### Scenario: Se ofrece el otro camino

- **WHEN** se muestra cualquiera de los dos formularios
- **THEN** se ofrece llegar al otro
- **AND** ese ofrecimiento es un enlace a su dirección

### Requirement: Cada llamada a la acción lleva a lo que anuncia

En la puerta pública, la acción de empezar SHALL llevar al formulario de **crear cuenta**, y la de
entrar al de **acceder**.

Llevar a quien viene a registrarse hasta un formulario de acceso le pide una credencial que todavía
no tiene, y la salida solo se encuentra si se lee un enlace al pie.

#### Scenario: Alguien que no tiene cuenta

- **WHEN** se pulsa la acción de empezar en la puerta pública
- **THEN** se llega al formulario de crear cuenta

#### Scenario: Alguien que ya tiene cuenta

- **WHEN** se pulsa la acción de entrar en la puerta pública
- **THEN** se llega al formulario de acceder

### Requirement: Un archivo de ruta monta el destino, no lo dibuja

Un archivo de ruta SHALL declarar su guarda, sus parámetros y qué componente monta. NO SHALL contener
la pantalla, ni decidir con un condicional cuál de varias enseñar.

Es la misma regla que ya gobierna `features/`, aplicada un nivel más arriba. Una pantalla dentro de
un archivo de ruta no se puede probar sin router, no se puede reutilizar desde otro destino, y crece
hasta que nadie recuerda que ese archivo era una ruta.

Elegir por rol SHALL seguir siendo legítimo —el destino es el mismo y quien lo abre no—, pero lo
elegido SHALL vivir fuera.

#### Scenario: Un destino que sirve a dos roles

- **WHEN** una dirección muestra una pantalla distinta según quién opere
- **THEN** el archivo de ruta elige entre componentes
- **AND** ninguno de esos componentes está definido en él

#### Scenario: Se abre el inicio con cada rol

- **WHEN** entra un niño a su inicio
- **THEN** ve su pantalla
- **WHEN** entra un padre al suyo
- **THEN** ve la suya, y ninguno ve la del otro

### Requirement: Dentro de un perfil hay UNA sola navegación

Con un perfil activo, todos los destinos **de trabajo** del rol SHALL ofrecerse desde un mismo sitio.
El marco NO SHALL ofrecer uno de esos destinos desde dos sitios distintos, **con una única excepción
declarada: el perfil de quien está operando**.

Antes, cada rol tenía su propia barra y, además, un destino que no estaba en ella y colgaba del
avatar de la cabecera. Eran dos maneras de moverse y ninguna completa.

El perfil es la excepción porque su avatar en la cabecera **no es solo un destino**: responde a quién
está usando el dispositivo, que es una pregunta real en una tablet que comparte toda la familia y que
la lista de destinos no responde. Sigue estando además en la lista, porque un destino que solo se
alcanza pulsando una foto sin texto no se encuentra.

La excepción es **una** y va nombrada aquí. Cualquier otro destino de trabajo ofrecido dos veces es
un defecto.

**Un destino de AYUDA no es un destino de trabajo, y no entra en esa lista.** La lista enumera dónde
vive el trabajo del rol —sus tareas, sus premios, sus canjes, sus hijos—; la ayuda no es un sitio
donde se hace nada, es **meta**: responde «¿cómo funciona esto?» en vez de «¿qué tengo que hacer
hoy?». Meterla entre los destinos de trabajo la pondría del mismo tamaño que ellos y sugeriría que
hay que pasar por ahí.

Por eso la ayuda SHALL vivir en el armazón del marco —donde ya vive el avatar, por la razón
simétrica— y NO SHALL aparecer además en la lista de destinos: eso sería ofrecer un destino dos
veces, y la excepción declarada sigue siendo una sola.

#### Scenario: Se enumeran los destinos del marco

- **WHEN** se recorre el marco de un rol
- **THEN** cada destino de trabajo aparece exactamente una vez, salvo el perfil

#### Scenario: Un destino que antes colgaba del avatar

- **WHEN** el padre busca su cuenta, o el niño su perfil
- **THEN** lo encuentra en la misma lista que el resto de sus destinos

#### Scenario: El perfil, desde los dos sitios

- **WHEN** se mira el marco con un perfil activo
- **THEN** el avatar de la cabecera lleva al perfil
- **AND** el perfil sigue estando en la lista de destinos

#### Scenario: La ayuda no está entre los destinos de trabajo

- **WHEN** se abre la lista de destinos de cualquiera de los dos roles
- **THEN** la ayuda no aparece en ella
- **AND** sí se alcanza desde el armazón del marco

### Requirement: La navegación se abre desde un control con nombre y se cierra sola al llegar

La navegación SHALL abrirse desde un control anunciado con su nombre, y SHALL cerrarse cuando cambie
la dirección.

Cerrar al **cambiar de dirección** y no al pulsar un enlace no es un matiz: el botón atrás también
cambia la dirección, y un panel que sigue abierto tapando la pantalla a la que se acaba de volver es
peor que no tenerlo.

#### Scenario: Se elige un destino

- **WHEN** se abre la navegación y se pulsa uno de sus destinos
- **THEN** se llega al destino
- **AND** la navegación queda cerrada

#### Scenario: Se vuelve atrás con la navegación abierta

- **WHEN** la navegación está abierta y se usa el botón atrás
- **THEN** la navegación queda cerrada

### Requirement: El estado de apertura de la navegación no viaja en la dirección

Que la navegación esté abierta NO SHALL representarse en la dirección.

Es el caso contrario al del modo «administrar» de la rejilla, y por la razón contraria: aquel tenía
que **sobrevivir** a una navegación —cruza hasta el teclado de PIN—, y este tiene que **morir** con
ella. Guardarlo en la dirección haría que recargar abriera un panel que nadie pidió, y que el botón
atrás cerrara el panel en vez de volver.

#### Scenario: Se recarga con la navegación abierta

- **WHEN** se abre la navegación y se recarga la página
- **THEN** la navegación aparece cerrada

### Requirement: El destino vigente se anuncia como tal

Dentro de la navegación, el destino que corresponde a la dirección actual SHALL anunciarse como la
página actual.

Un destino que solo se distingue por el color no existe para quien no distingue esos colores, ni para
quien usa un lector de pantalla.

#### Scenario: Se abre la navegación desde un destino

- **WHEN** se abre la navegación estando en uno de sus destinos
- **THEN** ese destino se anuncia como el actual
- **AND** los demás no

### Requirement: Las pantallas previas a tener un rol no reciben navegación

`EntryShell` NO SHALL ofrecer la navegación de destinos.

Antes de entrar a un perfil no hay rol, así que no se sabe de quién serían los destinos; y las
pantallas de ese camino —acceso, rejilla, teclado de PIN— existen para llevar a un sitio, no para
ofrecer alternativas.

#### Scenario: Se abre la rejilla de perfiles

- **WHEN** se llega a la rejilla sin perfil activo
- **THEN** no hay control de navegación en el marco

### Requirement: Cuando hay ancho, la navegación está delante

En pantalla ancha la navegación SHALL estar visible como parte del marco, sin que haya que abrirla.
NO SHALL quedar detrás de un control en un tamaño en el que cabe.

Esconder la navegación cuesta un toque cada vez, y en escritorio y en tablet no compra nada: hay
ancho de sobra. En pantalla estrecha sí compra la pantalla entera, y ahí sigue detrás de su botón.

Cuando la navegación esté delante, SHALL poder contraerse a solo sus iconos, y el control que lo hace
SHALL decir lo que hace.

#### Scenario: Se abre la aplicación en una pantalla ancha

- **WHEN** hay un perfil activo y la pantalla es ancha
- **THEN** los destinos se ven sin abrir nada
- **AND** no hay control de menú

#### Scenario: Se contrae

- **WHEN** se pulsa el control de contraer
- **THEN** los destinos siguen alcanzables, con sus iconos
- **AND** cada uno conserva su nombre para quien no ve el icono

#### Scenario: Se abre en una pantalla estrecha

- **WHEN** hay un perfil activo y la pantalla es estrecha
- **THEN** la navegación está detrás del control de menú

### Requirement: Solo una forma de la navegación existe a la vez

El marco SHALL montar **una** de las dos formas de la navegación. NO SHALL montar las dos y ocultar
una con estilos.

Dos listas de destinos en el documento son dos para quien lo recorre con teclado o con un lector de
pantalla, aunque una no se vea. Ocultar con estilos es además lo que un test no puede distinguir, así
que la regla se sostendría sola sobre la buena voluntad.

#### Scenario: Se cuenta la navegación del documento

- **WHEN** hay un perfil activo, sea cual sea el ancho
- **THEN** existe exactamente una lista de destinos en el documento

### Requirement: La navegación que está delante sigue delante después de desplazar

Cuando la navegación esté delante como columna del marco, SHALL permanecer visible **entera** al
desplazar el contenido, incluido su pie —el perfil y el control de contraer—.

La columna NO SHALL crecer con el largo de la página. Hoy lo hace: el marco no acota su altura, así
que se estira hasta el final del documento y su pie se va con el desplazamiento. Una navegación que
desaparece al leer un listado largo no está delante; está delante **al principio**, que es otra cosa.

Lo que SHALL desplazarse en ese caso es el contenido, y no el documento entero.

Si los destinos no cupieran en la altura de la pantalla, SHALL desplazarse **dentro de la propia
columna**, sin que el pie deje de verse.

En pantalla estrecha NO SHALL cambiar nada: allí la navegación se abre y se cierra sobre el
contenido, y atar la altura de la pantalla pelea con la barra del navegador de un móvil, que aparece
y desaparece al desplazar.

#### Scenario: Se desplaza una pantalla larga

- **WHEN** hay un perfil activo, la pantalla es ancha y se desplaza un listado largo
- **THEN** la navegación sigue visible con todos sus destinos
- **AND** su pie sigue visible

#### Scenario: El pie está al final de la pantalla, no al final de la página

- **WHEN** se abre una pantalla más larga que la ventana
- **THEN** el pie de la navegación se ve sin desplazar

#### Scenario: Muchos destinos

- **WHEN** los destinos no caben en la altura de la ventana
- **THEN** se desplazan dentro de la columna
- **AND** el pie sigue visible

#### Scenario: En pantalla estrecha se desplaza como siempre

- **WHEN** la pantalla es estrecha
- **THEN** la navegación sigue detrás de su control
- **AND** el documento se desplaza como hasta ahora

### Requirement: Hay destinos que son de los dos roles

Un destino SHALL poder exigir solo que haya alguien operando, sin exigir un rol concreto. Los dos
roles SHALL llegar a él sin ser redirigidos, y sin que existan dos pantallas cuya única diferencia
sea la audiencia: la escala la impone el marco, como en todo lo demás.

Sin perfil elegido SHALL seguir sin alcanzarse, igual que cualquier otro destino de la aplicación:
que un destino sea de los dos roles no lo hace público.

#### Scenario: Los dos roles llegan

- **WHEN** un padre abre un destino compartido
- **THEN** lo ve sin redirección
- **AND** lo mismo ocurre para un niño

#### Scenario: Sigue exigiendo un perfil

- **WHEN** se abre un destino compartido con la cuenta acreditada y sin perfil elegido
- **THEN** se aterriza en la rejilla de perfiles

#### Scenario: Una pantalla, dos audiencias

- **WHEN** el mismo destino se abre desde los dos roles
- **THEN** es la misma pantalla
- **AND** la diferencia de tamaños y radios la impone el marco del rol

### Requirement: El marco no muestra el saldo

El marco de navegación NO SHALL mostrar el saldo de un niño de forma permanente. El saldo SHALL vivir
en el inicio —donde ya es el elemento más grande— y en su historial.

Tenerlo delante en todas las pantallas convierte la navegación en un tablero de puntuación. El inicio
es el sitio donde el niño mira su saldo a propósito; en las otras pantallas está haciendo otra cosa, y
un número que le sigue a todas partes le dice que lo que importa es la cifra y no lo que está
haciendo.

Donde el saldo decide algo, la pantalla ya lo dice mejor que una cifra suelta: en el escaparate cada
premio anuncia lo que le falta, que es la forma útil del mismo dato.

#### Scenario: El niño recorre sus pantallas

- **WHEN** un niño navega entre sus destinos
- **THEN** su saldo no aparece en el marco en ninguno de ellos

#### Scenario: El niño quiere ver su saldo

- **WHEN** un niño quiere saber cuánto tiene
- **THEN** lo ve en su inicio como el elemento más grande de la pantalla
- **AND** desde ahí puede abrir de dónde salió cada moneda

### Requirement: El tema del perfil se aplica al documento entero

Cuando haya un perfil activo, el marco SHALL aplicar su preferencia de tema **a la raíz del
documento**, no al contenedor del marco.

Tiene que ser la raíz porque el tema tiene que alcanzar lo que se pinta FUERA del marco: los diálogos
y el velo del recorrido de bienvenida salen por un portal, al final del documento, y con el atributo
puesto más abajo se quedarían con el tema contrario.

Cuando la preferencia sea seguir al sistema, el marco NO SHALL escribir ningún tema explícito: es la
ausencia del atributo lo que deja mandar a la preferencia del dispositivo.

Ninguna pieza del sistema de diseño SHALL recibir ni consultar el tema. Lo que cambia es el valor de
los tokens, y esa es la razón por la que esto se resuelve en el marco y no en treinta componentes.

#### Scenario: Un perfil que eligió el tema oscuro

- **WHEN** entra un perfil cuya preferencia es oscuro
- **THEN** la interfaz se pinta en oscuro, incluidos los diálogos que salen por un portal

#### Scenario: Un perfil que sigue al sistema

- **WHEN** entra un perfil cuya preferencia es seguir al sistema
- **THEN** la interfaz sigue a la preferencia del dispositivo, sin tema explícito escrito

#### Scenario: Se cambia de perfil

- **WHEN** se sale de un perfil en oscuro y se entra a otro que prefiere claro
- **THEN** la interfaz pasa al claro sin recargar la página

### Requirement: La cabecera ofrece cambiar de tema

Los dos marcos con perfil activo SHALL ofrecer un control de tema en su cabecera, a la derecha.

SHALL recorrer los tres estados con un solo control, y no ofrecer tres. La cabecera es donde el sitio
es caro y son tres estados que un icono distingue.

SHALL anunciar el estado ACTUAL y no el siguiente: lo que alguien necesita al llegar al control es
saber dónde está, no a dónde iría. El nombre SHALL cambiar con el estado, porque lo que el control
hace cambia — es la misma regla que el control de contraer el lateral.

Las pantallas previas a elegir perfil NO SHALL ofrecerlo: allí no hay actor, así que no habría dónde
guardar la elección.

#### Scenario: Dentro de un perfil

- **WHEN** se mira la cabecera con un perfil activo
- **THEN** hay un control de tema a la derecha, anunciado con el estado en el que está

#### Scenario: Se recorre el ciclo

- **WHEN** se acciona el control tres veces desde «seguir al sistema»
- **THEN** pasa por claro y oscuro y vuelve a seguir al sistema, guardando cada paso

#### Scenario: Antes de elegir perfil

- **WHEN** se mira el acceso, la rejilla o el teclado de PIN
- **THEN** no hay control de tema

### Requirement: La ayuda es un destino con nombre, no un icono

El acceso a la ayuda SHALL ser un destino de la navegación del perfil, con su nombre a la vista, y NO
SHALL alcanzarse únicamente pulsando un icono sin palabra.

Es el mismo argumento que dejó escrito la navegación de un perfil para los otros cinco destinos: uno
que solo se alcanza pulsando algo sin texto no se encuentra. La ayuda se había quedado fuera.

Y SHALL estar en UN solo sitio del marco. Dejarla además en la cabecera sería un segundo destino
duplicado, y la única excepción declarada a eso es el perfil.

#### Scenario: Alguien busca la ayuda

- **WHEN** recorre la navegación de su perfil
- **THEN** encuentra la ayuda nombrada, como los demás destinos

#### Scenario: Se revisa el marco completo

- **WHEN** se enumeran los destinos que ofrece el marco de un rol
- **THEN** la ayuda aparece una sola vez

### Requirement: Contraída, la navegación cabe en su columna

Con la navegación contraída a solo iconos, nada de lo que dibuja SHALL salirse de la columna ni
desplazar al icono de su centro.

Una cuenta de cosas pendientes NO SHALL dibujar su cifra en esa forma: no cabe, y al ocupar sitio en
la fila empuja al icono contra el borde contrario. SHALL quedar en su lugar una marca que diga que
hay algo esperando, sin decir cuántos.

La cuenta NO SHALL perderse para quien no ve la pantalla: el texto que ya la anunciaba SHALL seguir
entero. Lo que se quita es el dibujo, no el dato.

Un glifo decorativo al final de una fila —el que acompaña al perfil— NO SHALL dibujarse en esa forma:
comparte sitio con el avatar, y contraído solo compite con él.

#### Scenario: Hay tareas esperando y la navegación está contraída

- **WHEN** la pantalla es ancha, hay cosas esperando y se contrae la navegación
- **THEN** la cifra no se ve
- **AND** el destino sigue anunciando cuántas hay para quien no ve la pantalla

#### Scenario: La misma cuenta con la navegación extendida

- **WHEN** la pantalla es ancha, hay cosas esperando y la navegación está extendida
- **THEN** la cifra se ve junto al nombre de su destino

#### Scenario: El pie del perfil con la navegación contraída

- **WHEN** la navegación está contraída
- **THEN** la fila del perfil se queda con su avatar
- **AND** el glifo que la acompañaba no está en el documento

### Requirement: El control de contraer encabeza la navegación

El control que contrae la navegación SHALL ir **antes** que los destinos en el orden del documento, en
una cabecera propia de la columna, y NO SHALL ir al final, debajo del perfil.

Es el control del marco y no un destino más. Al final de la lista queda detrás de todo lo que se usa a
diario, que es el último sitio donde se busca. Arriba es donde se busca y donde lo ponen las
bibliotecas de las que este marco copia su forma.

SHALL seguir existiendo solo cuando la navegación está delante: en pantalla estrecha es un cajón que
se abre encima y no hay nada que contraer.

#### Scenario: Se recorre la navegación con teclado

- **WHEN** la pantalla es ancha y hay un perfil activo
- **THEN** el control de contraer se alcanza antes que el primer destino

#### Scenario: En pantalla estrecha no hay control de contraer

- **WHEN** la pantalla es estrecha
- **THEN** no existe control de contraer

### Requirement: La columna de navegación no pesa lo mismo en todas las pantallas

Cuando la navegación esté delante como columna, su ancho SHALL tener en cuenta el que le queda al
contenido: SHALL ser más estrecha en las ventanas donde el sitio escasea y ensancharse donde sobra.

Una medida fija pesa distinto según lo que tenga alrededor. La columna se monta desde que hay ancho
para ella, y en la ventana más estrecha que la recibe una medida pensada para un monitor grande se
lleva más de la cuarta parte de la pantalla.

NO SHALL estrecharse tanto que el nombre de un destino deje de caber: lo que nombra un destino es su
texto, y un texto partido en dos renglones o recortado deja de nombrarlo.

#### Scenario: La ventana más estrecha que recibe la columna

- **WHEN** la pantalla es ancha por poco
- **THEN** la columna usa su medida estrecha
- **AND** los nombres de los destinos siguen cabiendo en una línea

#### Scenario: Una ventana amplia

- **WHEN** hay ancho de sobra
- **THEN** la columna usa su medida amplia


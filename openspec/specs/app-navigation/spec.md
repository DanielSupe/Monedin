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

Un componente de pantalla NO SHALL recibir de quien lo usa una función para volver o para cerrarse.
Navegar SHALL hacerse contra el sistema de rutas.

Ese cableado a mano es lo que obliga a que cada pantalla conozca a la que la abrió, y es la razón por
la que las mismas pantallas no se pueden alcanzar desde dos sitios distintos.

#### Scenario: Un componente recibe una función de vuelta

- **WHEN** un componente de pantalla declara una propiedad para que quien lo usa le diga cómo volver
- **THEN** se considera un defecto, y la verificación del proyecto lo señala

#### Scenario: Llegar a la misma pantalla desde dos sitios

- **WHEN** se llega a un mismo destino desde dos pantallas distintas
- **THEN** funciona igual en ambos casos, sin que el destino sepa desde dónde se llegó

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


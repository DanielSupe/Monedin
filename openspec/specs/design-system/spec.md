# design-system Specification

## Purpose
Define el vocabulario visual del front: de dónde sale cada color y cada medida, qué piezas de
interfaz existen y en qué estados, cómo una misma pieza sirve a un niño de siete años y a su padre
sin duplicarse, y qué mecanismo impide que una pantalla futura se lo salte y vuelva a inventar el
suyo.
## Requirements
### Requirement: Un único origen para todo valor visual

Todo color, espaciado, radio, sombra, familia y tamaño tipográfico y duración de transición del front
SHALL declararse en un único archivo de tokens. Ningún otro archivo SHALL declarar uno de esos
valores literalmente: el punto de uso referencia el token, nunca lo repite.

Es la misma regla que ya rige los límites de negocio y los textos visibles: si un valor tiene
significado, vive en un solo sitio.

#### Scenario: Un componente declara un color literal

- **WHEN** un archivo distinto del archivo de tokens contiene un color escrito literalmente
- **THEN** la verificación del proyecto falla señalando el archivo y el valor

#### Scenario: Un componente declara una medida en el punto de uso

- **WHEN** un componente declara un espaciado, un radio o un tamaño arbitrario en lugar de usar un
  token
- **THEN** la verificación del proyecto falla señalando el archivo de tokens como el sitio correcto

#### Scenario: Cambiar un token cambia toda la interfaz

- **WHEN** se modifica el valor de un token en el archivo de tokens
- **THEN** todas las piezas que lo referencian cambian, sin editar ninguna de ellas

### Requirement: Los estilos en línea están prohibidos y la excepción se declara

El front NO SHALL usar estilos en línea en un componente. La prohibición SHALL hacerse cumplir por
una herramienta y no por convención. SHALL existir un mecanismo explícito para declarar excepciones,
de modo que cada excepción sea visible en el archivo de configuración que la concede y no una
omisión silenciosa.

#### Scenario: Un componente nuevo usa estilos en línea

- **WHEN** un componente del front declara estilos en línea sin estar en la lista de excepciones
- **THEN** el lint falla con un mensaje que explica dónde vive el estilo

#### Scenario: Una excepción legítima

- **WHEN** un componente necesita un valor calculado en tiempo de ejecución que ningún token puede
  expresar
- **THEN** su ruta puede declararse como excepción, y esa excepción queda escrita y localizable

### Requirement: Una misma pieza sirve a las dos audiencias sin duplicarse

Monedín tiene dos audiencias con necesidades opuestas: un niño de 6 a 11 años necesita cifras
grandes, pocos elementos y objetivos de toque amplios; un padre necesita densidad y escaneo rápido.
El sistema SHALL expresar esa diferencia como una **escala** declarada por el contenedor, y NO SHALL
resolverla duplicando piezas por rol.

#### Scenario: La misma pieza en las dos escalas

- **WHEN** la misma pieza de interfaz se monta bajo la escala del niño y bajo la escala del padre
- **THEN** rinde con tipografía, radios y objetivo de toque distintos
- **AND** es el mismo componente en los dos casos

#### Scenario: Aparece una pieza duplicada por rol

- **WHEN** existen dos piezas equivalentes cuya única diferencia es la audiencia a la que sirven
- **THEN** se considera un defecto del sistema, no una decisión de diseño

#### Scenario: Objetivo de toque en la escala del niño

- **WHEN** un control interactivo se rinde bajo la escala del niño
- **THEN** su área tocable mide al menos 44 píxeles en su lado menor

### Requirement: Cada pieza cubre sus estados, no solo el de reposo

Toda pieza interactiva SHALL definir su aspecto en reposo, con el foco, al pasar el puntero,
deshabilitada y —cuando represente una operación— mientras está en curso. Toda pieza que muestre
datos remotos SHALL tener además un estado de carga y un estado vacío.

Un estado que no está definido es un estado que cada pantalla resolverá a su manera, que es
exactamente lo que este sistema existe para evitar.

#### Scenario: Navegación por teclado

- **WHEN** se recorre la interfaz con el tabulador
- **THEN** la pieza enfocada muestra un indicador de foco visible, en cualquiera de las dos escalas

#### Scenario: Operación en curso

- **WHEN** una pieza que dispara una operación está esperando su respuesta
- **THEN** comunica que está en curso y no admite una segunda activación

#### Scenario: Lista sin elementos

- **WHEN** una lista se rinde sin elementos
- **THEN** existe una pieza de estado vacío que la pantalla usa, en lugar de no rendir nada

### Requirement: El sistema distingue los tonos de un aviso

El sistema SHALL ofrecer una pieza de aviso con tonos diferenciados como mínimo para información,
éxito, advertencia y error, y SHALL permitir que un conflicto —dos personas actuando sobre lo mismo,
que la API resuelve con un 409— se comunique con un tono propio y un texto explicativo.

La API ya distingue sus errores con un código estable; la interfaz SHALL poder reflejar esa distinción
en lugar de aplanarla en un texto rojo único.

#### Scenario: Un error de validación y un conflicto

- **WHEN** una pantalla recibe un error de validación y otra recibe un conflicto
- **THEN** cada una dispone de un tono distinto con el que comunicarlo

#### Scenario: Un aviso es anunciado

- **WHEN** aparece un aviso de error como resultado de una acción del usuario
- **THEN** queda expuesto a las tecnologías de asistencia sin que la pantalla tenga que recordarlo

### Requirement: Las piezas del sistema no conocen el dominio

Una pieza del sistema de diseño NO SHALL depender de los clientes de la API, de los hooks de datos ni
de ninguna pantalla de producto. SHALL poder montarse y probarse sin servidor, sin sesión y sin
datos.

Esta frontera es lo que permite que las once pantallas siguientes compartan las mismas piezas sin
arrastrar dependencias cruzadas entre áreas del producto.

#### Scenario: Una pieza importa un cliente de la API

- **WHEN** una pieza del sistema importa un cliente de la API o un hook de datos
- **THEN** la verificación del proyecto falla

#### Scenario: Prueba sin servidor

- **WHEN** se monta una pieza del sistema en una prueba
- **THEN** rinde correctamente sin que haya ninguna API disponible

### Requirement: Los textos visibles salen del catálogo de mensajes

Ninguna pieza del sistema SHALL incrustar un texto visible al usuario. Todo texto que una pieza rinda
por su cuenta —una etiqueta accesible, la unidad de una cifra, el nombre de una acción de cierre—
SHALL proceder del catálogo de mensajes del front.

El contenido de ejemplo del catálogo vivo queda **excluido** de esta regla y SHALL vivir en el propio
archivo del catálogo. No es texto de producto: no lo lee ningún usuario y no viaja en la compilación
que se publica, así que llevarlo al catálogo de mensajes solo conseguiría que alguien tradujera
cadenas muertas el día que llegue un segundo idioma, que es justo lo que esta regla existe para
evitar.

#### Scenario: Un texto incrustado en una pieza

- **WHEN** una pieza del sistema contiene un texto visible escrito en el propio componente
- **THEN** se considera un defecto, aunque el componente funcione

#### Scenario: Contenido de ejemplo del catálogo

- **WHEN** el catálogo vivo necesita un título de tarea o un nombre de hijo para enseñar una pieza
- **THEN** ese texto vive en el archivo del catálogo y no en el catálogo de mensajes

### Requirement: Existe un catálogo vivo de las piezas y no se publica

SHALL existir dentro de la propia aplicación una superficie navegable que muestre cada pieza del
sistema en sus estados y en las dos escalas, de modo que cualquier pantalla futura pueda copiar en
vez de inventar.

Esa superficie NO SHALL estar disponible en una compilación de producción, y no formar parte del
producto NO SHALL depender de que nadie enlace a ella.

#### Scenario: Consultar el catálogo en desarrollo

- **WHEN** se abre la superficie del catálogo mientras se desarrolla
- **THEN** se ven todas las piezas del sistema en sus estados y en las dos escalas

#### Scenario: Alguien pide el catálogo en producción

- **WHEN** se solicita la dirección del catálogo en una compilación de producción
- **THEN** no se sirve el catálogo
- **AND** su código no viaja en el paquete que descarga el usuario

### Requirement: Las piezas se prueban montándolas

La verificación del proyecto SHALL poder montar una pieza de interfaz, interactuar con ella como lo
haría una persona y consultar el resultado. Una prueba de este tipo SHALL ejecutarse con el resto de
la verificación del front, sin un comando aparte.

Sin esto, ningún cambio posterior de esta etapa puede cumplir la regla del proyecto de que nada se da
por terminado sin tests.

#### Scenario: Prueba de interacción

- **WHEN** una prueba activa un control y comprueba el resultado en el documento
- **THEN** se ejecuta al lanzar la verificación del front

#### Scenario: Las pruebas existentes siguen pasando

- **WHEN** se amplía la verificación para admitir pruebas de interfaz
- **THEN** las pruebas de cliente de API que ya existían siguen ejecutándose y pasando

### Requirement: El movimiento respeta la preferencia del sistema

Toda transición o animación que el sistema declare SHALL anularse o reducirse cuando la persona haya
pedido menos movimiento en su sistema operativo. La preferencia SHALL respetarse en el propio
sistema, y NO SHALL quedar a cargo de cada pantalla acordarse.

#### Scenario: Preferencia de movimiento reducido activada

- **WHEN** el sistema operativo declara que se prefiere movimiento reducido
- **THEN** las transiciones del sistema de diseño no se ejecutan o se reducen a un cambio inmediato
- **AND** la interfaz sigue siendo completamente utilizable

### Requirement: La tipografía la entrega el sistema, no el dispositivo

La familia tipográfica de la marca SHALL ser la **misma en todos los dispositivos**. El sistema SHALL
entregarla, y NO SHALL delegarla en lo que cada sistema operativo tenga instalado.

Una pila de familias del sistema resuelve a algo distinto en cada aparato: lo que en uno se ve
redondeado, en otro no. Eso convierte una decisión de diseño en una lotería, y es tan inaceptable
como dejar un color a criterio del navegador.

SHALL declararse igualmente una pila de respaldo del sistema **detrás** de la familia de la marca. Si
la fuente tarda o falla, lo que se ve es esa pila y nunca la serif por defecto del navegador.

#### Scenario: La misma pantalla en dos dispositivos distintos

- **WHEN** se abre la misma pantalla en dos sistemas operativos diferentes
- **THEN** el texto se dibuja con la misma familia tipográfica en los dos

#### Scenario: La fuente no llega a cargar

- **WHEN** el archivo de la fuente no está disponible
- **THEN** el texto se dibuja con la pila de respaldo del sistema
- **AND** sigue siendo legible, sin caer en la serif por defecto del navegador

#### Scenario: Mientras la fuente carga

- **WHEN** la página se pinta antes de que la fuente haya terminado de cargar
- **THEN** el texto es visible desde el primer momento con el respaldo
- **AND** no queda invisible esperando

### Requirement: Ningún recurso visual viene de un tercero

El front NO SHALL solicitar a un dominio de terceros ninguna fuente, imagen, hoja de estilos ni
script para pintarse. Todo lo que necesita SHALL servirse desde su propio origen.

Son dos razones, y las dos importan. Una: cada petición a un tercero le revela a ese tercero la IP de
una familia que usa el producto, y este producto es de niños. Dos: una dependencia externa en el
camino crítico es algo más que puede caerse, ir lento o estar bloqueado, y no lo controlamos.

#### Scenario: Se abre cualquier pantalla

- **WHEN** se carga una pantalla del front
- **THEN** todas las peticiones van al propio origen o a la API del producto
- **AND** ninguna va a un dominio de terceros

#### Scenario: Se añade un recurso visual nuevo

- **WHEN** el diseño necesita una fuente o un archivo que no está en el proyecto
- **THEN** se incorpora al proyecto y se sirve desde el propio origen
- **AND** no se enlaza desde el dominio de quien lo publica

### Requirement: Las cifras de una columna alinean

Cuando se muestren varias cantidades en monedas una debajo de otra, sus dígitos SHALL ocupar todos el
mismo ancho, de modo que las cifras queden alineadas en columna.

Con cifras de ancho variable, `120` y `1.250` desalinean sus dígitos y una lista de saldos se lee como
un texto en vez de como una tabla de números. Comparar de un vistazo cuánto tiene cada hijo es
justamente lo que un padre hace en esa pantalla.

#### Scenario: Varios saldos en una lista

- **WHEN** se muestran las cantidades de varios hijos, una debajo de otra
- **THEN** sus dígitos quedan alineados verticalmente

#### Scenario: Una cantidad que cambia

- **WHEN** una cantidad se anima contando de cero a su valor
- **THEN** el texto no se desplaza a cada paso de la cuenta

### Requirement: El avatar admite más de una forma

La pieza que dibuja un avatar SHALL ofrecer su forma como una opción declarada, y NO SHALL fijar una
sola. La forma por defecto SHALL seguir siendo la de hoy, para que ninguna pantalla existente cambie
sin pedirlo.

La forma SHALL ser una opción de la pieza y NO SHALL poder imponerse desde fuera con clases: el
utilitario que une clases en este proyecto no resuelve conflictos entre utilidades de Tailwind, así
que un radio pasado desde el punto de uso gana o pierde según el orden en que se genere el CSS. Eso
es un fallo que no se ve al leer el código y que puede cambiar entre compilaciones.

#### Scenario: Una pantalla no pide forma

- **WHEN** se usa la pieza sin indicar forma
- **THEN** se dibuja con la forma de siempre

#### Scenario: Una pantalla pide otra forma

- **WHEN** se indica una forma distinta
- **THEN** la pieza se dibuja con esa forma
- **AND** las demás pantallas no cambian

### Requirement: El campo de texto admite una forma de píldora con icono

La pieza que dibuja una entrada de texto SHALL ofrecer, como opción declarada, una forma de píldora
con sitio para un icono a su izquierda. La forma por defecto SHALL seguir siendo la de hoy.

Igual que con la forma del avatar, la variante SHALL vivir en la pieza y NO SHALL poder imponerse
desde el punto de uso con clases: el utilitario que une clases en este proyecto no resuelve
conflictos entre utilidades de Tailwind.

Un icono dentro del campo SHALL ser decorativo: lo que nombra al campo es su etiqueta.

#### Scenario: Una pantalla no pide forma

- **WHEN** se usa la pieza sin indicar forma
- **THEN** se dibuja como hasta ahora

#### Scenario: Un campo con icono

- **WHEN** se dibuja un campo en píldora con un icono
- **THEN** el icono no se anuncia como contenido
- **AND** el campo sigue nombrándose por su etiqueta

### Requirement: Una acción representada solo por un símbolo lleva nombre

Un control cuyo contenido visible sea únicamente un símbolo SHALL declarar un nombre accesible que
diga qué hace.

Una flecha sola no dice si envía, avanza o vuelve.

#### Scenario: El envío de un formulario es una flecha

- **WHEN** el control que envía el formulario muestra solo una flecha
- **THEN** se anuncia con un nombre que dice qué hace


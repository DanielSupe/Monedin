## MODIFIED Requirements

### Requirement: La página explica el producto sin pedir nada

La puerta pública SHALL comunicar, sin que haga falta ninguna interacción, las tres cosas que definen
el producto: que las tareas valen monedas, que los premios cuestan monedas, y que el padre aprueba
ambas.

Un formulario de acceso da por hecho que a quien lo mira ya lo convencieron. Esta página es la que
convence.

Las tres SHALL contarse como **un flujo en orden** y no como tres piezas sueltas: son un ciclo, y una
lista de tres no dice que lo sean. El paso de aprobar SHALL ir **entre** la tarea y las monedas, que
es donde ocurre de verdad — aprobar es lo que acredita.

La página NO SHALL decir las mismas tres ideas dos veces. Antes había una lista de tres tarjetas
diciendo justo lo que dice el flujo; el flujo las sustituye.

#### Scenario: Alguien mira la página y no toca nada

- **WHEN** alguien abre la puerta pública y no interactúa
- **THEN** puede leer qué hace el producto y para quién es

#### Scenario: El ciclo se lee como un ciclo

- **WHEN** alguien recorre la explicación del producto
- **THEN** encuentra los pasos en orden, y aprobar entre la tarea y las monedas

#### Scenario: Nada se dice dos veces

- **WHEN** se recorre la página entera
- **THEN** las tres ideas del producto aparecen una sola vez

#### Scenario: La página no consulta datos de nadie

- **WHEN** se abre la puerta pública sin sesión
- **THEN** no se solicita ningún dato de ninguna familia
- **AND** la página se muestra completa aunque no haya nada que consultar

## ADDED Requirements

### Requirement: La página enseña la aplicación, y sus dos caras

La puerta pública SHALL mostrar cómo se ve la aplicación por dentro, y SHALL mostrar **las dos
caras**: lo que ve el padre y lo que ve el niño.

Quien lee la página es el adulto que se registra, pero el producto es de los dos. Enseñar solo su
panel deja fuera aquello de lo que va todo; enseñar solo el del niño le oculta lo que él va a usar a
diario.

Las maquetas SHALL rendirse **con las piezas y la escala reales del producto**, de modo que la
diferencia entre las dos audiencias que se ve en la página sea la que existe. NO SHALL ser imágenes
capturadas: una captura envejece en silencio cuando el sistema de diseño cambia.

Las maquetas SHALL anunciarse como ejemplos, para que quien no ve la página no las confunda con datos
de alguien.

#### Scenario: Alguien mira cómo es la aplicación

- **WHEN** alguien recorre la puerta pública
- **THEN** ve una maqueta de lo que ve el padre y otra de lo que ve el niño

#### Scenario: La diferencia de escala es la real

- **WHEN** se comparan las dos maquetas
- **THEN** cada una rinde con la escala de su audiencia

#### Scenario: No se confunden con datos de nadie

- **WHEN** alguien recorre la página sin verla
- **THEN** las maquetas se anuncian como ejemplos

### Requirement: La página cierra con su acción

La puerta pública SHALL ofrecer la acción principal **también al final**, después del último
argumento, y NO SHALL obligar a volver arriba a quien ha leído la página entera.

El cierre NO SHALL repetir los argumentos ni pedir datos: quien llega ahí ya los leyó, y un
formulario en una página que no puede validar nada es una pantalla de acceso disfrazada.

#### Scenario: Alguien lee hasta el final

- **WHEN** alguien recorre la puerta pública hasta abajo
- **THEN** encuentra ahí la acción principal
- **AND** lleva al mismo sitio que la de arriba

#### Scenario: El cierre no vuelve a argumentar

- **WHEN** se lee el cierre
- **THEN** no repite lo que las secciones anteriores ya dijeron

### Requirement: Las secciones se distinguen por su superficie

Las secciones de la puerta pública SHALL distinguirse unas de otras por su fondo, alternando las
superficies que el sistema ya define. NO SHALL declararse un color nuevo para separarlas.

Cinco bloques seguidos sobre el mismo fondo se leen como uno solo y muy largo: sin un cambio que
marque dónde acaba cada idea, quien recorre la página no sabe cuántas cosas le han dicho.

#### Scenario: Se recorre la página

- **WHEN** alguien baja por la puerta pública
- **THEN** cada sección se distingue de la anterior por su fondo

#### Scenario: No aparecen colores nuevos

- **WHEN** se revisan las superficies que usa la página
- **THEN** todas salen de las que el sistema ya define

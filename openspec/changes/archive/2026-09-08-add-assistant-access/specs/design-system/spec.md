## MODIFIED Requirements

### Requirement: Un único origen para todo valor visual

Todo color, espaciado, radio, sombra, familia y tamaño tipográfico, duración de transición **y orden
de apilado** del front SHALL declararse en un único archivo de tokens. Ningún otro archivo SHALL
declarar uno de esos valores literalmente: el punto de uso referencia el token, nunca lo repite.

Es la misma regla que ya rige los límites de negocio y los textos visibles: si un valor tiene
significado, vive en un solo sitio.

El orden de apilado entra en la lista porque **quién tapa a quién es una decisión visual como
cualquier otra**, y hasta ahora era la única que se tomaba escribiendo un número suelto. Con una sola
capa flotante nadie lo notaba; en cuanto hay dos que ocupan el mismo sitio, dos números escritos a
mano en dos archivos distintos son dos decisiones que nadie ha comparado.

Cada paso de la escala SHALL nombrar **para qué sirve** y no cuánto vale, igual que un color se
nombra por su papel: el punto de uso pide «la capa del aviso», no un número.

#### Scenario: Un componente declara un color literal

- **WHEN** un archivo distinto del archivo de tokens contiene un color escrito literalmente
- **THEN** la verificación del proyecto falla señalando el archivo y el valor

#### Scenario: Un componente declara una medida en el punto de uso

- **WHEN** un componente declara un espaciado, un radio o un tamaño arbitrario en lugar de usar un
  token
- **THEN** la verificación del proyecto falla señalando el archivo de tokens como el sitio correcto

#### Scenario: Un componente declara un orden de apilado en el punto de uso

- **WHEN** un componente que flota sobre el contenido fija su orden de apilado con un número escrito
  en el propio componente
- **THEN** la verificación del proyecto falla señalando el archivo de tokens como el sitio correcto

#### Scenario: Dos capas flotantes coinciden en pantalla

- **WHEN** dos elementos que flotan sobre el contenido pueden verse a la vez
- **THEN** cuál queda encima se lee en el archivo de tokens, comparando dos pasos con nombre
- **AND** no hace falta abrir los dos componentes para averiguarlo

#### Scenario: Cambiar un token cambia toda la interfaz

- **WHEN** se modifica el valor de un token en el archivo de tokens
- **THEN** todas las piezas que lo referencian cambian, sin editar ninguna de ellas

## ADDED Requirements

### Requirement: El sistema ofrece una revelación en línea, y no se escribe a mano

El sistema SHALL ofrecer una pieza que revela y oculta contenido **en el sitio donde está**, sin
taparlo todo ni salir por un lado. Es una tercera forma de revelación junto al diálogo y al panel
lateral, y responde a otra pregunta: el diálogo interrumpe para pedir algo, el panel lateral saca una
lista de destinos, y esta despliega una respuesta larga sin sacar a nadie de donde estaba.

La pieza SHALL anunciar a quien no ve la pantalla si está abierta o cerrada, SHALL relacionar el
control con lo que revela, y SHALL poder recorrerse con el teclado. NO SHALL escribirse a mano en la
pantalla que la necesite: es exactamente el tipo de detalle que se olvida una vez por pieza.

La pieza SHALL declarar si puede haber varias abiertas a la vez, y esa decisión SHALL ser suya y no
de quien la coloca.

#### Scenario: Se despliega una respuesta

- **WHEN** alguien pulsa el encabezado de una sección plegada
- **THEN** su contenido aparece debajo, sin tapar el resto de la pantalla
- **AND** el estado abierto o cerrado se anuncia a un lector de pantalla

#### Scenario: Se recorre con el teclado

- **WHEN** alguien llega a la lista de secciones tabulando
- **THEN** puede abrir y cerrar cada una sin usar el ratón

#### Scenario: Una pantalla la usa

- **WHEN** una pantalla necesita plegar y desplegar contenido
- **THEN** usa la pieza del sistema
- **AND** no vuelve a escribir el comportamiento de apertura por su cuenta

### Requirement: Un texto que cambia solo es movimiento

Un elemento que sustituye su propio contenido cada cierto tiempo sin que nadie lo pida SHALL
detenerse cuando la persona haya pedido menos movimiento en su sistema operativo, y SHALL quedarse
mostrando uno de sus contenidos.

NO SHALL bastar con acortar la transición entre uno y otro: el bloque de movimiento reducido del
sistema deja las duraciones en un instante, y eso convierte un cambio suave en un salto, que es peor
para quien pidió no ver movimiento y no mejor.

La preferencia SHALL leerse antes del primer pintado, de modo que quien la tenga activada no llegue a
ver ni un cambio.

#### Scenario: Preferencia de movimiento reducido activada

- **WHEN** el sistema operativo declara que se prefiere movimiento reducido
- **THEN** el contenido que se turnaba deja de turnarse
- **AND** sigue mostrando uno de sus contenidos, no un hueco

#### Scenario: Sin preferencia declarada

- **WHEN** no se ha pedido menos movimiento
- **THEN** el contenido se turna, y la transición entre uno y otro es suave

#### Scenario: El primer pintado ya es el correcto

- **WHEN** alguien con la preferencia activada abre una pantalla que tiene contenido que se turna
- **THEN** no llega a ver ningún cambio, ni siquiera el primero

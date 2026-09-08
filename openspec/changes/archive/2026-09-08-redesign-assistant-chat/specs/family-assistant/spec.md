## MODIFIED Requirements

### Requirement: Lo que el asistente diga no se presenta como un hecho ocurrido

La interfaz NO SHALL tratar la respuesta del modelo como una acción realizada ni como un dato
autorizado del producto. La respuesta SHALL mostrarse como texto atribuido a Monedín, distinguible
de lo que dice la propia aplicación, y SHALL renderizarse como texto plano.

La atribución SHALL sostenerse en algo que no sea el color. Puede reforzarse con color, con posición
y con una ilustración de la mascota —y así se hace—, pero quien no ve la pantalla tiene que poder
saber quién habla en cada turno, y ninguna de esas tres cosas se lo dice.

No hay garantía de que el modelo obedezca su guion, ni filtro de lo que responde. Esa limitación es
conocida y aceptada, y lo que la acota es que el asistente no puede hacer nada: el peor resultado de
una respuesta equivocada es una frase equivocada.

#### Scenario: La respuesta se atribuye

- **WHEN** llega una respuesta
- **THEN** aparece identificada como de Monedín, y no solo distinguida por un color

#### Scenario: Quien no ve la pantalla también sabe quién habla

- **WHEN** se recorre la conversación sin ver la disposición ni los colores
- **THEN** cada turno sigue diciendo de quién es

#### Scenario: La respuesta no ejecuta nada

- **WHEN** la respuesta contiene algo que parece una instrucción o un fragmento de marcado
- **THEN** se muestra como texto y no se interpreta

## ADDED Requirements

### Requirement: Un turno se distingue del anterior sin leer de quién es

En la conversación, lo que escribe quien pregunta y lo que responde Monedín SHALL distinguirse **de
un vistazo**, sin tener que leer la etiqueta que los nombra. La distinción SHALL apoyarse en más de
una señal a la vez: al menos la posición dentro de la línea y el color de la superficie.

Los turnos NO SHALL ocupar el ancho completo de la conversación: un bloque que llega de borde a
borde no se lee como algo que alguien dijo, y en una pantalla ancha obliga a recorrer la línea entera
para volver al principio del siguiente.

#### Scenario: Se mira una conversación empezada

- **WHEN** hay preguntas y respuestas en pantalla
- **THEN** las de quien pregunta y las de Monedín no están alineadas al mismo lado
- **AND** no comparten superficie

#### Scenario: Un turno no ocupa toda la línea

- **WHEN** un turno es corto
- **THEN** su superficie ocupa lo que ocupa su texto, no el ancho de la conversación

### Requirement: Las sugerencias y la mascota acompañan, y solo donde caben

La pantalla SHALL ofrecer un conjunto corto de preguntas de arranque y SHALL mostrar a la mascota,
las dos cosas **de forma permanente**: antes de conversar y después. Las sugerencias dejan de ser el
remedio del folio en blanco y pasan a ser el atajo para cambiar de tema sin escribir, que es lo que
necesita quien todavía escribe despacio; la mascota es con quien se está hablando, y retirarla dejaba
la pantalla sin la cara que le da nombre.

Cuando NO hay ancho para una columna al lado, ninguna de las dos SHALL montarse: en un teléfono la
pantalla es la conversación y nada más, y las dos comerían el alto que necesita lo único que se va a
leer ahí. NO SHALL esconderse con CSS —seguirían existiendo para quien recorre el documento con
teclado— sino que no se montan.

Elegir una sugerencia SHALL preguntarla, no escribirla en el campo para que alguien la envíe después.

#### Scenario: Ya hay conversación

- **WHEN** alguien ya preguntó algo y recibió respuesta
- **THEN** las sugerencias y la mascota siguen ahí

#### Scenario: Se elige una sugerencia

- **WHEN** alguien pulsa una de las preguntas propuestas
- **THEN** esa pregunta se envía, y aparece en la conversación como suya
- **AND** el campo de escribir sigue vacío

#### Scenario: No hay ancho para una columna al lado

- **WHEN** la pantalla es estrecha
- **THEN** no hay ni sugerencias ni mascota grande
- **AND** la conversación y su campo sí están

### Requirement: El campo de escribir no se va con los mensajes

La conversación SHALL desplazarse **por dentro**, y el campo de escribir SHALL quedarse abajo, haya
cero mensajes o muchos. Es la única pantalla del producto que lo hace, y por eso su ruta SHALL
declarar que gestiona su propio alto: con el documento desplazando, el campo se iría con los mensajes
y habría que perseguirlo para escribir la siguiente pregunta.

El campo NO SHALL estar dentro del elemento que desplaza. Y NO SHALL haber dos contenedores de
desplazamiento anidados: si el marco también desplazara, el de fuera se llevaría el campo igualmente.

Al llegar un turno nuevo, la conversación SHALL moverse hasta él. Un hilo que crece fuera de la vista
deja la respuesta que se acaba de pedir donde nadie la ve.

#### Scenario: La conversación pasa de largo

- **WHEN** hay más mensajes de los que caben
- **THEN** se desplaza la conversación, no la página
- **AND** el campo de escribir sigue en su sitio

#### Scenario: Llega una respuesta

- **WHEN** aparece un turno nuevo
- **THEN** la conversación queda mostrando ese turno

### Requirement: El hueco vacío dice para qué sirve

Mientras no hay conversación, el espacio que ocupará SHALL mostrar una invitación a preguntar, en
tinta atenuada y **sin ninguna acción**: no es un aviso ni un error, y darle un botón lo convertiría
en algo que hay que atender. Las acciones son las sugerencias.

SHALL desaparecer con el primer mensaje: dejarla competiría con lo que se está leyendo.

#### Scenario: Se abre el chat sin haber preguntado nada

- **WHEN** alguien llega a la pantalla
- **THEN** el hueco de la conversación invita a preguntar

#### Scenario: Se hace la primera pregunta

- **WHEN** aparece el primer turno
- **THEN** la invitación ya no está

### Requirement: Escribir una pregunta es una sola fila

El campo y la acción de enviar SHALL ocupar una sola fila, con la acción dentro o pegada al campo. NO
SHALL haber una etiqueta encima ocupando su propia línea: en una pantalla donde solo se puede hacer
una cosa, decir cuál es en un rótulo aparte gasta alto sin informar.

La pantalla SHALL seguir anunciando a quien no la ve para qué sirve ese campo, aunque el rótulo no se
dibuje.

#### Scenario: Se mira el pie de la pantalla

- **WHEN** alguien va a escribir
- **THEN** el campo y la acción están en la misma fila

#### Scenario: Se llega al campo sin ver la pantalla

- **WHEN** se recorre la pantalla con un lector
- **THEN** el campo dice para qué es

## Purpose

Monedín responde preguntas sobre lo que cada quien tiene delante —sus tareas, sus premios, sus
monedas— usando los datos reales de su familia, con la misma frontera que rige el resto del
producto: un padre ve a todos sus hijos y un niño solo se ve a sí mismo.

## ADDED Requirements

### Requirement: El asistente responde con los datos de quien pregunta

La API SHALL exponer un endpoint que reciba una pregunta en lenguaje natural y devuelva una
respuesta redactada a partir del contexto de la familia de quien la hace. El contexto SHALL salir
del actor de la sesión y NO SHALL admitir ningún identificador en la petición: no existe el
parámetro con el que se apuntaría a otra persona.

La respuesta SHALL llegar completa en un único cuerpo JSON. No hay entrega progresiva.

#### Scenario: Un padre pregunta por su familia

- **WHEN** un padre con perfil activo envía una pregunta
- **THEN** la API responde 200 con el texto de la respuesta
- **AND** el contexto entregado al modelo incluye a sus hijos, sus tareas por aprobar, sus premios activos y sus canjes pendientes

#### Scenario: Un niño pregunta por lo suyo

- **WHEN** un niño con perfil activo envía una pregunta
- **THEN** la API responde 200 con el texto de la respuesta
- **AND** el contexto entregado al modelo incluye su saldo, sus tareas, los premios que le fueron ofrecidos con SU precio y sus últimos movimientos

#### Scenario: La petición no admite apuntar a otra persona

- **WHEN** alguien añade a la petición un campo con el identificador de otro perfil
- **THEN** la API responde 422, porque el esquema de entrada es estricto
- **AND** el contexto se sigue tomando de la sesión

### Requirement: Un niño nunca recibe datos de sus hermanos

El contexto entregado al modelo cuando pregunta un niño SHALL contener únicamente datos de su propio
perfil. NO SHALL contener el nombre, el saldo, las tareas, los precios ni los canjes de ningún otro
hijo de la familia, ni siquiera de forma agregada.

Esto NO se sostiene sobre lo que diga la instrucción de sistema —a un modelo se le puede convencer
de casi cualquier cosa— sino sobre que el dato **no está en la ventana**: si nunca se cargó, no hay
nada que revelar.

#### Scenario: Un hijo con hermanos pregunta

- **WHEN** un niño de una familia con más de un hijo envía una pregunta
- **THEN** el texto completo entregado al modelo no contiene el nombre de ningún hermano
- **AND** no contiene ninguno de los importes de las tareas, premios ni canjes de sus hermanos
- **AND** sí contiene sus propios datos, de modo que la ausencia no se deba a un contexto vacío

#### Scenario: Se pide explícitamente el dato de un hermano

- **WHEN** un niño escribe una pregunta pidiendo el saldo de su hermano
- **THEN** el contexto entregado sigue sin contener ese dato
- **AND** la garantía no depende de que el modelo se niegue a contestar

#### Scenario: Un padre sí ve a todos sus hijos, y solo a los suyos

- **WHEN** un padre envía una pregunta
- **THEN** el contexto contiene a todos sus hijos activos
- **AND** no contiene ningún dato de otra familia

### Requirement: El asistente responde y no actúa

El asistente SHALL limitarse a explicar, orientar y responder. NO SHALL crear, editar ni borrar
ninguna entidad, NO SHALL aprobar ni rechazar tareas o canjes, y NO SHALL modificar ningún saldo.

La garantía NO SHALL ser una instrucción al modelo: no SHALL existir camino de código desde la
respuesta hacia una mutación. Cuando alguien pida una acción, el asistente SHALL indicar en qué
pantalla se hace.

#### Scenario: Se le pide al asistente que apruebe una tarea

- **WHEN** un padre escribe que se apruebe la tarea de un hijo
- **THEN** el estado de esa tarea no cambia
- **AND** el saldo del hijo no cambia
- **AND** no se escribe ninguna fila en el historial de monedas

#### Scenario: Un niño pide más monedas

- **WHEN** un niño escribe que le den monedas
- **THEN** su saldo no cambia
- **AND** la respuesta no afirma que se le hayan dado ni que se le vayan a dar

### Requirement: La conversación vive en la pantalla y no se guarda

El sistema NO SHALL persistir preguntas ni respuestas. El hilo previo SHALL viajar en cada petición
desde el cliente, y la API SHALL usarlo solo para componer esa respuesta.

En consecuencia, el hilo SHALL perderse al abandonar la pantalla o recargar, y eso es el
comportamiento correcto y no una carencia.

#### Scenario: Se navega fuera del chat y se vuelve

- **WHEN** alguien conversa, navega a otra pantalla y regresa al chat
- **THEN** la conversación empieza vacía

#### Scenario: El hilo previo se tiene en cuenta

- **WHEN** alguien pregunta algo y después escribe una pregunta que se apoya en lo anterior
- **THEN** la segunda petición lleva los turnos previos
- **AND** el modelo los recibe en el mismo orden en que ocurrieron

#### Scenario: Nada queda escrito

- **WHEN** se completa una conversación
- **THEN** no se ha creado ninguna fila en la base de datos

### Requirement: El hilo que llega del cliente no es de fiar, y por eso no decide nada

Los turnos que el cliente envía SHALL tratarse como entrada del usuario, incluidos los que dicen ser
respuestas anteriores del asistente: al no persistirse nada, no hay transcripción contra la que
contrastarlos y cualquiera puede fabricarlos.

Que eso no importe SHALL apoyarse en que el hilo no puede ampliar el contexto: los datos de la
familia se cargan desde la sesión, y ningún texto recibido añade un dato que no estuviera ya.

El texto del usuario SHALL viajar como turno propio y NO SHALL concatenarse dentro de la instrucción
de sistema.

#### Scenario: Se falsifica un turno del asistente

- **WHEN** el cliente envía un turno con rol de asistente afirmando el saldo de otro hijo
- **THEN** el contexto cargado desde la sesión sigue sin contener ese dato
- **AND** la respuesta no puede confirmarlo a partir de datos del producto

#### Scenario: Los canales están separados

- **WHEN** se compone la petición al modelo
- **THEN** la instrucción de sistema no contiene el texto escrito por el usuario

### Requirement: La entrada tiene topes declarados y pasarse es un error

La API SHALL declarar un máximo de caracteres por pregunta, un máximo de turnos previos y un máximo
de caracteres por turno. Superar cualquiera de ellos SHALL responder 422 indicando el campo, y NO
SHALL recortarse en silencio: recortar dejaría a quien pregunta creyendo que el asistente recuerda
algo que nunca le llegó.

El cliente SHALL recortar el hilo antes de enviarlo, de modo que el 422 solo lo vea un cliente roto.
El recorte SHALL ocurrir en un solo sitio.

#### Scenario: Pregunta vacía

- **WHEN** se envía una pregunta en blanco
- **THEN** la API responde 422 señalando el campo de la pregunta

#### Scenario: Pregunta demasiado larga

- **WHEN** se envía una pregunta que supera el máximo declarado
- **THEN** la API responde 422 y no una respuesta recortada

#### Scenario: Hilo demasiado largo

- **WHEN** se envían más turnos previos de los permitidos
- **THEN** la API responde 422

#### Scenario: El formulario dice el límite antes de rechazarlo

- **WHEN** alguien escribe en el campo de la pregunta
- **THEN** el campo no le deja pasar del máximo
- **AND** ese máximo sale de la misma constante que valida el servidor

### Requirement: Solo se conversa con un perfil activo

El endpoint SHALL exigir actor. Una petición sin sesión, o con la cuenta acreditada pero sin perfil
elegido, SHALL responder 401. NO SHALL ser una ruta pública ni de solo cuenta: sin saber quién está
operando no hay contexto que cargar.

Los dos roles SHALL alcanzar la pantalla del chat sin ser redirigidos.

#### Scenario: Sin sesión

- **WHEN** se llama al endpoint sin credenciales
- **THEN** la API responde 401

#### Scenario: Cuenta acreditada y sin perfil elegido

- **WHEN** se llama al endpoint con la cookie de cuenta pero sin haber entrado a un perfil
- **THEN** la API responde 401

#### Scenario: Los dos roles llegan al chat

- **WHEN** un padre abre la pantalla del chat
- **THEN** la ve sin redirección
- **AND** lo mismo ocurre para un niño

### Requirement: Cada rol recibe su propio guion

La instrucción que gobierna al asistente SHALL ser distinta para el padre y para el niño. La del
niño SHALL usar frases cortas y tono cálido, SHALL declarar que solo conoce lo suyo y NO SHALL
prometer monedas, premios ni aprobaciones — eso lo decide un adulto, y decir otra cosa a un niño de
seis años es una promesa que el producto no puede cumplir.

La del padre SHALL explicar el ciclo del producto y SHALL declarar que la moneda es virtual, de modo
que no se presente como consejo financiero real.

Las dos SHALL prohibir inventar datos que no estén en el contexto entregado.

#### Scenario: Los dos guiones no son el mismo

- **WHEN** preguntan un padre y un niño
- **THEN** la instrucción de sistema entregada al modelo es distinta en cada caso

#### Scenario: Una pantalla, dos audiencias

- **WHEN** el chat se abre desde cualquiera de los dos roles
- **THEN** es la misma pantalla, y la diferencia de tamaños la impone el marco del rol
- **AND** no existen dos pantallas cuya única diferencia sea la audiencia

### Requirement: Cuando el proveedor externo falla, se dice sin alarmar

Si el servicio de IA no responde a tiempo, rechaza la petición, agota su cuota o devuelve algo
ilegible, la API SHALL responder 503 con un código estable, y la pantalla SHALL contarlo como
advertencia y no como error: nadie hizo nada mal.

La pantalla SHALL conservar la pregunta que se acababa de escribir y SHALL ofrecer reintentar. NO
SHALL borrarla: perder lo que alguien acaba de teclear es la peor respuesta a un fallo que no es
suyo.

El sistema NO SHALL reintentar por su cuenta. Reintentar es una decisión de quien está esperando.

#### Scenario: El proveedor no responde a tiempo

- **WHEN** la llamada al servicio de IA supera su tiempo límite
- **THEN** la API responde 503 con el código de servicio no disponible

#### Scenario: El proveedor agotó su cuota

- **WHEN** el servicio de IA rechaza la petición por cuota
- **THEN** la API responde 503, y no 429

#### Scenario: El proveedor devuelve algo con otra forma

- **WHEN** el servicio de IA responde un cuerpo que no encaja con lo esperado
- **THEN** la API responde 503
- **AND** no llega a la pantalla una respuesta vacía o incompleta

#### Scenario: La pantalla lo cuenta sin culpar a nadie

- **WHEN** el chat recibe un 503
- **THEN** muestra un aviso en tono de advertencia, no de peligro
- **AND** la pregunta escrita sigue en pantalla con la opción de reintentar

### Requirement: La credencial del servicio externo nunca se filtra

La clave del proveedor SHALL declararse como secreta. NO SHALL aparecer en ninguna respuesta de la
API, en ningún registro del servidor ni en ningún mensaje de error, ni siquiera cuando la llamada
falla.

El detalle del fallo que se registre SHALL limitarse al motivo y al estado, y NO SHALL arrastrar la
petición, sus cabeceras ni su dirección.

#### Scenario: La llamada al proveedor falla

- **WHEN** el servicio de IA devuelve un error y la API lo registra
- **THEN** el valor de la clave no aparece en nada de lo registrado
- **AND** tampoco en el cuerpo de la respuesta

#### Scenario: El 503 no filtra detalles internos

- **WHEN** la API responde 503
- **THEN** el cuerpo no contiene trazas de pila, rutas de archivos ni mensajes de librerías

### Requirement: Lo que el asistente diga no se presenta como un hecho ocurrido

La interfaz NO SHALL tratar la respuesta del modelo como una acción realizada ni como un dato
autorizado del producto. La respuesta SHALL mostrarse como texto atribuido a Monedín, distinguible
de lo que dice la propia aplicación, y SHALL renderizarse como texto plano.

No hay garantía de que el modelo obedezca su guion, ni filtro de lo que responde. Esa limitación es
conocida y aceptada, y lo que la acota es que el asistente no puede hacer nada: el peor resultado de
una respuesta equivocada es una frase equivocada.

#### Scenario: La respuesta se atribuye

- **WHEN** llega una respuesta
- **THEN** aparece identificada como de Monedín, y no solo distinguida por un color

#### Scenario: La respuesta no ejecuta nada

- **WHEN** la respuesta contiene algo que parece una instrucción o un fragmento de marcado
- **THEN** se muestra como texto y no se interpreta

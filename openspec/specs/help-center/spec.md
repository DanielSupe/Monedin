# help-center Specification

## Purpose
Cómo encuentra ayuda quien la necesita: una mascota que la ofrece sin que nadie la busque, un icono
que la deja siempre a mano, y unas preguntas frecuentes con salida hacia el chat cuando la respuesta
corta no basta.
## Requirements
### Requirement: Monedín se ofrece desde cualquier pantalla

Con un perfil activo, el marco SHALL mostrar de forma permanente un acceso al chat en una esquina,
compuesto por una ilustración de la mascota y una frase corta. Pulsarlo SHALL llevar al chat.

NO SHALL poder cerrarse. Es un acceso permanente como el avatar de la cabecera: un botón de apagado
deja a quien lo pulsa sin forma de volver a encenderlo, y el problema que resolvería —que canse— se
arregla cambiando cada cuánto habla o qué dice.

NO SHALL taparse a sí mismo con otra capa flotante ni tapar ninguna: cuál va encima SHALL estar
declarado, y un aviso del sistema SHALL quedar por encima, porque una mascota tapada es inofensiva y
un aviso tapado esconde información.

#### Scenario: Se abre cualquier pantalla con un perfil activo

- **WHEN** un padre o un niño está dentro de la aplicación
- **THEN** ve a Monedín ofreciéndose en una esquina
- **AND** pulsarlo lo lleva al chat

#### Scenario: Coincide con un aviso del sistema

- **WHEN** aparece un aviso emergente mientras Monedín está en pantalla
- **THEN** el aviso queda por encima
- **AND** el orden no depende de un número escrito dentro de ninguno de los dos

### Requirement: Lo que dice Monedín depende de dónde está y de quién lo mira

La frase y la ilustración SHALL turnarse cada cierto tiempo, y el conjunto del que salen SHALL
depender del **área** de la aplicación en la que se está y del **rol** de quien mira: en el
escaparate de un niño se habla de precios, en la bandeja de un adulto se habla de aprobar.

El conjunto SHALL colgar del área y NO de cada dirección concreta, de modo que una pantalla nueva de
un área existente herede sus frases sin que nadie se acuerde de añadirla. Y un área nueva NO SHALL
poder quedarse sin frases para uno de los dos roles: eso SHALL impedirlo la forma del código y no la
disciplina de quien lo escriba.

Al cambiar de área, lo que se muestra SHALL volver a empezar por el principio de su conjunto: quedarse
en la tercera frase de un conjunto que solo tiene dos es un defecto que solo aparece navegando.

Lo que se turna NO SHALL depender de ninguna consulta: se decide con lo que el marco ya sabe.

#### Scenario: Se pasa de un área a otra

- **WHEN** alguien navega desde su inicio a sus premios
- **THEN** lo que dice Monedín pasa a ser del conjunto de los premios
- **AND** empieza por el principio de ese conjunto

#### Scenario: La misma área para los dos roles

- **WHEN** un padre y un niño están cada uno en su área de premios
- **THEN** las frases que ven no son las mismas

#### Scenario: Una pantalla nueva de un área que ya existe

- **WHEN** se añade una dirección dentro de un área que ya tiene frases
- **THEN** hereda las de su área sin declararla en ninguna lista

#### Scenario: Se añade un área

- **WHEN** se declara un área sin frases para alguno de los dos roles
- **THEN** el proyecto no compila

### Requirement: Quien pidió menos movimiento no ve turnarse a Monedín

Cuando la persona haya pedido menos movimiento en su sistema operativo, la frase y la ilustración NO
SHALL turnarse: SHALL quedarse en una y no cambiar. La preferencia SHALL leerse antes del primer
pintado.

#### Scenario: Con movimiento reducido

- **WHEN** alguien con la preferencia activada deja abierta una pantalla un rato largo
- **THEN** Monedín sigue diciendo lo mismo que al llegar
- **AND** el acceso al chat sigue funcionando igual

### Requirement: Monedín no se duplica durante el recorrido de bienvenida

Mientras a un perfil se le está explicando el producto por primera vez, el marco NO SHALL mostrar el
acceso flotante. El recorrido ya enseña a la mascota, y un segundo Monedín apagado detrás del velo
compite con el que está hablando y se lee como un defecto.

Al terminar el recorrido —o al saltarlo, que cuenta igual— el acceso SHALL aparecer.

#### Scenario: Un perfil recién creado entra por primera vez

- **WHEN** se le está mostrando el recorrido de bienvenida
- **THEN** no hay ningún acceso flotante en la esquina

#### Scenario: Se salta el recorrido

- **WHEN** alguien lo salta desde el primer paso
- **THEN** el acceso flotante aparece

### Requirement: La ayuda está siempre a un toque desde la cabecera

El marco SHALL ofrecer en su cabecera un control que lleve a las preguntas frecuentes, junto al
avatar. El control SHALL llevar nombre accesible, porque un símbolo solo no dice a dónde lleva.

SHALL ser el mismo control en los dos marcos y NO SHALL escribirse dos veces.

#### Scenario: Se busca ayuda desde cualquier pantalla

- **WHEN** alguien con un perfil activo mira la cabecera
- **THEN** encuentra un acceso a la ayuda junto a su avatar
- **AND** quien no ve la pantalla lo oye nombrado

### Requirement: Las preguntas frecuentes se leen plegadas

SHALL existir un destino con las preguntas más frecuentes del producto, cada una plegada bajo su
enunciado y desplegable en el sitio. Una lista de respuestas abiertas obliga a desplazar para
encontrar la pregunta propia, que es justo lo que hace falta hacer primero.

SHALL ser **una sola lista para los dos roles**. Se acepta a conciencia que un niño lea enunciados
escritos para toda la familia; si al usarla se ve que no encuentra su duda, se parte entonces y con
el motivo medido, no antes.

Las preguntas SHALL cubrir al menos lo que el producto hace y ningún sitio explica: qué es una
moneda, por qué aprobar es lo que paga, por qué aprobar dos veces avisa en vez de pagar dos veces, y
qué se hace si alguien olvida su PIN.

#### Scenario: Se abre la ayuda

- **WHEN** alguien llega a las preguntas frecuentes
- **THEN** ve los enunciados de todas, plegados
- **AND** puede abrir el que le interesa sin desplazar por el resto

#### Scenario: Los dos roles leen lo mismo

- **WHEN** un padre y un niño abren la ayuda
- **THEN** ven la misma lista de preguntas
- **AND** cada uno la ve a la escala de su marco

### Requirement: Cuando la respuesta corta no basta, se pregunta

El destino de ayuda SHALL ofrecer al final un acceso al chat, presentado como lo que es: a dónde ir
cuando ninguna de las preguntas es la tuya.

SHALL ser un enlace, no un botón que navegue: navegar es trabajo de un enlace, y así se puede abrir
en otra pestaña.

Mientras se está en la ayuda, el acceso flotante NO SHALL mostrarse: serían dos caminos con el mismo
nombre al mismo sitio en la misma pantalla.

#### Scenario: Ninguna pregunta resuelve la duda

- **WHEN** alguien llega al final de las preguntas frecuentes
- **THEN** encuentra un acceso al chat
- **AND** es un enlace, así que puede abrirlo en otra pestaña

#### Scenario: Se está leyendo la ayuda

- **WHEN** alguien tiene abiertas las preguntas frecuentes
- **THEN** no hay además un acceso flotante ofreciendo lo mismo


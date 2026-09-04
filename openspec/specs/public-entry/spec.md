# public-entry Specification

## Purpose
Define qué ve alguien que llega a Monedín sin sesión: qué tiene que poder entender del producto antes
de dar un solo dato, y por dónde vuelve a entrar quien ya es usuario y se le caducó la sesión. Es la
única superficie del sistema pensada para alguien que todavía no es nadie.
## Requirements
### Requirement: Existe una puerta pública, y es donde acaba quien no tiene sesión

SHALL existir una página accesible **sin sesión de ningún tipo**. Quien abra cualquier destino de la
aplicación sin sesión SHALL acabar en ella.

Es la única página del sistema que no exige nada. Todas las demás exigen cuenta, perfil o ambos.

#### Scenario: Alguien llega por primera vez

- **WHEN** alguien sin sesión abre la dirección raíz
- **THEN** ve la puerta pública
- **AND** no se le pide ningún dato para verla

#### Scenario: Alguien abre un destino cualquiera sin sesión

- **WHEN** alguien sin sesión abre la dirección de una pantalla de la aplicación
- **THEN** acaba en la puerta pública

#### Scenario: Quien ya está dentro no vuelve a la puerta

- **WHEN** alguien con un perfil activo navega por la aplicación
- **THEN** no se le lleva a la puerta pública

#### Scenario: Quien ya está dentro puede verla si la pide

- **WHEN** alguien con sesión abre la dirección de la puerta pública a propósito
- **THEN** la ve
- **AND** no se le expulsa de su sesión

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

### Requirement: Quien ya es usuario encuentra la entrada de inmediato

La puerta pública recibe a dos personas distintas: quien no conoce el producto y quien **ya lo usa** y
se le caducó la sesión. El camino hacia la pantalla de acceso SHALL tener la misma prominencia que la
llamada a registrarse, y NO SHALL quedar relegado a un enlace secundario.

Es consecuencia directa de que todo destino sin sesión lleve aquí: si entrar cuesta encontrarlo, una
caducidad de sesión se convierte en un problema diario para quien ya pagó el precio de registrarse.

#### Scenario: A quien se le caducó la sesión

- **WHEN** alguien que ya tiene cuenta llega a la puerta pública
- **THEN** encuentra el camino a la pantalla de acceso sin buscarlo
- **AND** desde ahí puede entrar con normalidad

#### Scenario: Las dos acciones conviven

- **WHEN** se muestra la puerta pública
- **THEN** ofrece a la vez empezar de cero y entrar a una cuenta existente
- **AND** ninguna de las dos está escondida detrás de la otra

### Requirement: Lo que se anima explica el producto y se detiene si se pide

La página SHALL usar el movimiento para explicar el ciclo del producto —el esfuerzo que produce
monedas y las monedas que compran premios—, no como adorno.

Cuando la persona haya pedido menos movimiento en su sistema, cada elemento animado SHALL mostrar su
**estado final**, no quedarse a medias. Detener una cuenta a mitad o congelar un giro por la mitad es
peor que no animar.

#### Scenario: Movimiento reducido activado

- **WHEN** el sistema operativo declara que se prefiere movimiento reducido
- **THEN** los textos que se escriben solos aparecen completos
- **AND** las cifras que cuentan aparecen en su valor final
- **AND** lo que gira queda quieto en una posición estable

#### Scenario: La página se entiende igual sin movimiento

- **WHEN** no se ejecuta ninguna animación
- **THEN** el mensaje del producto sigue siendo legible y completo

### Requirement: La marca se rinde desde una sola pieza

El nombre y el símbolo de Monedín SHALL rendirse desde una única pieza reutilizable, usada tanto por
la puerta pública como por los marcos de la aplicación. NO SHALL escribirse el nombre como texto
suelto en cada sitio que lo muestre.

Cuando llegue la identidad visual definitiva, cambiarla tiene que ser sustituir una pieza, no
recorrer las pantallas que la mencionan.

#### Scenario: El mismo nombre en tres sitios

- **WHEN** se muestran la puerta pública y los dos marcos de la aplicación
- **THEN** los tres rinden la marca desde la misma pieza

#### Scenario: La marca se anuncia

- **WHEN** una tecnología de asistencia recorre cualquiera de esas pantallas
- **THEN** la marca se anuncia con el nombre del producto, y no como una imagen sin descripción

### Requirement: La página despeja que la moneda no es dinero real

La puerta pública SHALL decir, sin que haga falta ninguna interacción, que las monedas de Monedín no
son dinero real: que no hay pagos, que no salen ni entran de ninguna cuenta y que no se comparten con
otras familias.

Es lo primero que piensa un adulto al leer «monedas» y «premios» en una aplicación para su hijo, y
hasta ahora la página no lo contestaba en ninguna parte. Quien se lo pregunta y no encuentra
respuesta se va antes de registrarse.

SHALL decir además **qué aprende el niño** con ellas —cuánto tiene, cuánto le falta para lo que
quiere y qué pasó con lo que gastó—, que es lo que distingue esto de un contador de puntos.

NO SHALL apoyarse en cifras, testimonios ni respaldos de terceros: no los hay, e inventarlos en una
página pública es poner un aval falso.

#### Scenario: Alguien lee la página sin registrarse

- **WHEN** alguien abre la puerta pública y no interactúa
- **THEN** puede leer que la moneda no es dinero real y vive dentro de su familia
- **AND** puede leer qué aprende su hijo con ella

#### Scenario: No se afirma nada que no sea cierto

- **WHEN** se revisa lo que la página afirma
- **THEN** todo lo que dice es cierto de lo construido
- **AND** no hay cifras, testimonios ni logos de terceros

### Requirement: Lo que solo ilustra no se anuncia

Una imagen de la puerta pública que **no aporte nada que el texto no diga** SHALL ser decorativa y NO
SHALL anunciarse a quien recorre la página sin verla.

Es la otra cara de la regla que obliga a la visualización del ciclo a llevar nombre: aquella comunica
algo —el ciclo— y sin nombre se perdería; una ilustración que solo acompaña a un texto que ya lo dice
todo, anunciada, es la misma frase dos veces.

#### Scenario: La ilustración que acompaña a un texto

- **WHEN** alguien recorre la puerta pública sin verla
- **THEN** oye el texto una sola vez
- **AND** no oye la ilustración que lo acompaña

#### Scenario: Lo que sí comunica sigue anunciándose

- **WHEN** se recorre la puerta pública sin verla
- **THEN** la visualización del ciclo y la marca siguen teniendo nombre

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


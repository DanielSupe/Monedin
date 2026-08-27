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

#### Scenario: Alguien mira la página y no toca nada

- **WHEN** alguien abre la puerta pública y no interactúa
- **THEN** puede leer qué hace el producto y para quién es

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


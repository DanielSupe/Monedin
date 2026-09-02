## ADDED Requirements

### Requirement: La regla de estilos cubre todo el código, sin lista de deuda

La prohibición de estilos en línea y de colores escritos a mano SHALL aplicarse a todo el código del
front. NO SHALL existir una lista de pantallas exceptuadas por estar sin vestir.

Esa lista nació con `add-design-system` y con su propia condición de muerte escrita: cada change
borraba su línea, y al quedar vacía se borraba el bloque. Mantenerla vacía «por si acaso» sería dejar
abierta la puerta por la que se colaría la próxima pantalla sin vestir.

Sigue existiendo la excepción **legítima** —los archivos donde una medida se calcula y ningún token
puede expresarla—, que es otra cosa: se declara uno a uno y cada uno lleva escrito su porqué.

#### Scenario: Se añade una pantalla nueva sin vestir

- **WHEN** alguien escribe un estilo en línea o un color a mano en cualquier pantalla
- **THEN** falla la verificación
- **AND** no hay lista donde apuntarlo para que deje de fallar

#### Scenario: La excepción legítima

- **WHEN** una medida se calcula y ningún token puede expresarla
- **THEN** se declara uno a uno, con su justificación

### Requirement: Un número de negocio no se escribe a mano, ni siquiera dentro de un texto

Un valor con significado de negocio SHALL venir de su constante. NO SHALL escribirse como literal en
un componente ni **dentro de una cadena** del catálogo de textos.

Dentro de un texto es donde se escapa: «PIN de 4 dígitos» no parece un número de negocio, y lo es.
Tenerlo en dos sitios acaba con uno de los dos mintiendo el día que cambie, y el que miente es
siempre el texto, porque el código lo protege un esquema y al texto no lo protege nada.

La cifra SHALL componerse en el punto de uso, como ya se hace con el mínimo de la contraseña.

Esto SHALL comprobarse con un test, no con la memoria.

#### Scenario: Un texto que menciona una cantidad del dominio

- **WHEN** un texto del catálogo necesita decir cuántos dígitos tiene un PIN
- **THEN** la cifra sale de la constante y se compone al usarlo
- **AND** la cadena del catálogo no la contiene

#### Scenario: Un límite de longitud en un campo

- **WHEN** un campo declara su longitud máxima
- **THEN** el valor viene de una constante y no de un literal

#### Scenario: Cambia el límite

- **WHEN** se cambia el valor de la constante
- **THEN** el código y los textos dicen lo mismo, sin tocar nada más

### Requirement: Cuando se piden dos credenciales, se explica cada una

Una pantalla que pida dos credenciales a la vez SHALL decir para qué sirve cada una.

Sin eso parece un error del producto: quien lo mira no sabe si le están pidiendo lo mismo dos veces.
La regla ya se aplicó al registro; la vía de rescate del PIN pide exactamente lo mismo —la contraseña
para demostrar quién eres, y el PIN nuevo para lo que teclearás a partir de ahora— y no lo explicaba.

#### Scenario: Restablecer el PIN con la contraseña

- **WHEN** se pide la contraseña y un PIN nuevo en la misma pantalla
- **THEN** se explica qué papel tiene cada una

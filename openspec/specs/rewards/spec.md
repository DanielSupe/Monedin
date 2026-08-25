## Purpose

Define qué es un premio y cuánto le cuesta a cada hijo: cómo un padre lo publica, se lo pone a un
precio distinto a cada uno, lo corrige y lo retira, y qué ve el niño de todo eso —solo lo suyo, a su
precio, y sabiendo si ya le alcanza—, de modo que el saldo que gana con las tareas tenga por fin una
razón para existir.

## Requirements

### Requirement: Un padre publica un premio y le pone precio a cada hijo

El sistema SHALL permitir a un padre crear un premio indicando su título, opcionalmente una
descripción, y a qué hijos suyos se les ofrece con **qué precio en monedas para cada uno**.

El precio SHALL poder indicarse de dos formas, y SHALL cumplirse exactamente una: el mismo para todos
los hijos indicados, o uno distinto para cada uno. Un padre NO SHALL poder ofrecer un premio a hijos
que no sean suyos.

El premio SHALL existir **una sola vez** aunque se ofrezca a varios hijos. Es lo que hace que
corregir su título lo corrija para toda la familia, y lo que distingue un premio de una tarea: la
tarea se reparte en copias con vida propia, el premio se comparte.

#### Scenario: Se publica con el mismo precio para todos

- **WHEN** un padre crea un premio para dos hijos suyos con un mismo precio
- **THEN** queda un único premio con ese título
- **AND** los dos hijos lo tienen ofrecido a ese precio

#### Scenario: El mismo premio cuesta distinto a cada hijo

- **WHEN** un padre crea un premio indicando un precio propio para cada hijo
- **THEN** queda un único premio
- **AND** cada hijo lo tiene ofrecido al precio que le corresponde

#### Scenario: Las dos formas a la vez, o ninguna

- **WHEN** se intenta crear un premio indicando las dos formas de precio a la vez, o ninguna de las
  dos
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Un premio nace activo

- **WHEN** se crea un premio
- **THEN** puede pedirse desde el primer momento
- **AND** aparece en el escaparate de los hijos a los que se ofreció

#### Scenario: Un precio fuera del rango del producto

- **WHEN** se intenta crear un premio con un precio de cero monedas, negativo o por encima del máximo
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Un niño no publica premios

- **WHEN** el perfil activo es el de un niño e intenta crear un premio
- **THEN** la operación se rechaza por falta de permiso

### Requirement: Ofrecer un premio es todo o nada

Antes de crear ningún premio, el sistema SHALL comprobar que **todos** los hijos indicados existen,
están activos y pertenecen a quien publica. Si alguno no cumple, NO SHALL crearse el premio, ni
siquiera sin las asignaciones que fallaron.

Un premio publicado a medias es peor que uno fallido: el padre creería que sus tres hijos pueden
pedirlo cuando solo pueden dos, y nada en la interfaz se lo diría.

#### Scenario: Un hijo de otra familia entre los indicados

- **WHEN** un padre publica un premio para dos hijos suyos y uno de otra familia
- **THEN** la operación se rechaza como si ese hijo no existiera
- **AND** no queda creado ningún premio

#### Scenario: Un hijo dado de baja entre los indicados

- **WHEN** entre los hijos indicados hay uno dado de baja
- **THEN** la operación se rechaza
- **AND** no queda creado ningún premio

#### Scenario: Un identificador inexistente

- **WHEN** entre los hijos indicados hay un identificador que no existe
- **THEN** la respuesta es la misma que para un hijo de otra familia, sin permitir deducir cuál era
  el caso

#### Scenario: El mismo hijo repetido

- **WHEN** se indica dos veces al mismo hijo en la misma operación
- **THEN** la operación se rechaza como entrada inválida, en vez de dejarle dos precios

### Requirement: El padre ve su catálogo con lo que cuesta a cada hijo

El sistema SHALL ofrecer al padre sus premios paginados, y cada uno SHALL indicar **a qué hijos se
les ofrece y a qué precio a cada uno**. El listado SHALL poder filtrarse para ver solo los activos o
solo los retirados, y por defecto SHALL mostrar los activos.

#### Scenario: Un premio se ve con todos sus precios

- **WHEN** un padre lista su catálogo y uno de sus premios se ofrece a dos hijos a precios distintos
- **THEN** ese premio aparece una sola vez
- **AND** indica los dos hijos con el precio de cada uno

#### Scenario: Un premio sin ofrecer a nadie

- **WHEN** un padre lista su catálogo y uno de sus premios no se ofrece a ningún hijo
- **THEN** el premio aparece igualmente, sin ninguna asignación

#### Scenario: Se filtra por retirados

- **WHEN** un padre filtra por premios retirados
- **THEN** obtiene únicamente los que retiró
- **AND** sin filtro obtiene únicamente los activos

#### Scenario: El catálogo no cruza familias

- **WHEN** un padre lista su catálogo
- **THEN** no aparece ningún premio de otra familia

#### Scenario: Un niño no usa el catálogo del padre

- **WHEN** el perfil activo es el de un niño y pide el catálogo
- **THEN** la operación se rechaza por falta de permiso

### Requirement: El precio no vive en el premio, vive en la oferta a cada hijo

Un padre SHALL poder cambiar el título y la descripción de un premio suyo, y ese cambio SHALL
afectar a todos los hijos a los que se ofrece. El sistema NO SHALL aceptar un precio al editar el
premio: cambiar lo que cuesta es cambiar la oferta a un hijo concreto.

Si el precio viviera en el premio no habría forma de que el mayor pagara más que el menor, que es
justo lo que el producto quiere permitir.

#### Scenario: Se corrige el título

- **WHEN** un padre cambia el título de un premio ofrecido a dos hijos
- **THEN** los dos ven el título nuevo
- **AND** el precio de cada uno no cambia

#### Scenario: No se pone precio al editar el premio

- **WHEN** se intenta cambiar el precio enviándolo junto al título del premio
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Un niño no edita premios

- **WHEN** un niño intenta cambiar el título de un premio
- **THEN** la operación se rechaza por falta de permiso

### Requirement: Las ofertas de un premio se reemplazan en bloque

El sistema SHALL permitir a un padre fijar de una vez **el conjunto completo** de hijos a los que se
ofrece un premio, con el precio de cada uno. Al hacerlo, las ofertas que no estén en el conjunto
enviado SHALL dejar de existir, las nuevas SHALL crearse y las repetidas SHALL quedar con el precio
enviado. La operación SHALL ser todo o nada.

Se hace en bloque porque es una sola decisión del padre —quién puede pedir esto y por cuánto— y no
tres. Encadenar altas y bajas por hijo obligaría a la interfaz a calcular la diferencia y dejaría
estados a medias visibles si algo fallara por el camino.

#### Scenario: Se cambia quién puede pedirlo

- **WHEN** un premio se ofrecía a dos hijos y el padre envía un conjunto con solo uno de ellos
- **THEN** ese hijo lo sigue teniendo ofrecido
- **AND** el otro deja de verlo en su escaparate

#### Scenario: Se cambia el precio de un hijo

- **WHEN** el padre envía el mismo conjunto de hijos con un precio distinto para uno
- **THEN** ese hijo pasa a verlo a su precio nuevo
- **AND** el precio de sus hermanos no cambia

#### Scenario: Se retira la oferta a todos

- **WHEN** el padre envía un conjunto vacío
- **THEN** ningún hijo puede pedir el premio
- **AND** el premio sigue existiendo en el catálogo del padre

#### Scenario: Un hijo ajeno en el conjunto

- **WHEN** el conjunto enviado incluye un hijo que no es suyo
- **THEN** la operación se rechaza
- **AND** las ofertas del premio quedan exactamente como estaban

#### Scenario: Un premio de otra familia

- **WHEN** un padre intenta fijar las ofertas de un premio que no es suyo
- **THEN** la respuesta es la misma que para un premio inexistente

### Requirement: Retirar un premio lo saca del escaparate sin destruir nada

Un padre SHALL poder retirar un premio suyo. Retirarlo SHALL impedir que se pida y SHALL sacarlo del
escaparate de sus hijos, pero NO SHALL eliminar el premio ni sus ofertas ni ningún canje anterior: el
premio SHALL seguir siendo consultable por su padre.

#### Scenario: Se retira un premio activo

- **WHEN** un padre retira un premio suyo
- **THEN** deja de aparecer en el escaparate de sus hijos
- **AND** sigue apareciendo en su catálogo, marcado como retirado

#### Scenario: Se retira dos veces

- **WHEN** un padre intenta retirar un premio que ya estaba retirado
- **THEN** la respuesta es la misma que para un premio inexistente

#### Scenario: Un premio de otra familia

- **WHEN** un padre intenta retirar un premio que no es suyo
- **THEN** la respuesta es la misma que para un premio inexistente
- **AND** el premio sigue activo para su dueño

#### Scenario: Un niño no retira premios

- **WHEN** un niño intenta retirar un premio
- **THEN** la operación se rechaza por falta de permiso

### Requirement: El niño ve su escaparate y solo el suyo

El sistema SHALL ofrecer a un niño los premios **activos que se le ofrecen a él**, cada uno con su
título, su descripción si la tiene y **el precio que le corresponde a él**. Los premios ofrecidos
SHALL determinarse por la sesión y NUNCA por un identificador enviado en la petición.

Un niño NO SHALL poder ver el precio que le corresponde a un hermano, ni un premio que no se le
ofrece, ni uno retirado.

#### Scenario: El niño ve lo que puede pedir

- **WHEN** un niño con su perfil activo pide su escaparate
- **THEN** obtiene los premios que se le ofrecen con el precio que le toca a él

#### Scenario: El precio del hermano no se filtra

- **WHEN** un niño pide su escaparate y un premio se ofrece también a su hermano a otro precio
- **THEN** el premio aparece una vez, con el precio del niño que pregunta
- **AND** el precio del hermano no aparece en ninguna parte de la respuesta

#### Scenario: Un premio que no se le ofrece

- **WHEN** un niño pide su escaparate y su padre tiene premios ofrecidos solo a su hermano
- **THEN** esos premios no aparecen

#### Scenario: Un premio retirado

- **WHEN** su padre retira un premio que se le ofrecía
- **THEN** deja de aparecer en su escaparate

#### Scenario: El niño consulta un premio que no es suyo

- **WHEN** un niño pide el detalle de un premio que no se le ofrece
- **THEN** la respuesta es la misma que para un premio inexistente

#### Scenario: Un padre no usa el escaparate del niño

- **WHEN** el perfil activo es el del padre y pide la vista de escaparate propio
- **THEN** la operación se rechaza por falta de permiso

### Requirement: El escaparate dice si le alcanza

Cada premio del escaparate de un niño SHALL indicar si su saldo actual **alcanza para pedirlo**. Ese
dato SHALL calcularlo el sistema comparando el saldo del niño con el precio que le corresponde a él,
y NO SHALL depender de que quien pregunta lo calcule por su cuenta.

Es lo que convierte una lista de precios en una meta: el niño tiene que poder ver de un vistazo qué
está a su alcance hoy y qué le falta por ganar.

#### Scenario: Le alcanza

- **WHEN** un niño con 200 monedas pide su escaparate y hay un premio ofrecido a 150
- **THEN** ese premio aparece marcado como alcanzable

#### Scenario: No le alcanza

- **WHEN** ese mismo niño ve un premio ofrecido a 500
- **THEN** ese premio aparece marcado como no alcanzable
- **AND** aparece igualmente, porque saber lo que falta es parte de la meta

#### Scenario: Le alcanza justo

- **WHEN** el precio de un premio coincide exactamente con el saldo del niño
- **THEN** el premio aparece marcado como alcanzable

#### Scenario: El saldo sube y el escaparate lo refleja

- **WHEN** al niño se le aprueba una tarea que le deja alcanzar un premio que antes no alcanzaba
- **AND** vuelve a pedir su escaparate
- **THEN** ese premio aparece ya como alcanzable

### Requirement: Un premio ajeno responde como uno inexistente

Cuando un padre o un niño opere sobre un premio que no le corresponde, el sistema SHALL responder lo
mismo que si el premio no existiera, sin permitir distinguir los dos casos.

Distinguirlos confirmaría a un extraño que ese premio existe, que es la misma razón por la que un
hijo ajeno y una tarea ajena se tratan así.

#### Scenario: El padre opera sobre un premio de otra familia

- **WHEN** un padre consulta, edita o retira un premio de otra familia
- **THEN** la respuesta es indistinguible de la de un identificador inventado

#### Scenario: Ninguna respuesta revela al padre dueño

- **WHEN** se consulta cualquier premio o escaparate
- **THEN** la respuesta no contiene el identificador del padre dueño

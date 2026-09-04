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

### Requirement: El niño ve la foto del premio en su escaparate

Cuando un premio ofrecido a un niño tenga foto, su escaparate SHALL mostrarla. El sistema SHALL
entregarla resuelta y lista para pintarse, igual que un avatar, sin exponer la clave interna.

Un premio con foto NO SHALL cambiar en nada más lo que el niño ve: su precio sigue siendo el suyo, y
sigue sin ver el de sus hermanos.

#### Scenario: Un premio con foto en el escaparate

- **WHEN** un niño pide su escaparate y uno de los premios tiene foto
- **THEN** la respuesta trae una URL con la que mostrarla

#### Scenario: Un premio sin foto en el escaparate

- **WHEN** un niño pide su escaparate y un premio no tiene foto
- **THEN** la respuesta lo dice explícitamente y no trae ninguna dirección rota

#### Scenario: La foto no filtra el precio de un hermano

- **WHEN** un niño pide el escaparate de un premio ofrecido también a su hermano con otro precio
- **THEN** ve la misma foto y **solo** su propio precio

### Requirement: Lo que le falta a un niño para un premio se ve como progreso

Cuando un niño no alcance el precio de un premio, la distancia hasta él SHALL presentarse de forma
que se perciba **sin leer la cifra**, además de decirla.

Ver cuánto falta para una meta es lo que convierte un saldo en una decisión de ahorro, y es la mitad
del ciclo que el producto existe para enseñar. Una cifra dentro de una frase no dice si se está a un
paso o al principio: quien la lee tiene entre seis y once años.

Lo que se muestre SHALL anunciarse también a quien no ve la pantalla, con su valor y su meta.

#### Scenario: Un premio que todavía no alcanza

- **WHEN** se muestra un premio cuyo precio supera el saldo del niño
- **THEN** se percibe cuánto le falta sin leer el número
- **AND** la cifra exacta sigue estando

#### Scenario: Un premio que ya alcanza

- **WHEN** el saldo llega al precio
- **THEN** se ofrece pedirlo
- **AND** no se muestra distancia pendiente

#### Scenario: Con un lector de pantalla

- **WHEN** se recorre un premio que no alcanza
- **THEN** se anuncia cuánto lleva y cuánto cuesta

### Requirement: Un premio puede llevar una foto, desde el alta o editándolo

Un padre SHALL poder ponerle una foto a un premio suyo **al publicarlo** y también **editándolo**. El
sistema SHALL aceptar en el alta una clave de imagen ya subida, y SHALL confirmarla con las mismas
dos comprobaciones que cualquier otra: que la clave empiece por el prefijo de quien la sube y que el
objeto exista de verdad.

El requisito decía lo contrario, y su razón era de orden y no de producto: la imagen se guardaba bajo
una clave que incluye el identificador del premio, y ese identificador no existe mientras el premio
se está creando. Lo que cambia es **de qué cuelga la clave de una foto todavía sin dueño**: al
publicar, del padre que la sube, que sí existe. Publicar un premio es una operación de un padre con
perfil activo, así que hay a quién atribuirla.

Una imagen subida para un premio que luego no se publica SHALL quedar huérfana sin más
consecuencias, según la decisión ya cerrada de no borrar objetos huérfanos.

Un premio sin foto SHALL seguir siendo un premio completamente válido, en el catálogo y en el
escaparate.

#### Scenario: El padre publica un premio con foto

- **WHEN** un padre sube una imagen y publica un premio indicando esa clave
- **THEN** el premio queda creado con esa foto
- **AND** el catálogo del padre la muestra

#### Scenario: El padre le pone una foto a un premio suyo

- **WHEN** un padre sube una imagen y la confirma sobre un premio suyo
- **THEN** el premio queda con esa foto
- **AND** el catálogo del padre la muestra

#### Scenario: Un premio se publica sin foto

- **WHEN** un padre publica un premio sin foto
- **THEN** el premio queda creado y es válido
- **AND** aparece en el catálogo y en el escaparate de los hijos a los que se ofrece

#### Scenario: El alta rechaza una clave que no es de quien publica

- **WHEN** un padre publica un premio indicando la clave de una imagen subida por otra persona
- **THEN** la operación se rechaza como entrada inválida
- **AND** el premio no se crea

#### Scenario: El alta rechaza una clave de una imagen que no se subió

- **WHEN** un padre publica un premio indicando una clave con su propio prefijo pero sin objeto detrás
- **THEN** la operación se rechaza como entrada inválida
- **AND** el premio no se crea

#### Scenario: Se quita la foto de un premio

- **WHEN** un padre borra explícitamente la foto de un premio suyo
- **THEN** el premio se queda sin foto
- **AND** sigue siendo válido en el catálogo y en el escaparate

#### Scenario: Un niño no le pone foto a un premio

- **WHEN** un perfil de niño intenta subir o confirmar la foto de un premio
- **THEN** la operación se rechaza por falta de permiso

#### Scenario: Un niño no pide una vía de subida para publicar

- **WHEN** un perfil de niño pide una vía de subida de imagen de premio
- **THEN** la operación se rechaza por falta de permiso

#### Scenario: Un premio ajeno no admite foto

- **WHEN** un padre pide subir la foto de un premio de otra familia
- **THEN** la respuesta es la misma que para un premio inexistente
- **AND** no se entrega ninguna URL de subida

#### Scenario: Pedir una vía de subida no crea ningún premio

- **WHEN** un padre pide una vía de subida y no llega a publicar el premio
- **THEN** su catálogo sigue igual que antes
- **AND** la imagen subida no aparece en ningún premio

### Requirement: La vía de subida para publicar no pide un premio que aún no existe

El sistema SHALL ofrecer una vía de subida de imagen que NO exija identificar un premio, para poder
elegir la foto antes de publicarlo. SHALL exigir perfil de padre activo, y la clave que entregue
SHALL colgar de quien la pide y no de ningún premio.

Esa vía SHALL convivir con la que sí cuelga de un premio concreto, que sigue siendo la de editar uno
ya publicado. NO SHALL conformarse con la sesión de cuenta: publicar un premio ya exige perfil de
padre, así que la subida previa puede exigir lo mismo y la lista de operaciones que se conforman con
la cuenta SHALL quedar igual que estaba.

#### Scenario: El padre pide una vía de subida antes de publicar

- **WHEN** un padre con perfil activo pide una vía de subida de imagen de premio sin indicar ninguno
- **THEN** recibe una dirección de subida y la clave con la que confirmarla
- **AND** la clave cuelga de él y no de ningún premio

#### Scenario: Sin perfil de padre activo no hay vía de subida

- **WHEN** se pide esa vía de subida con la cuenta acreditada pero sin perfil de padre activo
- **THEN** la operación se rechaza por falta de sesión o de permiso

#### Scenario: La clave de un padre no le sirve a otro

- **WHEN** un padre publica un premio con la clave que recibió otro padre
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: La vía sin premio no tapa al detalle de un premio

- **WHEN** se piden por separado esa vía de subida y el detalle de un premio concreto
- **THEN** cada una responde lo suyo
- **AND** ninguna se interpreta como la otra

### Requirement: Un premio sin foto se dibuja con un respaldo, no con un hueco

Cuando un premio no tenga foto, las pantallas que lo muestran SHALL dibujar un respaldo visible en su
lugar. NO SHALL dejar el espacio vacío.

Vale tanto para el catálogo del padre como para el escaparate del niño. Un hueco donde el resto de
las filas tienen imagen se lee como algo que se rompió al cargar, no como un premio sin foto; y en
cuanto los premios se presenten como productos, una rejilla con huecos deja de ser una rejilla.

#### Scenario: Un premio sin foto en el escaparate del niño

- **WHEN** un niño mira un premio ofrecido a él que no tiene foto
- **THEN** ve un respaldo en el lugar de la imagen
- **AND** el premio sigue siendo pedible con normalidad

#### Scenario: Un premio sin foto en el catálogo del padre

- **WHEN** un padre mira en su catálogo un premio sin foto
- **THEN** ve un respaldo en el lugar de la imagen

#### Scenario: Un premio con foto no lleva respaldo

- **WHEN** un premio tiene foto
- **THEN** se muestra la foto
- **AND** no se muestra además el respaldo

### Requirement: El escaparate del niño se recorre como una rejilla, no como una lista

El escaparate del niño SHALL presentar sus premios en una **rejilla de más de una columna** en el
ancho habitual de una tablet, y NO SHALL presentarlos como una única columna de filas.

Un escaparate se recorre con los ojos y se compara de un vistazo. Una sola columna obliga a
desplazar para tener dos precios delante a la vez, que es exactamente lo que hay que hacer para
elegir entre dos premios — y elegir en qué gastar es la mitad del ciclo que el producto enseña.

Cada premio SHALL ser **una sola unidad**: su imagen o su respaldo, su título, su precio, si le
alcanza y su acción, sin que ninguna de esas partes se salga a otra parte de la pantalla. Cada uno
SHALL seguir siendo un elemento de una lista para quien recorre la pantalla sin verla.

La rejilla NO SHALL desbordar horizontalmente la pantalla en el ancho más estrecho que el producto
admite.

#### Scenario: El niño mira su escaparate

- **WHEN** un niño abre su escaparate con varios premios ofrecidos
- **THEN** cada premio se presenta como una unidad con su imagen, su título, su precio y su acción
- **AND** siguen anunciándose como una lista de elementos

#### Scenario: Un premio con foto y otro sin ella conviven en la rejilla

- **WHEN** en el escaparate hay un premio con foto y otro sin ella
- **THEN** los dos ocupan una posición equivalente en la rejilla
- **AND** el que no tiene foto muestra su respaldo, sin dejar hueco

#### Scenario: Un escaparate vacío

- **WHEN** un niño abre su escaparate y no se le ofrece ningún premio
- **THEN** ve el estado vacío del sistema y no una rejilla sin nada dentro

### Requirement: El escaparate dice cuántos premios hay antes de recorrerlo

El escaparate SHALL indicar **cuántos premios** se le ofrecen al niño, junto a su título y antes de
la rejilla.

En una rejilla, «cuántos hay» deja de leerse solo: una columna se recorre hasta el final y una
rejilla se abarca de un vistazo sin llegar a contarla. La cifra SHALL salir de las filas recibidas y
NO SHALL escribirse a mano en el texto.

#### Scenario: Se dice cuántos premios hay

- **WHEN** un niño abre su escaparate con premios ofrecidos
- **THEN** ve cuántos son

#### Scenario: Sin premios no se anuncia ninguna cifra

- **WHEN** el escaparate está vacío
- **THEN** no se anuncia una cuenta, solo el estado vacío

### Requirement: La imagen de un premio ocupa siempre la misma caja

Las pantallas que presentan premios SHALL reservar para su imagen una caja de **proporción fija**, la
misma para todos, y NO SHALL dejar que la altura de una tesela dependa de con qué foto se subió.

Es lo que el recorte hace posible y lo que la rejilla necesita: sin una proporción conocida, una
foto apaisada y una vertical dan dos teselas de alturas distintas y la fila queda dentada.

El respaldo de un premio sin foto SHALL ocupar exactamente esa misma caja, para que un premio sin
imagen no descuadre a sus vecinos.

Las fotos subidas **antes** de que se recortara SHALL seguir mostrándose sin romper nada: se encuadran
dentro de la caja, y NO SHALL reprocesarse ni volver a subirse.

#### Scenario: Dos premios con fotos de proporciones distintas

- **WHEN** un niño mira su escaparate con un premio de foto apaisada y otro de foto vertical
- **THEN** las dos teselas reservan la misma caja para la imagen

#### Scenario: Un premio sin foto no descuadra la rejilla

- **WHEN** en la rejilla hay un premio con foto y otro sin ella
- **THEN** el respaldo ocupa la misma caja que la imagen

#### Scenario: Una foto vieja se sigue viendo

- **WHEN** se muestra un premio cuya foto se subió sin recortar
- **THEN** se ve encuadrada en la caja, sin deformarse y sin que haya que volver a subirla

### Requirement: La tesela de un premio tiene un tope de ancho

Una tesela del escaparate SHALL tener un ancho máximo, y NO SHALL valer lo que valga su columna.

Sin tope, una rejilla de dos columnas en el ancho máximo del contenido da teselas de más de 450 px:
la foto de un producto ocupando media pantalla, que no es un escaparate sino una ficha. El tope
SHALL salir de un token del sistema, como cualquier otra medida.

Cuando haya sitio de sobra, el escaparate SHALL usar más columnas en vez de estirar las teselas. Eso
NO contradice que sean dos en una tablet: dos era el mínimo para comparar, y el motivo de no crecer
—que cada columna de más encogía la foto— deja de aplicar cuando la tesela tiene también un tope.

#### Scenario: Un escaparate en una pantalla ancha

- **WHEN** un niño abre su escaparate en una pantalla ancha
- **THEN** ninguna tesela supera el ancho máximo
- **AND** se usan más columnas en lugar de teselas más grandes

#### Scenario: Un escaparate estrecho sigue comparando de dos en dos

- **WHEN** un niño abre su escaparate en el ancho de una tablet
- **THEN** ve dos premios uno al lado del otro


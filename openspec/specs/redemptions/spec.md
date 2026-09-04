## Purpose

Permite que el niño solicite canjear un premio por sus monedas y que el padre resuelva esa
solicitud, aprobándola —lo que descuenta el precio congelado del saldo del niño— o rechazándola —lo
que no mueve ninguna moneda—. Es la mitad que faltaba del ciclo esfuerzo → ingreso → decisión de
gasto: sin esto, `affordable` en el escaparate del niño es una promesa sin forma de cumplirse.
## Requirements
### Requirement: El niño solicita el canje de un premio disponible para él

El sistema SHALL permitir a un actor `CHILD` solicitar el canje de un premio que existe, está
activo y le fue ofertado a él, congelando en la solicitud el precio de esa oferta en el momento de
solicitar. El sistema NO SHALL crear la solicitud si el premio no está disponible para ese niño, si
ya tiene una solicitud pendiente del mismo premio, o si su saldo actual no cubre el precio.

#### Scenario: Camino feliz

- **WHEN** un niño solicita un premio que existe, está activo, le fue ofertado y su saldo alcanza
- **THEN** se crea una solicitud en estado `PENDING` con `coins` igual al precio de la oferta en ese
  momento
- **AND** el saldo del niño no cambia todavía

#### Scenario: El premio no está disponible para ese niño

- **WHEN** un niño solicita un premio inexistente, retirado, o que nunca le fue ofertado a él
- **THEN** la solicitud responde 404 y no se crea ninguna fila

#### Scenario: Ya tiene una solicitud pendiente del mismo premio

- **WHEN** un niño solicita un premio para el que ya tiene otra solicitud en estado `PENDING`
- **THEN** la solicitud responde 409 y no se crea una segunda fila

#### Scenario: El saldo no alcanza al solicitar

- **WHEN** un niño solicita un premio cuyo precio supera su saldo actual
- **THEN** la solicitud responde 409 y no se crea ninguna fila

#### Scenario: Un padre no puede solicitar

- **WHEN** un actor `PARENT` intenta solicitar un canje
- **THEN** la solicitud responde 403

### Requirement: El padre aprueba un canje pendiente, lo que descuenta el precio congelado

El sistema SHALL permitir a un actor `PARENT`, dueño del niño que solicitó, aprobar una solicitud
en estado `PENDING`, lo que la deja en `APPROVED` y descuenta del saldo del niño exactamente el
precio congelado en la solicitud —nunca el precio vigente de la oferta, si cambió después—. El
sistema NO SHALL descontar el saldo dos veces por la misma solicitud, ni aprobar una solicitud cuyo
saldo, al momento de aprobar, ya no cubre el precio.

#### Scenario: Camino feliz

- **WHEN** el padre aprueba una solicitud `PENDING` de su hijo cuyo saldo sigue cubriendo el precio
- **THEN** la solicitud queda `APPROVED`
- **AND** el saldo del niño baja exactamente el precio congelado
- **AND** queda una fila de historial con ese movimiento asociada a la solicitud

#### Scenario: El precio pagado es el congelado, no el vigente

- **WHEN** el padre cambia el precio de la oferta de ese premio después de que el niño ya solicitó,
  y luego aprueba esa solicitud
- **THEN** el descuento es el precio que tenía la solicitud al crearse, no el precio nuevo de la
  oferta

#### Scenario: Doble tap sobre aprobar

- **WHEN** dos solicitudes de aprobación llegan a la vez para la misma solicitud `PENDING`
- **THEN** una responde 200 con la solicitud `APPROVED`
- **AND** la otra responde 409
- **AND** el saldo baja exactamente una vez

#### Scenario: El saldo ya no alcanza al aprobar, aunque alcanzaba al solicitar

- **WHEN** el padre aprueba una solicitud cuyo precio ya no cabe en el saldo actual del niño —por
  ejemplo, porque otro canje se aprobó mientras tanto—
- **THEN** la aprobación responde 409
- **AND** la solicitud sigue `PENDING`
- **AND** el saldo del niño no cambia

#### Scenario: Un niño no puede aprobar

- **WHEN** un actor `CHILD` intenta aprobar cualquier solicitud, incluida la suya
- **THEN** la solicitud responde 403

### Requirement: El padre rechaza un canje pendiente sin mover monedas

El sistema SHALL permitir a un actor `PARENT`, dueño del niño que solicitó, rechazar una solicitud
en estado `PENDING`, dejándola en `REJECTED` sin modificar el saldo del niño. `REJECTED` es un
estado terminal: el sistema NO SHALL permitir una segunda resolución sobre una solicitud ya resuelta.

#### Scenario: Camino feliz

- **WHEN** el padre rechaza una solicitud `PENDING` de su hijo
- **THEN** la solicitud queda `REJECTED`
- **AND** el saldo del niño no cambia
- **AND** no se escribe ninguna fila de historial de monedas para esa solicitud

#### Scenario: Rechazar una solicitud ya resuelta

- **WHEN** el padre intenta rechazar una solicitud que ya está `APPROVED` o `REJECTED`
- **THEN** la solicitud responde 409
- **AND** el estado y el saldo quedan como estaban

#### Scenario: Un niño no puede rechazar

- **WHEN** un actor `CHILD` intenta rechazar cualquier solicitud
- **THEN** la solicitud responde 403

### Requirement: Retirar el premio o la oferta no afecta un canje ya pendiente

El precio de una solicitud queda congelado al crearse. El sistema NO SHALL exigir, al aprobar o
rechazar, que el premio siga activo ni que la oferta al niño siga vigente: retirar un premio o
quitarle la oferta a un hijo, ya descrito en la capability `rewards` como una operación que "no
destruye ofertas ni canjes previos", deja intactas las solicitudes que ya existían sobre él.

#### Scenario: El premio se retira mientras el canje sigue pendiente

- **WHEN** el padre retira un premio después de que un hijo ya solicitó canjearlo, y luego aprueba
  esa solicitud
- **THEN** la aprobación se resuelve con normalidad, descontando el precio congelado

#### Scenario: Se le quita la oferta a ese hijo mientras el canje sigue pendiente

- **WHEN** el padre reemplaza el conjunto de ofertas de un premio quitando a un hijo que ya tenía
  una solicitud `PENDING` sobre ese premio, y luego resuelve esa solicitud
- **THEN** aprobarla o rechazarla se resuelve con normalidad, sin que la ausencia de la oferta lo
  impida

### Requirement: El padre ve su bandeja de canjes, paginada y filtrable

El sistema SHALL devolver al padre una lista paginada de las solicitudes de canje de sus propios
hijos, con filtro opcional por estado y por hijo. El sistema SHALL desempatar el orden por
identificador para que ninguna solicitud se pierda ni se repita entre páginas.

#### Scenario: Filtro por estado

- **WHEN** el padre pide su bandeja filtrando por `status=PENDING`
- **THEN** solo aparecen las solicitudes de sus hijos que están `PENDING`

#### Scenario: Filtro por hijo

- **WHEN** el padre pide su bandeja filtrando por un `childId` propio
- **THEN** solo aparecen las solicitudes de ese hijo

#### Scenario: Página posterior a la última

- **WHEN** el padre pide una página más allá del total de solicitudes que tiene
- **THEN** la respuesta es una lista vacía, no un error

#### Scenario: Aislamiento entre familias

- **WHEN** un padre pide su bandeja
- **THEN** ninguna solicitud de una familia distinta aparece en la respuesta

### Requirement: El niño ve solo sus propias solicitudes

El sistema SHALL devolver al niño una lista paginada de sus propias solicitudes de canje, tomando
el perfil de la sesión activa y nunca de un parámetro de la petición.

#### Scenario: No ve las de un hermano

- **WHEN** un niño pide su lista de canjes
- **THEN** ninguna solicitud de un hermano aparece en la respuesta

#### Scenario: El perfil viene de la sesión

- **WHEN** un niño pide su lista de canjes
- **THEN** el sistema usa el perfil de la sesión activa para filtrar, y ningún parámetro de la
  petición puede sustituirlo

### Requirement: Un canje ajeno o inexistente responde como si no existiera

Para no confirmar a un tercero que un identificador existe, toda operación sobre una solicitud de
canje que no pertenece a quien la pide —o que no existe— SHALL responder 404, nunca 403.

#### Scenario: El padre pide el detalle de un canje de otra familia

- **WHEN** un padre pide el detalle de una solicitud que no es de ninguno de sus hijos
- **THEN** la respuesta es 404

#### Scenario: El niño pide el detalle del canje de un hermano

- **WHEN** un niño pide el detalle de una solicitud que pertenece a un hermano
- **THEN** la respuesta es 404

#### Scenario: Aprobar o rechazar un canje ajeno

- **WHEN** un padre intenta aprobar o rechazar una solicitud que no es de ninguno de sus hijos
- **THEN** la respuesta es 404, y el estado de esa solicitud no cambia

### Requirement: El estado de un canje se distingue por su forma

En la lista de canjes de un niño, un canje **pendiente**, uno **aprobado** y uno **rechazado** SHALL
distinguirse entre sí sin leer el texto que los describe.

No son tres variantes de lo mismo. Aprobar descuenta; rechazar es terminal y **no devuelve nada**,
porque el descuento solo ocurre al aprobar. Esa asimetría es justo lo que un niño tiene que poder
ver, y presentarla como tres párrafos iguales la esconde.

#### Scenario: Tres canjes en estados distintos

- **WHEN** un niño ve un canje pendiente, uno aprobado y uno rechazado
- **THEN** los tres se distinguen a simple vista

#### Scenario: Un premio ya pedido en el escaparate

- **WHEN** un premio tiene una solicitud pendiente
- **THEN** el escaparate lo presenta como pedido
- **AND** no ofrece volver a pedirlo

### Requirement: Los canjes del niño se leen como un historial en filas alineadas

Los canjes del niño SHALL presentarse como **filas con las mismas columnas**, con el premio, la
cantidad, el estado y cuándo ocurrió en posiciones fijas, y NO SHALL presentarse como tarjetas
independientes.

Un historial no se explora, se repasa: lo que se hace con él es recorrer una columna hacia abajo
—cuánto costó cada cosa, cómo acabó cada una—, y para eso las mismas posiciones ganan a repetir la
etiqueta dentro de cada tarjeta. Es además el único de los tres destinos del niño donde **no hay nada
que hacer**, así que es el que menos sitio necesita por fila.

El historial SHALL anunciarse como datos tabulares a quien recorre la pantalla sin verla, con sus
encabezados de columna asociados a los valores. Un lector de pantalla es donde más se nota la
diferencia entre una tabla y una lista de párrafos.

Las cantidades SHALL alinearse verticalmente, con las cifras de ancho fijo que el sistema ya declara
para eso.

Los canjes SHALL ir del más reciente al más antiguo.

#### Scenario: El niño repasa lo que ha pedido

- **WHEN** un niño abre su historial de canjes con varios canjes
- **THEN** ve una fila por canje con el premio, la cantidad, el estado y cuándo
- **AND** las columnas se anuncian como encabezados de esos valores

#### Scenario: Del más reciente al más antiguo

- **WHEN** un niño tiene canjes de días distintos
- **THEN** el más reciente aparece primero

#### Scenario: Un historial vacío

- **WHEN** un niño no ha pedido nada todavía
- **THEN** ve el estado vacío del sistema y no una tabla con encabezados y ninguna fila

#### Scenario: El historial no ofrece acciones

- **WHEN** un niño mira su historial de canjes
- **THEN** ninguna fila ofrece cancelar, repetir ni modificar nada

### Requirement: Los tres estados de un canje siguen distinguiéndose en el historial

Cada fila del historial SHALL indicar el estado de su canje, y los tres SHALL distinguirse **entre
sí**, no solo estar escritos.

Rechazado SHALL seguir leyéndose como advertencia y NO como error: que un padre diga que no a un
premio no es algo que el niño hiciera mal. Aprobado SHALL leerse como éxito y pendiente como algo
todavía en curso.

Pasar de tarjetas a filas NO SHALL perder esta distinción, que es lo que `redesign-child-shop` dejó
establecido y sigue valiendo con otra forma.

#### Scenario: Los tres estados se distinguen

- **WHEN** un niño tiene un canje pendiente, uno aprobado y uno rechazado
- **THEN** los tres se distinguen entre sí y no solo por su texto
- **AND** el rechazado no se presenta como un error del niño

### Requirement: El historial dice cuántos canjes hay

El historial SHALL indicar **cuántos canjes** tiene el niño, junto a su título.

La cifra SHALL salir del total del listado, que aquí sí es la cifra: los canjes paginan **por fila**,
a diferencia de las tareas del padre, que paginan por reparto y cuyo total cuenta repartos y no
filas.

#### Scenario: Se dice cuántos canjes hay

- **WHEN** un niño abre su historial con canjes
- **THEN** ve cuántos son


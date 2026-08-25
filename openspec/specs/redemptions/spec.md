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

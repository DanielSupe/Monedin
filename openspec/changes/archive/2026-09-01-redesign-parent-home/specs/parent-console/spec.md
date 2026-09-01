## ADDED Requirements

### Requirement: El inicio del padre dice qué le espera, no repite su barra

El inicio del padre SHALL informar de lo que requiere su atención. NO SHALL limitarse a ofrecer los
mismos destinos que el marco ya ofrece en su barra de navegación.

Un padre entra a Monedín para revisar lo que sus hijos han hecho. Un inicio que enumera «Tareas,
Premios, Canjes, Hijos» le hace abrir pantallas para averiguar si hay algo, cuando esa pregunta se
responde con dos números.

El panel SHALL enseñar, como mínimo:

- cuántas tareas están a la espera de aprobación,
- cuántos canjes están a la espera de respuesta,
- el saldo de cada hijo.

#### Scenario: Un destino que el marco ya ofrece

- **WHEN** se compara lo que enseña el inicio del padre con lo que ofrece la barra de su marco
- **THEN** el inicio no es el mismo conjunto de destinos
- **AND** enseña al menos un dato que la barra no puede enseñar

#### Scenario: Hay trabajo esperando

- **WHEN** dos tareas están en `COMPLETED` y un canje está en `PENDING`
- **THEN** el panel dice que hay dos tareas por aprobar y un canje esperando

### Requirement: Cada bandeja del panel lleva a su listado ya filtrado

Un aviso del panel SHALL navegar al listado correspondiente **con el filtro aplicado**: las tareas
por aprobar a `/tasks` con estado `COMPLETED`, los canjes pendientes a `/redemptions` con estado
`PENDING`.

Llevar al listado sin filtro obligaría al padre a repetir a mano la búsqueda que el panel acaba de
hacer por él. Que se pueda hacer es consecuencia de que el filtro y la página de un listado viajen en
la dirección; el panel es el primer sitio que lo aprovecha.

El panel NO SHALL aprobar ni rechazar nada. Resolver es trabajo de la bandeja.

#### Scenario: Se pulsa el aviso de tareas

- **WHEN** el padre pulsa «tareas por aprobar»
- **THEN** llega al listado de tareas filtrado por `COMPLETED`
- **AND** el filtro es visible en la dirección

#### Scenario: Se pulsa el aviso de canjes

- **WHEN** el padre pulsa «canjes esperando»
- **THEN** llega a la bandeja de canjes filtrada por `PENDING`

### Requirement: Las tareas por aprobar se cuentan por fila, no por reparto

La cifra de tareas a la espera de aprobación SHALL ser el número de **tareas** en `COMPLETED`. NO
SHALL tomarse del `total` de la página de repartos, y NO SHALL contar todas las filas que la
respuesta traiga.

El listado del padre pagina por REPARTO y, al filtrar por estado, devuelve **el reparto entero**: el
padre quiere ver el grupo completo aunque solo una de sus tareas esté para aprobar. De ahí salen dos
cifras equivocadas y ninguna de las dos avisa:

- el `total` cuenta repartos, así que un reparto con tres hermanos esperando diría «1»;
- las filas vienen sin filtrar por estado, así que contarlas todas diría «3» aunque solo una esté
  en `COMPLETED`.

La cifra correcta se obtiene contando, entre las filas recibidas, las que están en `COMPLETED`.

#### Scenario: Un reparto con hermanos en estados distintos

- **WHEN** existe un solo reparto con tres tareas, una en `PENDING`, una en `COMPLETED` y una en
  `APPROVED`
- **THEN** el panel dice que hay **una** tarea por aprobar
- **AND** no dice una por el reparto ni tres por sus filas

#### Scenario: Dos repartos con dos hermanos esperando cada uno

- **WHEN** dos repartos distintos tienen dos tareas en `COMPLETED` cada uno
- **THEN** el panel dice que hay cuatro tareas por aprobar

### Requirement: Una cifra que puede quedarse corta se declara, no se redondea

Cuando lo contado no alcance para responder con exactitud —porque la respuesta llegó paginada y hay
más páginas—, el panel SHALL presentar la cifra como un mínimo y NO SHALL presentarla como exacta.

Un número que dice «3» cuando son cuatro es peor que no dar número: el padre deja de mirar cuando lo
ve a cero. Marcar el mínimo cuesta un carácter.

#### Scenario: Caben todos los repartos en una página

- **WHEN** todos los repartos con tareas por aprobar entran en la página pedida
- **THEN** la cifra se presenta como exacta

#### Scenario: Hay más repartos de los que caben

- **WHEN** quedan repartos fuera de la página pedida
- **THEN** la cifra se presenta como un mínimo

### Requirement: Los saldos del panel cubren a toda la familia en una sola página

El panel SHALL enseñar el saldo de **todos** los hijos, sin paginar ni recortar.

Se apoya en que el máximo de hijos de una familia sea menor o igual que el tamaño de página por
defecto. Esa relación entre dos constantes SHALL estar comprobada por un test: si algún día el máximo
sube por encima del tamaño de página, el panel empezaría a esconder hijos sin que nada fallara.

#### Scenario: Una familia en el máximo de hijos

- **WHEN** una familia tiene el máximo de hijos que el producto permite
- **THEN** el panel enseña el saldo de todos ellos

#### Scenario: El máximo sube por encima del tamaño de página

- **WHEN** el máximo de hijos por familia supera el tamaño de página por defecto
- **THEN** falla un test

### Requirement: No tener nada pendiente es una respuesta, no una lista vacía

Cuando no haya tareas por aprobar ni canjes esperando, el panel SHALL decirlo con una sola frase. NO
SHALL enseñar avisos con cero.

Un panel con dos ceros obliga a leer dos cifras para concluir lo que una frase dice de un vistazo. Y
estar al día es la situación normal, no un caso degenerado: es lo que el padre ve la mayoría de los
días que abre la aplicación.

#### Scenario: Nada pendiente

- **WHEN** no hay tareas en `COMPLETED` ni canjes en `PENDING`
- **THEN** el panel lo dice en una frase
- **AND** no aparece ningún aviso con cero

#### Scenario: Solo una de las dos bandejas tiene algo

- **WHEN** hay canjes esperando pero ninguna tarea por aprobar
- **THEN** aparece el aviso de canjes
- **AND** no aparece un aviso de cero tareas

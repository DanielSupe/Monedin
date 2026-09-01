# parent-console Specification

## Purpose
TBD - created by archiving change redesign-parent-home. Update Purpose after archive.
## Requirements
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

### Requirement: Un conflicto se cuenta como advertencia, no como error

Cuando una operación de la bandeja falle con `CONFLICT`, la interfaz SHALL presentarlo como
advertencia. NO SHALL presentarlo con el mismo tratamiento que un error de validación o un fallo del
servidor.

Un 409 en estas pantallas significa exactamente una cosa: **alguien se adelantó**. El padre aprobó
dos veces, o resolvió desde otro dispositivo. Nadie hizo nada mal, y pintarlo de rojo le echa la
culpa a quien está mirando. Es la distinción que la API entera protege con transiciones condicionales
y comprobación de filas afectadas, y la que `Alert` declara en su propia cabecera desde
`add-design-system`.

Los tonos SHALL distinguirse entre sí, no solo el texto.

#### Scenario: Se aprueba dos veces la misma tarea

- **WHEN** la segunda aprobación devuelve `CONFLICT`
- **THEN** el aviso aparece en tono de advertencia
- **AND** su tratamiento es distinto del de un error

#### Scenario: Falla la aprobación por otra causa

- **WHEN** la operación devuelve un error que no es `CONFLICT`
- **THEN** el aviso aparece en tono de error

### Requirement: Cada fila ofrece solo lo que su estado permite

Una fila de la bandeja SHALL ofrecer únicamente las acciones que su estado admite: aprobar y rechazar
solo sobre lo que está a la espera de resolución, y borrar una tarea solo mientras siga sin marcar.

Ofrecer una acción que la API va a rechazar con 409 o 422 no es tolerancia: es prometer algo que no
se puede cumplir. Lo que se ve y lo que se puede hacer van juntos, igual que en las pantallas del
niño.

#### Scenario: Una tarea ya aprobada

- **WHEN** la bandeja enseña una tarea en `APPROVED`
- **THEN** no ofrece aprobarla ni rechazarla

#### Scenario: Un canje ya resuelto

- **WHEN** la bandeja enseña un canje en `APPROVED` o en `REJECTED`
- **THEN** no ofrece resolverlo otra vez

### Requirement: La evidencia se ve antes de decidir

Cuando una tarea traiga foto, la bandeja SHALL mostrarla **antes** de las acciones de aprobar y
rechazar.

Es para decidir con ella, no para mirarla después de haber decidido. Un padre que aprueba y luego ve
la foto ya acreditó las monedas, y corregir eso exige un movimiento compensatorio.

#### Scenario: Una tarea con foto esperando aprobación

- **WHEN** la bandeja enseña una tarea completada con evidencia
- **THEN** la foto aparece antes de los botones de resolver

### Requirement: Un reparto filtrado explica por qué enseña lo que no casa

Cuando el listado esté filtrado por estado y un reparto contenga tareas que no casan con ese filtro,
la interfaz SHALL decir que el reparto se enseña entero.

Es deliberado —el padre quiere ver el grupo completo aunque solo una tarea esté para aprobar— y hoy
no se dice en ninguna parte, así que filtrar por «Por aprobar» y ver tareas pendientes se lee como un
filtro roto. Una decisión de producto que no se explica en pantalla es indistinguible de un defecto.

#### Scenario: Se filtra por «por aprobar» y el reparto tiene hermanas en otro estado

- **WHEN** un reparto entra en la lista por una de sus tareas y las demás están en otro estado
- **THEN** se enseñan también las que no casan
- **AND** la pantalla explica que el reparto se enseña completo

#### Scenario: Sin filtro

- **WHEN** el listado no está filtrado por estado
- **THEN** esa explicación no aparece

### Requirement: El filtro de un listado es un conjunto de direcciones, no de botones

Las opciones de filtro SHALL ser enlaces a la dirección correspondiente, con la activa marcada como
página actual. NO SHALL ser controles que cambien un estado local.

El filtro ya viaja en la dirección, así que cada opción **es** una dirección: convertirla en un botón
perdería abrirla en otra pestaña y copiar el enlace de lo que se está mirando, sin ganar nada. Es la
misma razón por la que navegar es trabajo de un enlace.

Cambiar de filtro SHALL volver a la primera página.

#### Scenario: Se recorre el filtro con el teclado

- **WHEN** alguien tabula por las opciones de filtro
- **THEN** cada una es un enlace
- **AND** la que corresponde al filtro vigente se anuncia como la actual

#### Scenario: Se cambia de filtro desde una página avanzada

- **WHEN** el listado está en la página 4 y se elige otro filtro
- **THEN** el listado abre en la página 1

### Requirement: Elegir a quién y por cuánto se resuelve en un solo sitio

Repartir una tarea y publicar un premio piden lo mismo: **a qué hijos** y **cuántas monedas a cada
uno**, con los dos modos —el mismo valor para todos, o uno por hijo—. Eso SHALL resolverse con una
pieza compartida. NO SHALL escribirse una vez por pantalla.

Hoy está escrito tres veces: entero en las dos altas, casi línea por línea, y una tercera vez dentro
del catálogo para reasignar precios. Tres copias de la misma decisión de negocio es cómo una de ellas
acaba comportándose distinto sin que nadie lo note.

La pieza SHALL exigir que se elija al menos un hijo antes de enviar, y SHALL decirlo antes de
rechazar y no después.

#### Scenario: Se reparte una tarea y se publica un premio

- **WHEN** se comparan las dos pantallas de alta
- **THEN** eligen hijos y precios con la misma pieza
- **AND** se comportan igual en los dos modos

#### Scenario: Se cambia al modo de precio por hijo

- **WHEN** se pasa de «el mismo valor» a «uno por hijo»
- **THEN** cada hijo elegido pide su propia cantidad

#### Scenario: No se ha elegido a nadie

- **WHEN** se intenta guardar sin ningún hijo elegido
- **THEN** se explica qué falta
- **AND** no se envía nada al servidor

### Requirement: Una pantalla de escritura es un formulario

Toda pantalla donde el padre escriba SHALL ser un `<form>` con su botón de envío. NO SHALL ser un
contenedor con un botón que llama a una función.

Escribir un título y pulsar Enter es lo que hace cualquiera, y hoy no hace nada en dos de las tres:
son un `<section>` con un `type="button"`. La tercera sí es un formulario, así que la misma acción
responde distinto según la pantalla dentro del mismo producto.

#### Scenario: Se envía con el teclado

- **WHEN** el padre escribe en un campo y pulsa Enter
- **THEN** el formulario se envía

#### Scenario: Falta algo

- **WHEN** el envío no pasa la validación
- **THEN** se explica qué falta
- **AND** no se llama al servidor

### Requirement: Un premio se edita donde se ve

Editar el título, la foto y los precios de un premio SHALL ocurrir en el propio catálogo, sin cambiar
de dirección.

Es un retoque pequeño y frecuente —subir un precio, cambiar una foto—, y sacarlo a otra pantalla
obliga a ir y volver por cada cambio.

Queda anotada la asimetría con los perfiles de hijo, que sí se editan en su propia ruta:
`redesign-parent-children` es quien mira esa otra mitad y quien decide si se unifican.

#### Scenario: Se cambia el precio de un premio

- **WHEN** el padre edita lo que ofrece un premio
- **THEN** lo hace sin salir del catálogo

#### Scenario: Se abandona la edición

- **WHEN** el padre deja de editar sin guardar
- **THEN** el premio se ve como estaba

### Requirement: Una acción irreversible se confirma con un diálogo

Dar de baja un perfil de hijo SHALL confirmarse con el diálogo modal del sistema. NO SHALL
confirmarse con un párrafo y dos botones dentro de la fila.

La baja no se puede deshacer y lo dice su propio mensaje. Un diálogo atrapa el foco, cierra con
Escape y marca inerte el resto del documento; un párrafo con dos botones no hace nada de eso, y deja
la acción destructiva a un toque de distancia de la fila del hijo de al lado.

Es además lo que ya hace la retirada de un premio, que pesa menos: retirar se puede revertir
publicando otra vez, y dar de baja no.

#### Scenario: Se pide la baja de un perfil

- **WHEN** el padre pulsa dar de baja
- **THEN** se abre un diálogo que explica que no se puede deshacer
- **AND** el foco queda dentro hasta que decida

#### Scenario: Se cierra sin confirmar

- **WHEN** el padre cierra el diálogo con Escape
- **THEN** el perfil sigue como estaba

### Requirement: El estado de un perfil se lee como estado, no como error

Un perfil bloqueado SHALL señalarse con la etiqueta de estado del sistema, en tono de advertencia. NO
SHALL señalarse con un color escrito a mano dentro de una frase.

Estar bloqueado significa que ese niño falló el PIN varias veces. No es una avería ni una culpa del
padre, y el rojo se lo dice. Es el mismo criterio con el que un canje rechazado va en ámbar.

El tono acompaña al texto y nunca lo sustituye.

#### Scenario: Un perfil bloqueado en el listado

- **WHEN** un hijo tiene el perfil bloqueado
- **THEN** se ve con la etiqueta de estado en advertencia
- **AND** su significado se lee también sin distinguir el color

### Requirement: Reponer el PIN de un hijo es un formulario

Reponer el PIN de un hijo desde el listado SHALL ser un `<form>` con su envío. NO SHALL ser un campo
suelto con un botón al lado.

Es la misma regla que `redesign-parent-authoring` aplicó a las tres pantallas de escritura: teclear
cuatro dígitos y pulsar Enter es lo que hace cualquiera.

#### Scenario: Se repone el PIN con el teclado

- **WHEN** el padre escribe el PIN nuevo y pulsa Enter
- **THEN** se envía

### Requirement: Cada perfil enseña lo que el padre necesita para decidir

La fila de un hijo SHALL mostrar su avatar, su nombre, su saldo y su estado, y ofrecer solo las
acciones que su estado permite: desbloquear únicamente si está bloqueado.

Ofrecer desbloquear un perfil que no lo está es prometer algo que no hace nada, que es la misma regla
que gobierna las dos bandejas.

#### Scenario: Un perfil que no está bloqueado

- **WHEN** el listado enseña un hijo sin bloquear
- **THEN** no ofrece desbloquearlo

#### Scenario: El saldo de cada hijo

- **WHEN** el padre mira su listado de perfiles
- **THEN** ve el saldo de cada uno con la pieza de monedas


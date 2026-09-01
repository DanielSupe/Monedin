## ADDED Requirements

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

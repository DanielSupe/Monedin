## ADDED Requirements

### Requirement: El estado de una tarea se distingue por su forma

En la lista de tareas de un niño, una tarea **pendiente**, una **esperando revisión** y una **ya
pagada** SHALL distinguirse entre sí sin leer el texto que las describe.

Las tres son momentos distintos del ciclo que el producto enseña, y el sistema protege esas
transiciones con condiciones y comprobaciones de fila afectada. Presentarlas como tres párrafos
iguales dentro de rectángulos iguales tira esa distinción justo donde el niño la necesita.

Lo que cada estado permite hacer SHALL corresponderse con lo que se ve: solo una tarea pendiente
ofrece marcarla.

#### Scenario: Tres tareas en estados distintos

- **WHEN** un niño ve una tarea pendiente, una esperando revisión y una aprobada
- **THEN** las tres se distinguen a simple vista
- **AND** solo la pendiente ofrece marcarla

#### Scenario: Una tarea ya pagada

- **WHEN** se muestra una tarea aprobada
- **THEN** se ve cuántas monedas dio
- **AND** no se ofrece volver a marcarla

## ADDED Requirements

### Requirement: Aprobar y rechazar no pesan lo mismo

En la bandeja del padre, aprobar SHALL presentarse como la acción principal y rechazar SHALL
acompañarla con menos peso visual. Las dos NO SHALL ofrecerse con la misma forma.

Aprobar es lo único que mueve monedas: es la mitad autorizadora del ciclo y el paso del que depende
todo lo que el producto enseña. Rechazar devuelve la tarea a pendiente y no mueve nada.

Rechazar NO SHALL presentarse como una acción peligrosa. Devolver una tarea a pendiente no destruye
nada y no es un error de nadie: pintarlo como un peligro enseñaría a un padre a evitarlo, y rechazar
una tarea mal hecha es parte de que el ciclo signifique algo.

#### Scenario: Una tarea espera revisión

- **WHEN** se muestran las dos acciones sobre una tarea por aprobar
- **THEN** aprobar se distingue como la principal
- **AND** rechazar se ofrece con menos peso, sin parecer destructivo

#### Scenario: Quien no ve la pantalla recorre las dos acciones

- **WHEN** se recorre la fila con un lector de pantalla
- **THEN** cada acción dice sobre qué tarea y sobre qué hijo actúa
- **AND** no se distinguen solo por el orden en que aparecen

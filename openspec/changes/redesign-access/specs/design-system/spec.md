## ADDED Requirements

### Requirement: El campo de texto admite una forma de píldora con icono

La pieza que dibuja una entrada de texto SHALL ofrecer, como opción declarada, una forma de píldora
con sitio para un icono a su izquierda. La forma por defecto SHALL seguir siendo la de hoy.

Igual que con la forma del avatar, la variante SHALL vivir en la pieza y NO SHALL poder imponerse
desde el punto de uso con clases: el utilitario que une clases en este proyecto no resuelve
conflictos entre utilidades de Tailwind.

Un icono dentro del campo SHALL ser decorativo: lo que nombra al campo es su etiqueta.

#### Scenario: Una pantalla no pide forma

- **WHEN** se usa la pieza sin indicar forma
- **THEN** se dibuja como hasta ahora

#### Scenario: Un campo con icono

- **WHEN** se dibuja un campo en píldora con un icono
- **THEN** el icono no se anuncia como contenido
- **AND** el campo sigue nombrándose por su etiqueta

### Requirement: Una acción representada solo por un símbolo lleva nombre

Un control cuyo contenido visible sea únicamente un símbolo SHALL declarar un nombre accesible que
diga qué hace.

Una flecha sola no dice si envía, avanza o vuelve.

#### Scenario: El envío de un formulario es una flecha

- **WHEN** el control que envía el formulario muestra solo una flecha
- **THEN** se anuncia con un nombre que dice qué hace

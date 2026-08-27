## ADDED Requirements

### Requirement: El avatar admite más de una forma

La pieza que dibuja un avatar SHALL ofrecer su forma como una opción declarada, y NO SHALL fijar una
sola. La forma por defecto SHALL seguir siendo la de hoy, para que ninguna pantalla existente cambie
sin pedirlo.

La forma SHALL ser una opción de la pieza y NO SHALL poder imponerse desde fuera con clases: el
utilitario que une clases en este proyecto no resuelve conflictos entre utilidades de Tailwind, así
que un radio pasado desde el punto de uso gana o pierde según el orden en que se genere el CSS. Eso
es un fallo que no se ve al leer el código y que puede cambiar entre compilaciones.

#### Scenario: Una pantalla no pide forma

- **WHEN** se usa la pieza sin indicar forma
- **THEN** se dibuja con la forma de siempre

#### Scenario: Una pantalla pide otra forma

- **WHEN** se indica una forma distinta
- **THEN** la pieza se dibuja con esa forma
- **AND** las demás pantallas no cambian

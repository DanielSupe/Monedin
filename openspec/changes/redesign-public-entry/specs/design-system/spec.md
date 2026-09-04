## ADDED Requirements

### Requirement: La acción principal admite una talla mayor

El sistema SHALL ofrecer una talla mayor para una acción, además de la de por defecto, y la pieza de
acción SHALL declararla como una **opción suya**. NO SHALL conseguirse desde fuera con utilidades
sueltas sobre el botón.

Una llamada a la acción de una página que convence no puede pesar lo mismo que el botón de un
formulario que ya se está rellenando: en la primera hay que encontrarla, en el segundo ya se está
mirando.

Se declara en la pieza y no en el punto de uso por lo mismo que la forma del avatar: `cx` no fusiona
utilidades de Tailwind, así que un tamaño pasado desde fuera junto al de la pieza lo resuelve el
orden del CSS generado y no el del código.

La talla SHALL salir de los tokens, y el enlace que se ve como una acción SHALL poder pedirla igual
que el botón — son la misma decisión vista desde dos elementos.

#### Scenario: Una acción en su talla mayor

- **WHEN** se monta la acción pidiendo la talla mayor
- **THEN** rinde más grande que la de por defecto
- **AND** sigue siendo la misma pieza

#### Scenario: Un enlace que se ve como una acción

- **WHEN** un enlace pide verse como una acción en su talla mayor
- **THEN** se ve igual que el botón en esa talla
- **AND** sigue siendo un enlace

#### Scenario: La talla está en el catálogo vivo

- **WHEN** se abre el catálogo de piezas
- **THEN** la acción aparece en sus dos tallas

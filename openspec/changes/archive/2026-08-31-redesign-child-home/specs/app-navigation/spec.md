## ADDED Requirements

### Requirement: Un archivo de ruta monta el destino, no lo dibuja

Un archivo de ruta SHALL declarar su guarda, sus parámetros y qué componente monta. NO SHALL contener
la pantalla, ni decidir con un condicional cuál de varias enseñar.

Es la misma regla que ya gobierna `features/`, aplicada un nivel más arriba. Una pantalla dentro de
un archivo de ruta no se puede probar sin router, no se puede reutilizar desde otro destino, y crece
hasta que nadie recuerda que ese archivo era una ruta.

Elegir por rol SHALL seguir siendo legítimo —el destino es el mismo y quien lo abre no—, pero lo
elegido SHALL vivir fuera.

#### Scenario: Un destino que sirve a dos roles

- **WHEN** una dirección muestra una pantalla distinta según quién opere
- **THEN** el archivo de ruta elige entre componentes
- **AND** ninguno de esos componentes está definido en él

#### Scenario: Se abre el inicio con cada rol

- **WHEN** entra un niño a su inicio
- **THEN** ve su pantalla
- **WHEN** entra un padre al suyo
- **THEN** ve la suya, y ninguno ve la del otro

## ADDED Requirements

### Requirement: El marco no muestra el saldo

El marco de navegación NO SHALL mostrar el saldo de un niño de forma permanente. El saldo SHALL vivir
en el inicio —donde ya es el elemento más grande— y en su historial.

Tenerlo delante en todas las pantallas convierte la navegación en un tablero de puntuación. El inicio
es el sitio donde el niño mira su saldo a propósito; en las otras pantallas está haciendo otra cosa, y
un número que le sigue a todas partes le dice que lo que importa es la cifra y no lo que está
haciendo.

Donde el saldo decide algo, la pantalla ya lo dice mejor que una cifra suelta: en el escaparate cada
premio anuncia lo que le falta, que es la forma útil del mismo dato.

#### Scenario: El niño recorre sus pantallas

- **WHEN** un niño navega entre sus destinos
- **THEN** su saldo no aparece en el marco en ninguno de ellos

#### Scenario: El niño quiere ver su saldo

- **WHEN** un niño quiere saber cuánto tiene
- **THEN** lo ve en su inicio como el elemento más grande de la pantalla
- **AND** desde ahí puede abrir de dónde salió cada moneda

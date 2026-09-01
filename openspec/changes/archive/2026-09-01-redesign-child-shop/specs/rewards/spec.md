## ADDED Requirements

### Requirement: Lo que le falta a un niño para un premio se ve como progreso

Cuando un niño no alcance el precio de un premio, la distancia hasta él SHALL presentarse de forma
que se perciba **sin leer la cifra**, además de decirla.

Ver cuánto falta para una meta es lo que convierte un saldo en una decisión de ahorro, y es la mitad
del ciclo que el producto existe para enseñar. Una cifra dentro de una frase no dice si se está a un
paso o al principio: quien la lee tiene entre seis y once años.

Lo que se muestre SHALL anunciarse también a quien no ve la pantalla, con su valor y su meta.

#### Scenario: Un premio que todavía no alcanza

- **WHEN** se muestra un premio cuyo precio supera el saldo del niño
- **THEN** se percibe cuánto le falta sin leer el número
- **AND** la cifra exacta sigue estando

#### Scenario: Un premio que ya alcanza

- **WHEN** el saldo llega al precio
- **THEN** se ofrece pedirlo
- **AND** no se muestra distancia pendiente

#### Scenario: Con un lector de pantalla

- **WHEN** se recorre un premio que no alcanza
- **THEN** se anuncia cuánto lleva y cuánto cuesta

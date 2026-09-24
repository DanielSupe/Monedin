## ADDED Requirements

### Requirement: El escaparate anuncia cuál es la meta más cercana

El escaparate de un niño SHALL destacar el premio más barato de los que todavía no alcanza, con lo
que le falta para él.

Cada premio ya dice cuánto le falta, pero ninguno dice cuál está más cerca, y esa es la pregunta que
convierte un saldo en una decisión de ahorro: no «cuánto tengo» sino «qué consigo antes».

Cuando dos premios que no alcanza cuesten lo mismo, el desempate SHALL ser estable entre cargas. Sin
desempate, la meta destacada cambiaría entre dos recargas sin que haya pasado nada.

Los dos casos en los que no hay meta SHALL distinguirse entre sí y del caso normal:

- Si le alcanzan **todos** los premios, no hay meta pendiente y la pantalla lo celebra en vez de dejar
  un hueco.
- Si **no hay ningún premio** para él, no se destaca nada: es una situación distinta y se lee distinta.

#### Scenario: Al niño le faltan monedas para varios premios

- **WHEN** se muestra su escaparate
- **THEN** se destaca el más barato de los que no alcanza
- **AND** se dice cuánto le falta para ese

#### Scenario: Dos premios que no alcanza cuestan lo mismo

- **WHEN** hay empate en el precio más bajo de los que no alcanza
- **THEN** el destacado es el mismo en cargas sucesivas

#### Scenario: Al niño le alcanzan todos los premios

- **WHEN** ningún premio de su escaparate está fuera de su alcance
- **THEN** no se destaca ninguna meta
- **AND** la pantalla lo dice, en vez de dejar el sitio vacío

#### Scenario: El niño no tiene premios ofrecidos

- **WHEN** no hay ningún premio para él
- **THEN** no se destaca ninguna meta
- **AND** se distingue del caso en que le alcanzan todos

## ADDED Requirements

### Requirement: La página despeja que la moneda no es dinero real

La puerta pública SHALL decir, sin que haga falta ninguna interacción, que las monedas de Monedín no
son dinero real: que no hay pagos, que no salen ni entran de ninguna cuenta y que no se comparten con
otras familias.

Es lo primero que piensa un adulto al leer «monedas» y «premios» en una aplicación para su hijo, y
hasta ahora la página no lo contestaba en ninguna parte. Quien se lo pregunta y no encuentra
respuesta se va antes de registrarse.

SHALL decir además **qué aprende el niño** con ellas —cuánto tiene, cuánto le falta para lo que
quiere y qué pasó con lo que gastó—, que es lo que distingue esto de un contador de puntos.

NO SHALL apoyarse en cifras, testimonios ni respaldos de terceros: no los hay, e inventarlos en una
página pública es poner un aval falso.

#### Scenario: Alguien lee la página sin registrarse

- **WHEN** alguien abre la puerta pública y no interactúa
- **THEN** puede leer que la moneda no es dinero real y vive dentro de su familia
- **AND** puede leer qué aprende su hijo con ella

#### Scenario: No se afirma nada que no sea cierto

- **WHEN** se revisa lo que la página afirma
- **THEN** todo lo que dice es cierto de lo construido
- **AND** no hay cifras, testimonios ni logos de terceros

### Requirement: Lo que solo ilustra no se anuncia

Una imagen de la puerta pública que **no aporte nada que el texto no diga** SHALL ser decorativa y NO
SHALL anunciarse a quien recorre la página sin verla.

Es la otra cara de la regla que obliga a la visualización del ciclo a llevar nombre: aquella comunica
algo —el ciclo— y sin nombre se perdería; una ilustración que solo acompaña a un texto que ya lo dice
todo, anunciada, es la misma frase dos veces.

#### Scenario: La ilustración que acompaña a un texto

- **WHEN** alguien recorre la puerta pública sin verla
- **THEN** oye el texto una sola vez
- **AND** no oye la ilustración que lo acompaña

#### Scenario: Lo que sí comunica sigue anunciándose

- **WHEN** se recorre la puerta pública sin verla
- **THEN** la visualización del ciclo y la marca siguen teniendo nombre

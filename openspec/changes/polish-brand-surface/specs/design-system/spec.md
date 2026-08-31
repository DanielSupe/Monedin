## ADDED Requirements

### Requirement: Una superficie de color reasigna los neutros, no los hereda

Cuando una pantalla se pinte con el color de la marca, los tokens de tinta, borde y sombra SHALL
tomar valores con el matiz de esa superficie, y NO SHALL heredar los de la superficie clara.

Los neutros del producto se eligieron para superficies claras. Sobre una superficie de color se leen
ajenos, y sobre una oscura directamente no se leen.

La reasignación SHALL declararse **en el sistema y por superficie**, del mismo modo que la escala se
reasigna por audiencia, y NO SHALL escribirse en la pantalla que la usa. Ninguna pantalla debería
tener que acordarse.

Fuera de esa superficie, los valores NO SHALL cambiar.

#### Scenario: Texto sobre la superficie de marca

- **WHEN** se muestra texto sobre el color de la marca
- **THEN** su tinta comparte el matiz de esa superficie

#### Scenario: Una sombra sobre la superficie de marca

- **WHEN** un elemento proyecta sombra sobre el color de la marca
- **THEN** esa sombra separa de verdad sobre ese fondo, y no es la del fondo claro

#### Scenario: Un control con fondo propio sobre una superficie oscura

- **WHEN** se dibuja un campo de texto sobre una superficie de color oscura
- **THEN** su fondo pertenece a esa superficie y su texto se lee
- **AND** no queda un recuadro claro con texto claro dentro

#### Scenario: El resto de la aplicación

- **WHEN** se muestra cualquier pantalla que no usa la superficie de marca
- **THEN** sus colores son exactamente los de antes

### Requirement: El color de la marca tiene rampa, no un solo valor

El color de la marca SHALL disponer de una rampa con pasos suficientes para **modelar** una
superficie: al menos un tono más profundo para el pie de un degradado y otro para los trazos y
bordes que se dibujen encima.

Con un único valor, una superficie grande se lee plana y cualquier línea dibujada sobre ella tiene
que ser de otro color o desaparecer. Eso es lo que hace que una pantalla parezca montada en vez de
diseñada.

El valor que representa a la marca NO SHALL cambiar al añadir la rampa: lo que se añade es con qué
modelarlo.

#### Scenario: Una superficie grande de marca

- **WHEN** se pinta un panel con el color de la marca
- **THEN** tiene profundidad tonal y no un color plano

#### Scenario: Una línea dibujada sobre la marca

- **WHEN** se dibuja un trazo o un borde sobre la superficie de marca
- **THEN** usa un tono de la propia rampa y se distingue del fondo

### Requirement: Una superficie clara anidada vuelve a los valores claros

Un componente que **pinta su propio fondo claro** SHALL comportarse como una superficie clara, esté
dentro de la superficie que esté, y sus tokens de tinta SHALL volver a los valores claros.

Sin esto, un aviso con su fondo suave colocado dentro de una superficie de color hereda la tinta de
esa superficie y queda claro sobre claro. Ocurrió, y no lo caza ningún test: cada pieza por separado
es correcta y solo falla la combinación.

Declararlo SHALL ser responsabilidad del componente que pinta el fondo, no de la pantalla que lo
coloca: la pantalla no tiene por qué saber sobre qué superficie está.

#### Scenario: Un aviso dentro de una superficie de color

- **WHEN** se muestra un aviso con fondo propio sobre una superficie de color
- **THEN** su texto se lee sobre ese fondo

#### Scenario: El mismo aviso sobre fondo claro

- **WHEN** se muestra ese aviso sobre una superficie clara
- **THEN** se ve exactamente igual que siempre

### Requirement: La acción principal no compite en matiz con su fondo

Un control de acción principal colocado sobre una superficie de color saturada SHALL usar un tono que
no vibre contra ella.

El color de acción del producto y el de la superficie pueden estar casi enfrentados en el círculo
cromático, o ser el mismo matiz: en el primer caso vibran y en el segundo desaparece. Las dos formas
de competir tienen la misma respuesta.

La variante SHALL vivir en la pieza del control y SHALL nombrarse por el **papel** que cumple, no por
su color, como el resto de sus variantes. NO SHALL imponerse desde la pantalla con clases sueltas.

#### Scenario: El envío sobre una superficie de marca

- **WHEN** el control principal se dibuja sobre el color de la marca
- **THEN** no compite en matiz con el fondo
- **AND** sigue leyéndose como la acción principal

#### Scenario: El mismo control sobre fondo claro

- **WHEN** el control principal se dibuja sobre una superficie clara
- **THEN** conserva el color de acción de siempre

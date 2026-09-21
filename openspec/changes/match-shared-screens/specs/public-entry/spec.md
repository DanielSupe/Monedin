# public-entry

## MODIFIED Requirements

### Requirement: La página despeja que la moneda no es dinero real

La puerta pública SHALL decir, sin que haga falta ninguna interacción, que las monedas de Monedín no
son dinero real: que no hay pagos, que no salen ni entran de ninguna cuenta y que no se comparten con
otras familias.

Es lo primero que piensa un adulto al leer «monedas» y «premios» en una aplicación para su hijo, y
hasta ahora la página no lo contestaba en ninguna parte. Quien se lo pregunta y no encuentra
respuesta se va antes de registrarse.

SHALL decir además **qué aprende el niño** con ellas —cuánto tiene, cuánto le falta para lo que
quiere y qué pasó con lo que gastó—, que es lo que distingue esto de un contador de puntos.

Y SHALL decirlo **antes** de contar cómo funciona el ciclo. Explicar el mecanismo a alguien que
todavía no sabe si esto mueve dinero de verdad es explicarle cómo se usa algo de lo que desconfía.

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

#### Scenario: Se recorre la página en orden

- **WHEN** alguien lee la puerta pública de arriba abajo
- **THEN** encuentra la respuesta sobre el dinero antes de la explicación del ciclo

### Requirement: La página enseña la aplicación, y sus dos caras

La puerta pública SHALL mostrar cómo se ve la aplicación por dentro, y SHALL mostrar **las dos
caras**: lo que ve el padre y lo que ve el niño.

Quien lee la página es el adulto que se registra, pero el producto es de los dos. Enseñar solo su
panel deja fuera aquello de lo que va todo; enseñar solo el del niño le oculta lo que él va a usar a
diario.

Las maquetas SHALL rendirse **con las piezas y la escala reales del producto**, de modo que la
diferencia entre las dos audiencias que se ve en la página sea la que existe. NO SHALL ser imágenes
capturadas: una captura envejece en silencio cuando el sistema de diseño cambia.

Las maquetas SHALL anunciarse como ejemplos **y SHALL decirlo también a la vista**, con que los datos
no son de nadie. Anunciarlo solo para quien no ve la página deja a quien la ve leyendo un saldo y un
recuento de tareas que, por estar hechos con las piezas de verdad, se parecen a los de alguien.

#### Scenario: Alguien mira cómo es la aplicación

- **WHEN** alguien recorre la puerta pública
- **THEN** ve una maqueta de lo que ve el padre y otra de lo que ve el niño

#### Scenario: La diferencia de escala es la real

- **WHEN** se comparan las dos maquetas
- **THEN** cada una rinde con la escala de su audiencia

#### Scenario: No se confunden con datos de nadie

- **WHEN** alguien recorre la página sin verla
- **THEN** las maquetas se anuncian como ejemplos

#### Scenario: Quien mira la página lee que es un ejemplo

- **WHEN** alguien mira una de las dos maquetas
- **THEN** debajo lee que es un ejemplo y que los datos no son de nadie

## ADDED Requirements

### Requirement: La acción del cierre dice qué va a pasar, no vuelve a invitar

La acción del final de la puerta pública SHALL nombrarse por lo que hace y NO SHALL repetir el
nombre de la acción de la cabecera y del titular.

Al final de la página ya no hace falta invitar a empezar: eso lo hicieron las dos de arriba. Lo que
queda por decir es qué ocurre al pulsar. Y tres controles con el mismo nombre en una misma página son
además tres oportunidades de dudar si llevan al mismo sitio.

Aunque se llame distinto, SHALL llevar al mismo destino que las otras.

#### Scenario: Alguien llega al final de la página

- **WHEN** lee el cierre
- **THEN** la acción dice qué va a pasar al pulsarla, y no repite el nombre de las de arriba

#### Scenario: Se comparan los destinos

- **WHEN** se miran las acciones principales de la página
- **THEN** todas llevan al registro, incluida la que se llama distinto

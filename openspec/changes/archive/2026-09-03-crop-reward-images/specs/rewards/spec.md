## ADDED Requirements

### Requirement: La imagen de un premio ocupa siempre la misma caja

Las pantallas que presentan premios SHALL reservar para su imagen una caja de **proporción fija**, la
misma para todos, y NO SHALL dejar que la altura de una tesela dependa de con qué foto se subió.

Es lo que el recorte hace posible y lo que la rejilla necesita: sin una proporción conocida, una
foto apaisada y una vertical dan dos teselas de alturas distintas y la fila queda dentada.

El respaldo de un premio sin foto SHALL ocupar exactamente esa misma caja, para que un premio sin
imagen no descuadre a sus vecinos.

Las fotos subidas **antes** de que se recortara SHALL seguir mostrándose sin romper nada: se encuadran
dentro de la caja, y NO SHALL reprocesarse ni volver a subirse.

#### Scenario: Dos premios con fotos de proporciones distintas

- **WHEN** un niño mira su escaparate con un premio de foto apaisada y otro de foto vertical
- **THEN** las dos teselas reservan la misma caja para la imagen

#### Scenario: Un premio sin foto no descuadra la rejilla

- **WHEN** en la rejilla hay un premio con foto y otro sin ella
- **THEN** el respaldo ocupa la misma caja que la imagen

#### Scenario: Una foto vieja se sigue viendo

- **WHEN** se muestra un premio cuya foto se subió sin recortar
- **THEN** se ve encuadrada en la caja, sin deformarse y sin que haya que volver a subirla

### Requirement: La tesela de un premio tiene un tope de ancho

Una tesela del escaparate SHALL tener un ancho máximo, y NO SHALL valer lo que valga su columna.

Sin tope, una rejilla de dos columnas en el ancho máximo del contenido da teselas de más de 450 px:
la foto de un producto ocupando media pantalla, que no es un escaparate sino una ficha. El tope
SHALL salir de un token del sistema, como cualquier otra medida.

Cuando haya sitio de sobra, el escaparate SHALL usar más columnas en vez de estirar las teselas. Eso
NO contradice que sean dos en una tablet: dos era el mínimo para comparar, y el motivo de no crecer
—que cada columna de más encogía la foto— deja de aplicar cuando la tesela tiene también un tope.

#### Scenario: Un escaparate en una pantalla ancha

- **WHEN** un niño abre su escaparate en una pantalla ancha
- **THEN** ninguna tesela supera el ancho máximo
- **AND** se usan más columnas en lugar de teselas más grandes

#### Scenario: Un escaparate estrecho sigue comparando de dos en dos

- **WHEN** un niño abre su escaparate en el ancho de una tablet
- **THEN** ve dos premios uno al lado del otro

## MODIFIED Requirements

### Requirement: Dentro de un perfil hay UNA sola navegación

Con un perfil activo, todos los destinos del rol SHALL ofrecerse desde un mismo sitio. El marco NO
SHALL ofrecer un destino desde dos sitios distintos, **con una única excepción declarada: el perfil
de quien está operando**.

Antes, cada rol tenía su propia barra y, además, un destino que no estaba en ella y colgaba del
avatar de la cabecera. Eran dos maneras de moverse y ninguna completa.

El perfil es la excepción porque su avatar en la cabecera **no es solo un destino**: responde a quién
está usando el dispositivo, que es una pregunta real en una tablet que comparte toda la familia y que
la lista de destinos no responde. Sigue estando además en la lista, porque un destino que solo se
alcanza pulsando una foto sin texto no se encuentra.

La excepción es **una** y va nombrada aquí. Cualquier otro destino ofrecido dos veces es un defecto.

#### Scenario: Se enumeran los destinos del marco

- **WHEN** se recorre el marco de un rol
- **THEN** cada destino aparece exactamente una vez, salvo el perfil

#### Scenario: El perfil, desde los dos sitios

- **WHEN** se mira el marco con un perfil activo
- **THEN** el avatar de la cabecera lleva al perfil
- **AND** el perfil sigue estando en la lista de destinos

## ADDED Requirements

### Requirement: Cuando hay ancho, la navegación está delante

En pantalla ancha la navegación SHALL estar visible como parte del marco, sin que haya que abrirla.
NO SHALL quedar detrás de un control en un tamaño en el que cabe.

Esconder la navegación cuesta un toque cada vez, y en escritorio y en tablet no compra nada: hay
ancho de sobra. En pantalla estrecha sí compra la pantalla entera, y ahí sigue detrás de su botón.

Cuando la navegación esté delante, SHALL poder contraerse a solo sus iconos, y el control que lo hace
SHALL decir lo que hace.

#### Scenario: Se abre la aplicación en una pantalla ancha

- **WHEN** hay un perfil activo y la pantalla es ancha
- **THEN** los destinos se ven sin abrir nada
- **AND** no hay control de menú

#### Scenario: Se contrae

- **WHEN** se pulsa el control de contraer
- **THEN** los destinos siguen alcanzables, con sus iconos
- **AND** cada uno conserva su nombre para quien no ve el icono

#### Scenario: Se abre en una pantalla estrecha

- **WHEN** hay un perfil activo y la pantalla es estrecha
- **THEN** la navegación está detrás del control de menú

### Requirement: Solo una forma de la navegación existe a la vez

El marco SHALL montar **una** de las dos formas de la navegación. NO SHALL montar las dos y ocultar
una con estilos.

Dos listas de destinos en el documento son dos para quien lo recorre con teclado o con un lector de
pantalla, aunque una no se vea. Ocultar con estilos es además lo que un test no puede distinguir, así
que la regla se sostendría sola sobre la buena voluntad.

#### Scenario: Se cuenta la navegación del documento

- **WHEN** hay un perfil activo, sea cual sea el ancho
- **THEN** existe exactamente una lista de destinos en el documento

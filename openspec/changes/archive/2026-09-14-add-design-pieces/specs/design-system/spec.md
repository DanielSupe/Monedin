## ADDED Requirements

### Requirement: Un realce de color es una pieza, no una receta que copia cada pantalla

Cuando una pantalla destaque una zona pintándola con un color de la marca, esa superficie SHALL venir
de una pieza del sistema, y ninguna pantalla SHALL declarar su propio degradado, su propia sombra de
color ni sus propias formas de fondo.

El realce es lo que más se repite del rediseño: aparece en trece de las treinta y dos pantallas. Una
receta copiada trece veces son trece decisiones que nadie ha comparado, y el día que haya que cambiar
el degradado hay que encontrarlas todas. Es lo mismo que ya pasó con las tres pantallas del niño que
acabaron con la misma lista idéntica sin que nadie lo decidiera.

La pieza SHALL recibir su tono como una opción declarada de un conjunto cerrado, y NO SHALL admitir un
color arbitrario desde el punto de uso. Un degradado que mezcle dos tonos del sistema deja de decir
cuál de los dos manda; que el punto de uso solo pueda elegir entre los tonos previstos convierte esa
regla en algo que no se puede incumplir.

#### Scenario: Una pantalla nueva necesita destacar una zona

- **WHEN** una pantalla necesita una superficie de realce con la marca
- **THEN** la obtiene de la pieza del sistema indicando su tono
- **AND** no declara ningún valor de color

#### Scenario: Una pantalla escribe su propio degradado

- **WHEN** un archivo de pantalla declara un degradado o una sombra de color
- **THEN** la verificación del proyecto falla señalando el archivo

#### Scenario: Se cambia el aspecto del realce

- **WHEN** se modifica el degradado en la pieza
- **THEN** cambian todas las pantallas que lo usan, sin editar ninguna de ellas

### Requirement: La mascota se monta desde una pieza, y su pose sale de un solo mapa

La mascota SHALL montarse desde una pieza del sistema, y la asociación entre un contexto y la pose que
le corresponde SHALL vivir en un único mapa. Ninguna pantalla SHALL elegir una ilustración por su
nombre de archivo.

Ya existe un mapa de contexto a pose. Escribir un segundo sería tener el mismo dato en dos sitios
comportándose distinto, que es exactamente el problema que obligó a meter el avatar del padre dentro
del actor: un segundo camino trae su propia copia, y una copia puede separarse de la primera.

La pieza SHALL tratar la ilustración como decorativa para las tecnologías de asistencia. Lo que nombra
lo que está pasando es el texto que la acompaña, no el dibujo.

#### Scenario: Una pantalla muestra la mascota

- **WHEN** una pantalla monta la mascota para un contexto del producto
- **THEN** la pose sale del mapa, y la pantalla no nombra ningún archivo

#### Scenario: Se cambia la pose de un contexto

- **WHEN** se cambia qué pose corresponde a un contexto
- **THEN** se cambia en un solo sitio y todas las pantallas de ese contexto lo siguen

#### Scenario: Alguien recorre la pantalla sin verla

- **WHEN** una tecnología de asistencia recorre una pantalla con la mascota
- **THEN** la ilustración no se anuncia
- **AND** lo que se anuncia es el texto que la acompaña

### Requirement: Un avatar del catálogo lo dibuja el producto, no el dispositivo

Las ilustraciones del catálogo de avatares SHALL dibujarse dentro del producto, y NO SHALL delegarse a
un glifo que cada sistema operativo compone a su manera.

El mismo perfil tiene que verse igual en los dos dispositivos de una casa. Un glifo del sistema se
dibuja distinto en una tablet y en un portátil, y a un niño pequeño su cara es cómo reconoce cuál es
su perfil en la rejilla.

El color de una ilustración SHALL ser propio de ella y NO SHALL reasignarse con el tema: un avatar es
contenido, como una foto. Lo que sí sigue al tema es la superficie sobre la que se dibuja.

Cambiar cómo se pinta un avatar SHALL seguir tocando un solo archivo. Ni las claves del catálogo, ni
la validación, ni el almacenamiento SHALL enterarse.

#### Scenario: El mismo perfil en dos dispositivos

- **WHEN** se abre la rejilla de perfiles en dos dispositivos distintos
- **THEN** cada avatar se ve igual en los dos

#### Scenario: Se añade una ilustración al catálogo

- **WHEN** se incorpora una ilustración nueva
- **THEN** se toca el archivo que las dibuja y la lista de claves compartida, y nada más
- **AND** ni la validación ni el almacenamiento cambian

#### Scenario: Se cambia de tema con avatares en pantalla

- **WHEN** se cambia entre el tema claro y el oscuro
- **THEN** los colores de cada animal no cambian
- **AND** el círculo sobre el que se dibujan sí sigue al tema

### Requirement: Un componente traído de fuera entra como pieza propia

Un componente incorporado desde una librería externa SHALL cumplir, desde el momento en que entra,
los mismos deberes que cualquier pieza del sistema: aparecer en el catálogo vivo, no conocer el
dominio, cubrir sus estados, no declarar valores visuales literales y declarar sus variantes como
opciones en lugar de admitirlas desde fuera con clases.

Un componente copiado no pertenece a su librería: es código del proyecto desde el primer minuto. Si no
puede cumplir esos deberes, no entra — y eso es preferible a tener una zona del sistema que se rige
por otras reglas.

El mecanismo de tema del componente SHALL ser el del sistema. Un componente que traiga su propia
convención de tema se adapta al entrar, y NO SHALL quedar ninguna marca de esa convención en el
código.

#### Scenario: Se incorpora un componente externo

- **WHEN** se trae un componente de una librería externa
- **THEN** aparece en el catálogo vivo como cualquier pieza propia
- **AND** sus colores y medidas salen de los tokens del sistema

#### Scenario: Queda rastro de la convención de tema ajena

- **WHEN** un archivo del proyecto usa la convención de tema de la librería externa
- **THEN** la verificación del proyecto falla señalando el archivo

#### Scenario: Un componente externo no puede cumplir los deberes

- **WHEN** un componente traído necesitaría un estilo en línea o conocer el dominio para funcionar
- **THEN** no se incorpora, y la necesidad se resuelve con una pieza propia

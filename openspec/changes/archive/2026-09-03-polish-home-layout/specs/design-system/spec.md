## ADDED Requirements

### Requirement: El contenido de una pantalla tiene un ancho máximo

El área de contenido de los marcos con perfil activo SHALL tener un ancho máximo y centrarse dentro
del espacio disponible. NO SHALL repartirse por todo lo que dé el monitor.

Sin tope, una fila de dos elementos en un monitor de 1355px da dos bloques de casi 600px cada uno con
su contenido perdido en medio. Y el efecto crece justo cuando la ventana crece, así que en el
dispositivo del que se presume —una tablet— se ve bien y en un escritorio se ve roto.

El valor SHALL salir de un token con nombre, no escribirse en la pantalla.

#### Scenario: Se abre cualquier pantalla en un monitor ancho

- **WHEN** la ventana es más ancha que el tope del contenido
- **THEN** el contenido no lo supera
- **AND** queda centrado en el espacio que sobra

#### Scenario: Se abre en una ventana estrecha

- **WHEN** la ventana es más estrecha que el tope
- **THEN** el contenido usa el ancho disponible

### Requirement: Una pantalla focal se ciñe más que un listado

Una pantalla cuyo contenido es un dato y unos pocos destinos SHALL usar un ancho menor que el de un
listado.

No es lo mismo un listado —que gana con sitio, porque cada fila lleva avatar, texto, cifra y
acciones— que el inicio de un niño, que es un número y cuatro destinos. Darle a los dos el mismo
ancho es lo que convierte cuatro teselas en cuatro bandas vacías.

#### Scenario: El inicio del niño

- **WHEN** se abre el inicio del niño en un monitor ancho
- **THEN** sus teselas mantienen una proporción en la que su glifo se ve
- **AND** no ocupan el ancho de un listado

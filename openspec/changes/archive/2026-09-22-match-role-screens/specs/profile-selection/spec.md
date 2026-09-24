# profile-selection

## ADDED Requirements

### Requirement: La rejilla distingue los perfiles por algo más que su cara

Cada tesela de la rejilla SHALL dibujarse como una tarjeta con borde propio, y el color de ese borde
SHALL seguir una regla del producto: el tono de la marca para el adulto y el de la acción para los
hijos.

Es la pantalla por la que se pasa cada vez que alguien coge la tablet, y era la más plana del
producto: cinco huecos del mismo gris sobre el mismo fondo. Un color asignado por rol se lee de un
vistazo sin aprenderse nada; uno alternado entre hijos obliga a volver a decidirlo cada vez que se
añade uno.

La pregunta de la pantalla SHALL ir en un panel de marca y no como un titular suelto: lo que se pide
ahí es elegir, y el color de la acción es el que lo dice.

El hueco para crear un perfil SHALL distinguirse de los perfiles, porque no es uno.

Un perfil bloqueado SHALL decirlo con una insignia, como el resto de estados del producto, y no con
texto atenuado bajo su nombre.

#### Scenario: Se abre la rejilla

- **WHEN** se muestran los perfiles de una familia
- **THEN** el del adulto se distingue del de los hijos por su color, además de por su nombre

#### Scenario: Hay un perfil bloqueado

- **WHEN** se muestra
- **THEN** su estado se lee como una insignia y no como parte de su nombre

#### Scenario: Un nombre ocupa dos renglones

- **WHEN** un perfil tiene un nombre largo
- **THEN** su tesela sigue midiendo lo mismo que las demás

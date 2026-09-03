## ADDED Requirements

### Requirement: La salida del perfil está donde el niño la busca

«Mi perfil» SHALL ofrecer volver a la rejilla. La salida SHALL seguir ofreciéndose también en el
inicio del niño, y las dos SHALL hacer exactamente lo mismo.

Hoy solo existe en el inicio, al final de una rejilla de teselas y por debajo de ellas. «Mi perfil»
es la pantalla que responde a «esto es mío», así que es donde alguien busca dejar de ser quien es —y
es además la que el niño alcanza desde el marco a cualquier hora, sin volver al inicio.

Que esté en dos sitios NO SHALL contar como un destino repetido en la navegación: salir es una acción
sobre la sesión y no un sitio al que se va, y por eso no entra en la cuenta de destinos del marco.

Esa salida SHALL ser volver a la rejilla, y NO SHALL cerrar la sesión de la cuenta. Cerrar sesión
obliga a teclear correo y contraseña, que un niño no tiene: dejaría a la familia entera fuera de la
aplicación hasta que apareciese el padre.

#### Scenario: El niño sale desde «Mi perfil»

- **WHEN** un niño con su perfil activo sale desde «Mi perfil»
- **THEN** deja de haber perfil activo
- **AND** se ofrecen de nuevo los perfiles, sin pedir la contraseña

#### Scenario: El niño sale desde su inicio

- **WHEN** un niño con su perfil activo sale desde su inicio
- **THEN** ocurre lo mismo que saliendo desde «Mi perfil»

#### Scenario: El niño no puede cerrar la sesión de la cuenta

- **WHEN** un niño recorre su inicio y «Mi perfil»
- **THEN** en ninguna de las dos se le ofrece cerrar la sesión de la cuenta

#### Scenario: Salir no es un destino de la navegación

- **WHEN** se enumeran los destinos del marco del niño
- **THEN** salir del perfil no figura entre ellos
- **AND** ningún destino del marco aparece dos veces

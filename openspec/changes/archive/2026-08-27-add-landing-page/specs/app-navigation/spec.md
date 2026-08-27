## MODIFIED Requirements

### Requirement: El acceso a un destino se decide antes de pintarlo

La comprobación de si alguien puede estar en un destino SHALL ocurrir **antes** de mostrarlo, y su
resultado SHALL ser una redirección a la dirección que sí corresponde, no una pantalla distinta bajo
la dirección equivocada.

Esta guarda NO es la de verdad: la de verdad sigue en el servidor, que responde 401 o 403 a quien no
debe. Esta solo evita enseñar una interfaz que no va a funcionar, y evita dejar a alguien parado en
una dirección que no es suya.

Cuando no hay sesión de ningún tipo, el destino SHALL ser la **puerta pública**, no la pantalla de
acceso. Es una sola regla para todos los destinos, sin excepciones por ruta: quien llega sin sesión
puede no conocer el producto, y un formulario no se lo explica. Desde la puerta pública se llega a la
pantalla de acceso, que sigue existiendo y siendo alcanzable.

#### Scenario: Sin sesión

- **WHEN** alguien sin sesión abre cualquier destino de la aplicación
- **THEN** acaba en la puerta pública
- **AND** desde ahí puede llegar a la pantalla de acceso

#### Scenario: Con cuenta acreditada y sin perfil elegido

- **WHEN** alguien con la cuenta acreditada pero sin perfil activo abre un destino que exige actor
- **THEN** acaba en la rejilla de selección de perfil
- **AND** no se muestra el contenido del destino

#### Scenario: Un niño abre un destino del padre

- **WHEN** un niño abre la dirección de una pantalla de gestión del padre
- **THEN** acaba en su propio inicio
- **AND** no se le acusa de nada: no aparece ningún mensaje de error

#### Scenario: Un padre abre un destino del niño

- **WHEN** un padre abre la dirección de una pantalla del niño
- **THEN** acaba en su propio inicio

#### Scenario: Una dirección que no existe

- **WHEN** se abre una dirección que no corresponde a ningún destino
- **THEN** se muestra una pantalla que lo dice
- **AND** ofrece una salida hacia un destino válido

#### Scenario: La pantalla de acceso sigue siendo alcanzable

- **WHEN** alguien sin sesión pide la pantalla de acceso desde la puerta pública
- **THEN** la ve
- **AND** no se le devuelve a la puerta pública

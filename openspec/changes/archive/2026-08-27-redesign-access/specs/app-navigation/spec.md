## ADDED Requirements

### Requirement: Entrar y registrarse son dos destinos, no dos estados

Acceder con una cuenta existente y crear una cuenta nueva SHALL ser **dos destinos con su propia
dirección**. NO SHALL decidirse cuál se muestra con estado interno de un componente.

Son la misma clase de cosa que el resto del producto ya resolvió así: recargar tiene que volver al
mismo sitio, el botón atrás tiene que volver al anterior y no salir de la aplicación, y un enlace
tiene que poder llevar a uno de los dos en concreto.

Cada uno SHALL ofrecer el otro mediante un enlace.

#### Scenario: Se recarga estando en el registro

- **WHEN** se recarga la página estando en el formulario de crear cuenta
- **THEN** se sigue viendo el formulario de crear cuenta

#### Scenario: Se vuelve atrás desde el registro

- **WHEN** se llega al registro desde la puerta pública y se pide volver atrás
- **THEN** se vuelve a la puerta pública
- **AND** no se sale de la aplicación

#### Scenario: Se ofrece el otro camino

- **WHEN** se muestra cualquiera de los dos formularios
- **THEN** se ofrece llegar al otro
- **AND** ese ofrecimiento es un enlace a su dirección

### Requirement: Cada llamada a la acción lleva a lo que anuncia

En la puerta pública, la acción de empezar SHALL llevar al formulario de **crear cuenta**, y la de
entrar al de **acceder**.

Llevar a quien viene a registrarse hasta un formulario de acceso le pide una credencial que todavía
no tiene, y la salida solo se encuentra si se lee un enlace al pie.

#### Scenario: Alguien que no tiene cuenta

- **WHEN** se pulsa la acción de empezar en la puerta pública
- **THEN** se llega al formulario de crear cuenta

#### Scenario: Alguien que ya tiene cuenta

- **WHEN** se pulsa la acción de entrar en la puerta pública
- **THEN** se llega al formulario de acceder

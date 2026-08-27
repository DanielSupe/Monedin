## ADDED Requirements

### Requirement: La batería de tests declara sus propias credenciales de almacén

La configuración SHALL declarar las credenciales del almacén de archivos de la batería de tests como
variables **distintas** de las que usa el almacén de la aplicación. Ambas SHALL ser obligatorias, SHALL
tratarse como secretas y NO SHALL tener valor por defecto.

Compartirlas obliga a que desarrollo y tests apunten al mismo proveedor, y eso contradice el
aislamiento que la batería necesita: desarrollo puede apuntar a un almacén real, y los tests nunca.

#### Scenario: Desarrollo apunta a un almacén real

- **WHEN** las credenciales de la aplicación son las de un proveedor real y las de la batería son las
  del almacén local
- **THEN** la batería sigue autenticándose contra el almacén local
- **AND** ningún test envía las credenciales del proveedor real

#### Scenario: Falta una credencial de la batería

- **WHEN** la configuración no declara alguna de las credenciales de la batería
- **THEN** el arranque falla nombrando la variable ausente
- **AND** no se sustituye por la credencial de la aplicación

#### Scenario: Se reporta un problema con una credencial de la batería

- **WHEN** el arranque falla por una de estas credenciales
- **THEN** el mensaje nombra la variable
- **AND** su valor no aparece en la salida, igual que con cualquier otro secreto

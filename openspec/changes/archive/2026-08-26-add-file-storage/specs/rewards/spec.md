## ADDED Requirements

### Requirement: Un premio puede llevar una foto, que se añade al editarlo

Un padre SHALL poder ponerle una foto a un premio suyo **editándolo**, no al publicarlo. El sistema NO
SHALL aceptar una foto en el alta.

La razón no es de producto sino de orden: la imagen se guarda bajo una clave que incluye el
identificador del premio, y ese identificador todavía no existe mientras el premio se está creando.
Es el mismo orden que ya rige para el avatar propio de un hijo, que se sube después de crear el
perfil.

Un premio sin foto SHALL seguir siendo un premio completamente válido, en el catálogo y en el
escaparate.

#### Scenario: El padre le pone una foto a un premio suyo

- **WHEN** un padre sube una imagen y la confirma sobre un premio suyo
- **THEN** el premio queda con esa foto
- **AND** el catálogo del padre la muestra

#### Scenario: Un premio se publica sin foto

- **WHEN** un padre publica un premio sin foto
- **THEN** el premio queda creado y es válido
- **AND** aparece en el catálogo y en el escaparate de los hijos a los que se ofrece

#### Scenario: El alta no acepta una foto

- **WHEN** se intenta indicar una imagen al publicar un premio
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Se quita la foto de un premio

- **WHEN** un padre borra explícitamente la foto de un premio suyo
- **THEN** el premio se queda sin foto
- **AND** sigue siendo válido en el catálogo y en el escaparate

#### Scenario: Un niño no le pone foto a un premio

- **WHEN** un perfil de niño intenta subir o confirmar la foto de un premio
- **THEN** la operación se rechaza por falta de permiso

#### Scenario: Un premio ajeno no admite foto

- **WHEN** un padre pide subir la foto de un premio de otra familia
- **THEN** la respuesta es la misma que para un premio inexistente
- **AND** no se entrega ninguna URL de subida

### Requirement: El niño ve la foto del premio en su escaparate

Cuando un premio ofrecido a un niño tenga foto, su escaparate SHALL mostrarla. El sistema SHALL
entregarla resuelta y lista para pintarse, igual que un avatar, sin exponer la clave interna.

Un premio con foto NO SHALL cambiar en nada más lo que el niño ve: su precio sigue siendo el suyo, y
sigue sin ver el de sus hermanos.

#### Scenario: Un premio con foto en el escaparate

- **WHEN** un niño pide su escaparate y uno de los premios tiene foto
- **THEN** la respuesta trae una URL con la que mostrarla

#### Scenario: Un premio sin foto en el escaparate

- **WHEN** un niño pide su escaparate y un premio no tiene foto
- **THEN** la respuesta lo dice explícitamente y no trae ninguna dirección rota

#### Scenario: La foto no filtra el precio de un hermano

- **WHEN** un niño pide el escaparate de un premio ofrecido también a su hermano con otro precio
- **THEN** ve la misma foto y **solo** su propio precio

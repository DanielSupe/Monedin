## ADDED Requirements

### Requirement: El modo administrar dice qué cambia al tocar una cara

Cuando la rejilla esté en modo administrar, la pantalla SHALL anunciarlo y SHALL decir qué va a pasar
al tocar un perfil.

Es la misma pantalla y el mismo gesto con dos destinos: en modo normal, tocar un perfil es entrar a
él; en modo administrar es editarlo, y pide el PIN de ESE perfil. Un distintivo pequeño sobre cada
cara no basta para explicar que el gesto cambió de significado.

El anuncio SHALL vivir en la pantalla y no solo en el distintivo de cada tesela, porque lo que ha
cambiado es el modo y no cada perfil por separado.

#### Scenario: Se entra en modo administrar

- **WHEN** la rejilla se muestra en modo administrar
- **THEN** la pantalla dice que está en ese modo y qué hará tocar un perfil

#### Scenario: Se sale del modo

- **WHEN** se abandona el modo administrar
- **THEN** el anuncio desaparece y tocar un perfil vuelve a ser entrar

#### Scenario: Quien no ve la pantalla entra en el modo

- **WHEN** se recorre la rejilla en modo administrar con un lector de pantalla
- **THEN** cada tesela dice a qué perfil corresponde y que la acción es editarlo

### Requirement: El alta de un perfil explica lo que todavía no puede ofrecer

El alta de un perfil desde la rejilla SHALL decir que allí solo se elige ilustración y que la foto se
pone después, al editar ese perfil.

La limitación es real y conocida: el alta ocurre sin perfil activo, así que no hay a qué colgar la
clave de subida de una foto. Lo que no puede pasar es que se lea como una función rota.

La explicación SHALL decir **dónde sí se puede**, no solo que aquí no. Una limitación sin salida deja
a quien la encuentra sin saber qué hacer.

#### Scenario: Se crea un perfil desde la rejilla

- **WHEN** se muestra el alta de un perfil
- **THEN** se ofrece elegir entre las ilustraciones del catálogo
- **AND** se dice que la foto se pone después, editando ese perfil

#### Scenario: El perfil ya existe

- **WHEN** se edita un perfil ya creado
- **THEN** sí se ofrece poner una foto

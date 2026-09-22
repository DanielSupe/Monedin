# profile-selection

## MODIFIED Requirements

### Requirement: El modo administrar dice qué cambia al tocar una cara

Cuando la rejilla esté en modo administrar, la pantalla SHALL anunciarlo y SHALL decir qué va a pasar
al tocar un perfil.

Es la misma pantalla y el mismo gesto con dos destinos: en modo normal, tocar un perfil es entrar a
él; en modo administrar es editarlo, y pide el PIN de ESE perfil. Un distintivo pequeño sobre cada
cara no basta para explicar que el gesto cambió de significado.

El anuncio SHALL vivir en la pantalla y no solo en el distintivo de cada tesela, porque lo que ha
cambiado es el modo y no cada perfil por separado.

Y el modo NORMAL SHALL decir también lo suyo: que se toca una cara y se teclea un PIN. El título
pregunta quién eres y calla que después viene un PIN, que es lo único que hay que saber para
responderle. Las dos frases SHALL ser distintas, o el aviso del modo dejaría de anunciar nada.

#### Scenario: Se entra en modo administrar

- **WHEN** la rejilla se muestra en modo administrar
- **THEN** la pantalla dice que está en ese modo y qué hará tocar un perfil

#### Scenario: Se sale del modo

- **WHEN** se abandona el modo administrar
- **THEN** el anuncio desaparece y tocar un perfil vuelve a ser entrar

#### Scenario: Quien no ve la pantalla entra en el modo

- **WHEN** se recorre la rejilla en modo administrar con un lector de pantalla
- **THEN** cada tesela dice a qué perfil corresponde y que la acción es editarlo

#### Scenario: Se abre la rejilla sin el modo

- **WHEN** la rejilla se muestra para elegir perfil
- **THEN** dice que hay que tocar una cara y teclear un PIN

## ADDED Requirements

### Requirement: El alta de un perfil pide primero quién es y después su secreto

El formulario de alta de un perfil SHALL pedir el nombre y la edad antes del PIN.

El orden no es estético: el nombre y la edad ya se saben, y el PIN hay que inventárselo. Colocarlo en
medio interrumpe con una decisión entre dos datos que solo se transcriben.

La rejilla de ilustraciones SHALL nombrarse por lo que hay que hacer con ella y no como un campo que
se rellena, porque es un conjunto de caras que se tocan.

#### Scenario: Se abre el alta de un perfil

- **WHEN** se recorren sus campos en orden
- **THEN** el nombre y la edad van antes del PIN

#### Scenario: Se llega a la ilustración

- **WHEN** se mira el bloque de ilustraciones
- **THEN** su nombre pide elegir una

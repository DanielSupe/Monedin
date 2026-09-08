## MODIFIED Requirements

### Requirement: Dentro de un perfil hay UNA sola navegación

Con un perfil activo, todos los destinos **de trabajo** del rol SHALL ofrecerse desde un mismo sitio.
El marco NO SHALL ofrecer uno de esos destinos desde dos sitios distintos, **con una única excepción
declarada: el perfil de quien está operando**.

Antes, cada rol tenía su propia barra y, además, un destino que no estaba en ella y colgaba del
avatar de la cabecera. Eran dos maneras de moverse y ninguna completa.

El perfil es la excepción porque su avatar en la cabecera **no es solo un destino**: responde a quién
está usando el dispositivo, que es una pregunta real en una tablet que comparte toda la familia y que
la lista de destinos no responde. Sigue estando además en la lista, porque un destino que solo se
alcanza pulsando una foto sin texto no se encuentra.

La excepción es **una** y va nombrada aquí. Cualquier otro destino de trabajo ofrecido dos veces es
un defecto.

**Un destino de AYUDA no es un destino de trabajo, y no entra en esa lista.** La lista enumera dónde
vive el trabajo del rol —sus tareas, sus premios, sus canjes, sus hijos—; la ayuda no es un sitio
donde se hace nada, es **meta**: responde «¿cómo funciona esto?» en vez de «¿qué tengo que hacer
hoy?». Meterla entre los destinos de trabajo la pondría del mismo tamaño que ellos y sugeriría que
hay que pasar por ahí.

Por eso la ayuda SHALL vivir en el armazón del marco —donde ya vive el avatar, por la razón
simétrica— y NO SHALL aparecer además en la lista de destinos: eso sería ofrecer un destino dos
veces, y la excepción declarada sigue siendo una sola.

#### Scenario: Se enumeran los destinos del marco

- **WHEN** se recorre el marco de un rol
- **THEN** cada destino de trabajo aparece exactamente una vez, salvo el perfil

#### Scenario: Un destino que antes colgaba del avatar

- **WHEN** el padre busca su cuenta, o el niño su perfil
- **THEN** lo encuentra en la misma lista que el resto de sus destinos

#### Scenario: El perfil, desde los dos sitios

- **WHEN** se mira el marco con un perfil activo
- **THEN** el avatar de la cabecera lleva al perfil
- **AND** el perfil sigue estando en la lista de destinos

#### Scenario: La ayuda no está entre los destinos de trabajo

- **WHEN** se abre la lista de destinos de cualquiera de los dos roles
- **THEN** la ayuda no aparece en ella
- **AND** sí se alcanza desde el armazón del marco

## ADDED Requirements

### Requirement: Hay destinos que son de los dos roles

Un destino SHALL poder exigir solo que haya alguien operando, sin exigir un rol concreto. Los dos
roles SHALL llegar a él sin ser redirigidos, y sin que existan dos pantallas cuya única diferencia
sea la audiencia: la escala la impone el marco, como en todo lo demás.

Sin perfil elegido SHALL seguir sin alcanzarse, igual que cualquier otro destino de la aplicación:
que un destino sea de los dos roles no lo hace público.

#### Scenario: Los dos roles llegan

- **WHEN** un padre abre un destino compartido
- **THEN** lo ve sin redirección
- **AND** lo mismo ocurre para un niño

#### Scenario: Sigue exigiendo un perfil

- **WHEN** se abre un destino compartido con la cuenta acreditada y sin perfil elegido
- **THEN** se aterriza en la rejilla de perfiles

#### Scenario: Una pantalla, dos audiencias

- **WHEN** el mismo destino se abre desde los dos roles
- **THEN** es la misma pantalla
- **AND** la diferencia de tamaños y radios la impone el marco del rol

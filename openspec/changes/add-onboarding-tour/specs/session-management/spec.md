## ADDED Requirements

### Requirement: El estado de la sesión dice si al perfil ya se le explicó

Cuando haya un perfil activo, el estado de la sesión SHALL indicar si a ese perfil ya se le mostró el
recorrido de bienvenida.

Viaja **con el actor** y no por un camino aparte, por lo mismo que el avatar del padre: era el mismo
dato en dos sitios y se comportaba distinto en cada uno hasta que se metió dentro. Un segundo camino
trae su propia caché, y una caché puede separarse de la del actor.

NO SHALL exponerse cuándo lo vio, solo si lo vio: quien pregunta decide con un sí o un no, y una
fecha sería más de lo que hace falta.

#### Scenario: Un perfil que todavía no lo ha visto

- **WHEN** el cliente consulta el estado con un perfil activo que no ha visto el recorrido
- **THEN** la respuesta lo indica

#### Scenario: Un perfil que ya lo vio

- **WHEN** el cliente consulta el estado con un perfil activo que ya lo vio
- **THEN** la respuesta lo indica

#### Scenario: Sin perfil activo no hay nada que decir

- **WHEN** el cliente consulta el estado sin perfil activo
- **THEN** la respuesta no dice nada del recorrido

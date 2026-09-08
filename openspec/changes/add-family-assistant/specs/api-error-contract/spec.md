## MODIFIED Requirements

### Requirement: Traducción de errores de dominio a estados HTTP

La capa de negocio SHALL señalar los fallos mediante errores de dominio con significado propio, y la
capa HTTP SHALL traducirlos a estados. La correspondencia SHALL definirse una sola vez y aplicarse a
toda la API: recurso inexistente a 404, acceso no permitido a 403, falta de sesión a 401, conflicto
con el estado actual a 409, entrada que no cumple las reglas a 422, **demasiados intentos en poco
tiempo a 429**, y **un servicio del que la API depende que no puede responder ahora a 503**.

El caso de los intentos merece un estado propio y no encaja en ninguno de los anteriores. No es un
conflicto con el estado del recurso ni una entrada inválida, y responder 401 sería peor que
inexacto: le diría a quien está probando combinaciones que siga probando.

El del servicio no disponible merece uno por la razón simétrica, y es el primer fallo del sistema
que **no es culpa de nadie de los dos lados**. Un 500 afirma dos cosas falsas: que el problema es
nuestro —así que emite un identificador de incidente que no lleva a ninguna parte— y, para el
cliente, que lo único que puede decirle a quien mira es «algo salió mal», cuando lo cierto es
«vuelve a intentarlo en un rato». La API SHALL distinguirlos, y NO SHALL emitir identificador de
incidente en el 503: no hay incidencia que correlacionar.

Un 503 NO SHALL usarse para reportar que el usuario se pasó de intentos: eso ya tiene su 429, lleva
`retryAt`, y confundirlos le echaría la culpa a quien no hizo nada.

#### Scenario: Se solicita un recurso que no existe

- **WHEN** la capa de negocio señala que el recurso solicitado no existe
- **THEN** la API responde 404 con el cuerpo de error estándar

#### Scenario: El actor no tiene permiso sobre el recurso

- **WHEN** la capa de negocio señala que el actor autenticado no puede operar sobre el recurso
- **THEN** la API responde 403 con el cuerpo de error estándar

#### Scenario: No hay sesión

- **WHEN** se llama a un endpoint que requiere sesión sin estar autenticado
- **THEN** la API responde 401 con el cuerpo de error estándar

#### Scenario: Conflicto con el estado actual

- **WHEN** la capa de negocio señala que la operación choca con el estado actual del recurso
- **THEN** la API responde 409 con el cuerpo de error estándar

#### Scenario: Demasiados intentos

- **WHEN** la capa de negocio señala que se han agotado los intentos permitidos y hay un bloqueo activo
- **THEN** la API responde 429 con el cuerpo de error estándar
- **AND** el código de error permite al cliente distinguirlo de una credencial incorrecta

#### Scenario: El bloqueo se distingue de la credencial incorrecta

- **WHEN** el cliente recibe un rechazo de acceso
- **THEN** puede saber por el código si debe pedir la credencial de nuevo o decir que hay que esperar
- **AND** no necesita leer el texto del mensaje para decidirlo

#### Scenario: Un servicio del que la API depende no puede responder

- **WHEN** la capa de negocio señala que un servicio externo no pudo atender la petición
- **THEN** la API responde 503 con el cuerpo de error estándar y un código propio
- **AND** la respuesta NO incluye identificador de incidente, porque no hay incidencia nuestra que investigar

#### Scenario: El fallo ajeno se distingue del fallo propio

- **WHEN** el cliente recibe un error de servidor
- **THEN** puede saber por el código si debe ofrecer reintentar o decir que algo salió mal de nuestro lado
- **AND** no necesita leer el texto del mensaje para decidirlo

#### Scenario: Un fallo ajeno no se disfraza de exceso de intentos

- **WHEN** el servicio externo rechaza la petición por haber agotado la cuota contratada
- **THEN** la API responde 503 y no 429
- **AND** no se le dice al usuario que agotó sus intentos, porque no los agotó él

#### Scenario: Un módulo nuevo no necesita definir su propio mapeo

- **WHEN** se agrega un módulo que lanza los errores de dominio ya existentes
- **THEN** sus respuestas de error obtienen el estado HTTP correcto sin escribir código de mapeo adicional

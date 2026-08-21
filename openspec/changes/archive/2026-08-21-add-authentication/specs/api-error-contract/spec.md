## MODIFIED Requirements

### Requirement: Traducción de errores de dominio a estados HTTP

La capa de negocio SHALL señalar los fallos mediante errores de dominio con significado propio, y la
capa HTTP SHALL traducirlos a estados. La correspondencia SHALL definirse una sola vez y aplicarse a
toda la API: recurso inexistente a 404, acceso no permitido a 403, falta de sesión a 401, conflicto
con el estado actual a 409, entrada que no cumple las reglas a 422, y **demasiados intentos en poco
tiempo a 429**.

El caso de los intentos merece un estado propio y no encaja en ninguno de los anteriores. No es un
conflicto con el estado del recurso ni una entrada inválida, y responder 401 sería peor que
inexacto: le diría a quien está probando combinaciones que siga probando.

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

#### Scenario: Un módulo nuevo no necesita definir su propio mapeo

- **WHEN** se agrega un módulo que lanza los errores de dominio ya existentes
- **THEN** sus respuestas de error obtienen el estado HTTP correcto sin escribir código de mapeo adicional

# api-error-contract Specification

## Purpose

Define la forma única que tiene toda respuesta de error de la API y las reglas que traducen un fallo
de dominio, de validación o inesperado a un estado HTTP, para que el front pueda tratar los errores
de forma uniforme y para que ningún módulo de dominio tenga que inventar su propio formato.

## Requirements

### Requirement: Forma única de respuesta de error

Toda respuesta de la API con estado HTTP 4xx o 5xx SHALL tener un cuerpo JSON con la misma forma: un
código de error estable y legible por máquina, un mensaje legible por humanos en español, y
opcionalmente un detalle estructurado. El código SHALL ser estable aunque el mensaje cambie, para
que el cliente nunca tenga que comparar textos.

#### Scenario: Cualquier error de la API

- **WHEN** una petición a cualquier endpoint termina en error
- **THEN** el cuerpo de la respuesta contiene un código de error y un mensaje
- **AND** el mensaje está en español
- **AND** la forma del cuerpo es idéntica sea cual sea el endpoint o el estado HTTP

#### Scenario: El cliente distingue errores sin leer el texto

- **WHEN** el front recibe una respuesta de error
- **THEN** puede decidir qué hacer usando únicamente el código de error
- **AND** cambiar la redacción del mensaje no rompe esa decisión

### Requirement: Traducción de errores de dominio a estados HTTP

La capa de negocio SHALL señalar los fallos mediante errores de dominio con significado propio, y la
capa HTTP SHALL traducirlos a estados. La correspondencia SHALL definirse una sola vez y aplicarse a
toda la API: recurso inexistente a 404, acceso no permitido a 403, falta de sesión a 401, conflicto
con el estado actual a 409, y entrada que no cumple las reglas a 422.

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

#### Scenario: Un módulo nuevo no necesita definir su propio mapeo

- **WHEN** se agrega un módulo que lanza los errores de dominio ya existentes
- **THEN** sus respuestas de error obtienen el estado HTTP correcto sin escribir código de mapeo adicional

### Requirement: Los errores de validación detallan qué campo falló

Cuando la entrada de una petición no cumple su esquema, la API SHALL responder 422 e incluir en el
detalle qué campos fallaron y por qué, de forma que el cliente pueda señalar el campo concreto en el
formulario. La respuesta SHALL reportar todos los campos inválidos a la vez, no solo el primero.

#### Scenario: Varios campos inválidos en la misma petición

- **WHEN** se envía un cuerpo con dos campos que incumplen sus reglas
- **THEN** la API responde 422
- **AND** el detalle identifica ambos campos
- **AND** cada uno indica el motivo del rechazo

#### Scenario: La validación ocurre antes que la lógica de negocio

- **WHEN** se envía una petición con el cuerpo malformado
- **THEN** la API responde 422 sin haber ejecutado ninguna operación sobre los datos

### Requirement: Los errores inesperados no filtran detalles internos

Ante un fallo no previsto, la API SHALL responder 500 con el cuerpo de error estándar y un mensaje
genérico. NO SHALL incluir en la respuesta trazas de pila, sentencias SQL, rutas de archivos ni
mensajes de librerías internas. El fallo completo SHALL registrarse en el log del servidor con un
identificador que también viaja en la respuesta, para poder correlacionar el reporte de un usuario
con la entrada de log correspondiente.

#### Scenario: Falla una dependencia inesperadamente

- **WHEN** una operación lanza un error no contemplado
- **THEN** la API responde 500 con un mensaje genérico en español
- **AND** la respuesta no contiene trazas de pila ni detalles de la infraestructura
- **AND** la respuesta incluye un identificador del incidente

#### Scenario: Se correlaciona un reporte con el log

- **WHEN** un usuario reporta el identificador que vio en la respuesta
- **THEN** existe una entrada de log con ese mismo identificador y el detalle completo del fallo

### Requirement: Las rutas desconocidas usan el mismo contrato

Una petición a una ruta que no existe SHALL responder 404 con el mismo cuerpo de error estándar que
el resto de la API, y no con el formato por defecto del framework.

#### Scenario: Se llama a una ruta inexistente

- **WHEN** se hace una petición a una ruta no registrada bajo el prefijo de la API
- **THEN** la respuesta es 404
- **AND** su cuerpo tiene la misma forma que cualquier otro error de la API

### Requirement: Los mensajes visibles están centralizados

Los mensajes de error dirigidos al usuario SHALL residir en un catálogo único en español. NO SHALL
escribirse textos visibles al usuario incrustados en los módulos.

#### Scenario: Se corrige la redacción de un mensaje

- **WHEN** se cambia el texto de un mensaje de error en el catálogo
- **THEN** el cambio se refleja en todos los endpoints que lo usan
- **AND** no hay que editar ningún módulo de dominio

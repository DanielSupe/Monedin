# data-access Specification

## Purpose

Define cómo el sistema se conecta a la base de datos, cómo evoluciona su esquema y qué parte del
código tiene permitido hablar con ella, de modo que el esquema de cualquier entorno sea reproducible
y que el acceso a datos no se filtre por capas donde no se puede razonar sobre él.

## Requirements

### Requirement: El esquema se reproduce desde cero con migraciones versionadas

Todo cambio de esquema SHALL estar registrado en una migración versionada y guardada en el
repositorio. Partiendo de una base de datos vacía, aplicar las migraciones en orden SHALL producir
exactamente el esquema que el código espera. NO SHALL aplicarse cambios de esquema a mano en ningún
entorno.

#### Scenario: Base de datos vacía

- **WHEN** se aplican todas las migraciones sobre una base de datos recién creada
- **THEN** el esquema resultante es el que el código espera
- **AND** no hace falta ningún paso manual adicional

#### Scenario: El esquema declarado y las migraciones han divergido

- **WHEN** el esquema declarado contiene un cambio que ninguna migración aplica
- **THEN** la verificación del proyecto falla señalando la diferencia

#### Scenario: Despliegue en un entorno existente

- **WHEN** se despliega una versión que trae migraciones nuevas
- **THEN** se aplican solo las que faltan
- **AND** las ya aplicadas no se vuelven a ejecutar

### Requirement: La conexión se obtiene de la configuración validada

Los datos de conexión a la base de datos SHALL proceder de la configuración del entorno ya validada.
Cambiar de entorno NO SHALL requerir modificar, recompilar ni reempaquetar el código.

#### Scenario: El mismo artefacto apunta a otra base de datos

- **WHEN** se ejecuta el mismo artefacto con una configuración de entorno distinta
- **THEN** se conecta a la base de datos del nuevo entorno sin cambios en el código

#### Scenario: La cadena de conexión es inválida al arrancar

- **WHEN** se arranca con una cadena de conexión mal formada
- **THEN** el proceso termina durante el arranque
- **AND** no llega a aceptar peticiones

### Requirement: Solo la capa de repositorio accede a la base de datos

El cliente de base de datos SHALL ser accesible únicamente desde la capa de repositorio de cada
módulo. Ninguna ruta, controlador ni servicio SHALL acceder a él directamente, y esta restricción
SHALL ser verificable de forma automática.

#### Scenario: Un servicio consulta la base de datos directamente

- **WHEN** un archivo que no es un repositorio importa el cliente de base de datos
- **THEN** la verificación estática del proyecto falla señalando el archivo y la línea

#### Scenario: Un módulo nuevo necesita datos

- **WHEN** se añade un módulo que necesita leer o escribir datos
- **THEN** lo hace a través de su propio repositorio

### Requirement: Los errores de la base de datos no escapan como fallos inesperados

Los fallos previsibles del motor (violación de unicidad, violación de una restricción de dominio,
referencia inexistente) SHALL traducirse a errores de dominio en la capa de repositorio. NO SHALL
llegar al cliente como error inesperado, ni SHALL filtrar nombres de tablas, columnas, restricciones
ni fragmentos de sentencias.

#### Scenario: Violación de unicidad

- **WHEN** una operación choca con un valor único ya existente
- **THEN** la capa de negocio recibe un error de conflicto
- **AND** la respuesta no contiene el nombre de la tabla ni el de la restricción

#### Scenario: Violación de una restricción de dominio

- **WHEN** una operación es rechazada por una restricción de rango del almacén
- **THEN** la capa de negocio recibe un error de entrada inválida

#### Scenario: Referencia a una entidad inexistente

- **WHEN** una operación referencia una entidad que no existe
- **THEN** la capa de negocio recibe un error de recurso no encontrado

#### Scenario: Fallo no previsto del motor

- **WHEN** la base de datos falla por un motivo no contemplado
- **THEN** la respuesta es un error inesperado genérico con su identificador de incidente
- **AND** el detalle completo queda únicamente en el log del servidor

### Requirement: La conexión se cierra de forma ordenada

Al recibir una señal de terminación, el sistema SHALL cerrar la conexión a la base de datos antes de
salir, para no dejar conexiones colgadas en cada despliegue.

#### Scenario: El proceso recibe una señal de terminación

- **WHEN** el proceso recibe la señal de apagado
- **THEN** deja de aceptar peticiones nuevas
- **AND** cierra la conexión a la base de datos antes de terminar

### Requirement: Los tests se ejecutan contra un esquema real y aislado

Los tests que ejercitan la capa de datos SHALL correr contra una base de datos real con el esquema
aplicado por las migraciones, NO contra un doble en memoria: las restricciones del motor son
precisamente lo que hay que comprobar. Cada test SHALL partir de un estado conocido y NO SHALL
depender de lo que hayan dejado los anteriores.

#### Scenario: Los tests comprueban una restricción del motor

- **WHEN** un test intenta guardar un dato que incumple una restricción
- **THEN** la operación es rechazada por la base de datos de verdad

#### Scenario: Dos tests que tocan los mismos datos

- **WHEN** se ejecutan dos tests que escriben sobre las mismas entidades
- **THEN** ninguno ve los datos del otro
- **AND** el resultado no depende del orden en que se ejecuten

#### Scenario: Los tests no tocan la base de datos de desarrollo

- **WHEN** se ejecuta la batería de tests
- **THEN** los datos de la base de datos de desarrollo quedan intactos

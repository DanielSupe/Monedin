## Purpose

Define cómo el sistema obtiene, valida y expone su configuración de entorno, de modo que un mismo
artefacto pueda desplegarse en local, en un servidor propio o en EC2 sin tocar código, y de modo que
una configuración inválida se detecte al arrancar y no en mitad de una petición de un usuario.

## ADDED Requirements

### Requirement: Validación de la configuración al arrancar

El sistema SHALL validar la configuración completa de entorno durante el arranque, antes de aceptar
tráfico. Si alguna variable requerida falta o no cumple su tipo o formato esperado, el proceso SHALL
terminar con un código de salida distinto de cero y NO SHALL quedar escuchando peticiones.

#### Scenario: Falta una variable requerida

- **WHEN** se inicia la API sin definir una variable de entorno requerida
- **THEN** el proceso termina con código de salida distinto de cero
- **AND** el mensaje de error nombra la variable ausente
- **AND** el servidor no llega a aceptar ninguna petición

#### Scenario: Una variable tiene un valor inválido

- **WHEN** se inicia la API con una variable numérica que contiene un valor no numérico
- **THEN** el proceso termina con código de salida distinto de cero
- **AND** el mensaje de error indica la variable, el valor recibido y el formato esperado

#### Scenario: Se reportan todos los errores a la vez

- **WHEN** se inicia la API con tres variables inválidas o ausentes simultáneamente
- **THEN** el mensaje de error lista los tres problemas en una sola salida
- **AND** no obliga a corregirlos de uno en uno reiniciando entre cada corrección

#### Scenario: Configuración completa y válida

- **WHEN** se inicia la API con todas las variables requeridas y válidas
- **THEN** el servidor arranca y acepta peticiones

### Requirement: Punto único de lectura del entorno

El sistema SHALL exponer la configuración validada como un único objeto tipado. Ningún componente
fuera del módulo de configuración SHALL leer variables de entorno directamente, y esta restricción
SHALL ser verificable de forma automática y no depender de la disciplina de quien programa.

#### Scenario: Lectura directa del entorno fuera del módulo de configuración

- **WHEN** cualquier archivo fuera del módulo de configuración lee una variable de entorno directamente
- **THEN** la verificación estática del proyecto falla señalando el archivo y la línea

#### Scenario: Un componente necesita un valor de configuración

- **WHEN** un módulo necesita la cadena de conexión a la base de datos
- **THEN** la obtiene del objeto de configuración tipado
- **AND** el valor ya viene validado, sin necesidad de comprobarlo de nuevo

### Requirement: Los secretos nunca se filtran en la salida

El sistema NO SHALL escribir valores de variables marcadas como secretas en mensajes de error, logs
ni respuestas HTTP. Al reportar un problema con una variable secreta, SHALL nombrar la variable pero
SHALL omitir o enmascarar su valor.

#### Scenario: Una variable secreta tiene formato inválido

- **WHEN** una credencial no cumple el formato esperado y el arranque falla
- **THEN** el mensaje de error nombra la variable
- **AND** el valor recibido no aparece en la salida, ni completo ni parcialmente

### Requirement: Plantilla de entorno sincronizada

El repositorio SHALL incluir una plantilla de entorno versionada que declare todas las variables que
el sistema requiere, con valores de ejemplo no sensibles. Los archivos de entorno reales NO SHALL
versionarse.

#### Scenario: Alguien clona el repositorio por primera vez

- **WHEN** copia la plantilla de entorno a su archivo de entorno local y completa los valores
- **THEN** la API arranca sin necesitar ninguna variable adicional no documentada

#### Scenario: Se agrega una variable requerida sin actualizar la plantilla

- **WHEN** el esquema de configuración declara una variable que la plantilla no contiene
- **THEN** la verificación del proyecto falla indicando qué variable falta en la plantilla

### Requirement: Portabilidad entre entornos sin cambios de código

El sistema SHALL determinar su comportamiento dependiente del entorno (puerto, base de datos,
orígenes permitidos, credenciales de servicios externos) exclusivamente a partir de la configuración.
Cambiar de entorno NO SHALL requerir modificar, recompilar ni reempaquetar el código.

#### Scenario: El mismo artefacto se despliega en otro entorno

- **WHEN** se ejecuta el mismo artefacto de la API con un archivo de entorno distinto
- **THEN** apunta a la base de datos y al puerto del nuevo entorno
- **AND** no se requirió ningún cambio en el código fuente

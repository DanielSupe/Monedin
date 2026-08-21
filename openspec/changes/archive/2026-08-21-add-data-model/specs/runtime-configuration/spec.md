## MODIFIED Requirements

### Requirement: Punto único de lectura del entorno

El sistema SHALL exponer la configuración validada como un único objeto tipado. Ningún componente
fuera del módulo de configuración SHALL leer variables de entorno directamente, y esta restricción
SHALL ser verificable de forma automática y no depender de la disciplina de quien programa.

La única salvedad son las **herramientas de línea de comandos** que se ejecutan antes de que exista
un proceso de la aplicación que pueda validar nada, como las que generan clientes o aplican
migraciones. Esas herramientas SHALL declararse en una **lista explícita y cerrada** de excepciones,
versionada junto a la verificación estática. Añadir una entrada a esa lista SHALL ser un acto
deliberado y visible en la revisión, nunca un efecto colateral. Ningún archivo que participe en
atender una petición SHALL figurar en ella.

#### Scenario: Lectura directa del entorno fuera del módulo de configuración

- **WHEN** cualquier archivo fuera del módulo de configuración lee una variable de entorno directamente
- **THEN** la verificación estática del proyecto falla señalando el archivo y la línea

#### Scenario: Un componente necesita un valor de configuración

- **WHEN** un módulo necesita la cadena de conexión a la base de datos
- **THEN** la obtiene del objeto de configuración tipado
- **AND** el valor ya viene validado, sin necesidad de comprobarlo de nuevo

#### Scenario: Una herramienta de línea de comandos necesita el entorno

- **WHEN** una herramienta declarada en la lista de excepciones lee una variable de entorno
- **THEN** la verificación estática lo permite
- **AND** la excepción es visible en la configuración de la verificación, con el motivo por escrito

#### Scenario: Un archivo no declarado intenta acogerse a la excepción

- **WHEN** un archivo que no está en la lista lee una variable de entorno directamente
- **THEN** la verificación estática del proyecto falla igual que antes

#### Scenario: Se intenta exceptuar código que atiende peticiones

- **WHEN** se añade a la lista un archivo que participa en atender una petición
- **THEN** la revisión lo rechaza, porque ese valor debe salir del objeto de configuración validado

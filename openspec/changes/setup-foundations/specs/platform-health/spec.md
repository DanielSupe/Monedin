## Purpose

Expone un punto de comprobación que permite saber si la API está viva y sirviendo tráfico, para que
un balanceador, un orquestador de contenedores o una persona desplegando puedan verificarlo sin
autenticarse y sin efectos secundarios.

## ADDED Requirements

### Requirement: Endpoint de salud público

La API SHALL exponer `GET /api/v1/health`, accesible sin sesión ni credenciales, que responda 200
con un cuerpo JSON indicando que el servicio está operativo. La operación SHALL ser de solo lectura
y NO SHALL producir efectos secundarios.

#### Scenario: La API está viva

- **WHEN** se hace `GET /api/v1/health` sin ninguna credencial
- **THEN** la respuesta es 200
- **AND** el cuerpo indica que el estado del servicio es correcto

#### Scenario: Llamadas repetidas

- **WHEN** se llama al endpoint de salud muchas veces seguidas
- **THEN** todas las respuestas son idénticas
- **AND** no se ha modificado ningún dato del sistema

### Requirement: La sonda de vida no depende de servicios externos

El endpoint de salud SHALL reportar únicamente si el proceso de la API está atendiendo peticiones.
NO SHALL consultar la base de datos ni ningún servicio externo, para que una caída de una dependencia
no se interprete como que el proceso murió y provoque reinicios en cadena durante el despliegue.

#### Scenario: La base de datos no está disponible

- **WHEN** la base de datos está caída y se hace `GET /api/v1/health`
- **THEN** la respuesta sigue siendo 200
- **AND** el tiempo de respuesta no se ve afectado por el estado de la base de datos

### Requirement: Todas las rutas viven bajo el prefijo versionado

Toda ruta de la API SHALL servirse bajo el prefijo `/api/v1`. Las peticiones a la misma ruta sin el
prefijo NO SHALL ser atendidas por la API, de modo que la aplicación web y la API puedan convivir
bajo un mismo dominio sin ambigüedad.

#### Scenario: Se llama a una ruta de la API sin el prefijo

- **WHEN** se hace `GET /health` sin el prefijo
- **THEN** la API no atiende la petición como si fuera su endpoint de salud
- **AND** responde 404 con el cuerpo de error estándar

#### Scenario: El front y la API comparten dominio

- **WHEN** la aplicación web se sirve en la raíz del dominio y la API bajo el prefijo
- **THEN** una ruta de navegación del front y un endpoint con el mismo nombre no colisionan

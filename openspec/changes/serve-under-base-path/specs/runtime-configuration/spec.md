# Spec Delta

## ADDED Requirements

### Requirement: El front se puede servir bajo una ruta base

El front SHALL poder servirse bajo una ruta base distinta de la raíz del dominio, declarada en la
configuración de entorno con `WEB_BASE_PATH`. Sin declararla, la base SHALL ser `/` y el
comportamiento SHALL ser idéntico al de servir en la raíz.

Con una base declarada, **todo** lo que el front pide o enseña SHALL colgar de ella: sus recursos
compilados, las direcciones de sus destinos y las llamadas a la API, que SHALL hacerse en
`<base>` seguido del prefijo de la API. Ninguna petición del front SHALL salir hacia la raíz del
dominio, que en un dominio compartido pertenece a otra aplicación.

La API NO SHALL cambiar por esto: sigue atendiendo en su prefijo de siempre, y quitar la base es
trabajo del proxy inverso que la tiene delante.

La base SHALL aceptarse con o sin barra final y SHALL empezar por `/`. Un valor que no empiece por
`/` SHALL hacer fallar la compilación nombrando la variable, en vez de producir un artefacto que pida
sus recursos a rutas relativas.

La base es una decisión de **compilación**: el artefacto queda atado a la ruta con la que se compiló.

#### Scenario: Sin base declarada

- **WHEN** se compila el front sin definir `WEB_BASE_PATH`
- **THEN** los recursos se piden desde `/`
- **AND** la API se llama en `/api/v1`

#### Scenario: Con una base declarada

- **WHEN** se compila el front con `WEB_BASE_PATH=/monedin`
- **THEN** los recursos compilados se piden bajo `/monedin/`
- **AND** el destino de la puerta pública es `/monedin/welcome`
- **AND** la API se llama en `/monedin/api/v1`

#### Scenario: Recargar un destino bajo la base

- **WHEN** quien usa la aplicación recarga `/monedin/tasks` y el servidor le entrega la página
- **THEN** se pinta el destino de las tareas, no un destino inexistente

#### Scenario: La barra final no cambia nada

- **WHEN** se compila con `WEB_BASE_PATH=/monedin/` y otra vez con `WEB_BASE_PATH=/monedin`
- **THEN** las dos compilaciones piden los recursos y llaman a la API en las mismas rutas

#### Scenario: Una base inválida

- **WHEN** se compila con `WEB_BASE_PATH=monedin`
- **THEN** la compilación falla
- **AND** el mensaje nombra `WEB_BASE_PATH` y dice que tiene que empezar por `/`

## MODIFIED Requirements

### Requirement: Portabilidad entre entornos sin cambios de código

El sistema SHALL determinar su comportamiento dependiente del entorno (puerto, base de datos,
orígenes permitidos, credenciales de servicios externos) exclusivamente a partir de la configuración.
Cambiar de entorno NO SHALL requerir modificar, recompilar ni reempaquetar el código.

La única salvedad es la **ruta base del front**, que se fija al compilarlo: una aplicación de página
única pide sus recursos a rutas que quedan escritas en el artefacto. Cambiar de ruta base SHALL
requerir solo recompilar con otro valor de configuración, nunca tocar el código.

#### Scenario: El mismo artefacto se despliega en otro entorno

- **WHEN** se ejecuta el mismo artefacto de la API con un archivo de entorno distinto
- **THEN** apunta a la base de datos y al puerto del nuevo entorno
- **AND** no se requirió ningún cambio en el código fuente

#### Scenario: El front se despliega bajo otra ruta base

- **WHEN** el front tiene que servirse bajo una ruta base distinta de la del artefacto existente
- **THEN** basta con recompilarlo con otro valor de `WEB_BASE_PATH`
- **AND** no se requirió ningún cambio en el código fuente

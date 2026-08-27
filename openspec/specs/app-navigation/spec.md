# app-navigation Specification

## Purpose
Define qué destinos existen en la aplicación, quién puede llegar a cada uno y qué ocurre cuando
alguien abre una dirección que no le corresponde; qué marco rodea a cada rol; y qué garantiza que el
botón atrás, la recarga y un enlace compartido se comporten como en cualquier aplicación y no como en
un andamio.
## Requirements
### Requirement: Todo destino tiene su propia dirección

Cada pantalla a la que una persona puede llegar SHALL tener una dirección propia. El estado local de
un componente NO SHALL usarse para decidir qué pantalla se muestra.

Esto vale para las dos audiencias por igual. Que las pantallas de un rol tengan dirección y las del
otro no es la asimetría que este requisito elimina.

#### Scenario: El niño recorre sus destinos

- **WHEN** un niño abre cada una de sus pantallas
- **THEN** la dirección del navegador cambia en cada una
- **AND** cada dirección identifica una sola pantalla

#### Scenario: Un componente decide qué pantalla mostrar con estado local

- **WHEN** un componente de pantalla guarda en su estado cuál de varias vistas mostrar
- **THEN** se considera un defecto, y la verificación del proyecto lo señala

#### Scenario: Un formulario que se abre desde una lista

- **WHEN** se abre el formulario de alta desde una lista
- **THEN** tiene dirección propia, distinta de la de la lista

### Requirement: El botón atrás y la recarga se comportan como en cualquier aplicación

Volver atrás SHALL devolver a la pantalla anterior dentro de la aplicación mientras exista una.
Recargar SHALL mantener a la persona en la pantalla en la que estaba.

Es el requisito que más se nota en el dispositivo real: en una tablet, el gesto de volver es el que
más se usa, y una aplicación que se cierra al usarlo se percibe rota.

#### Scenario: Volver desde un destino del niño

- **WHEN** un niño entra a una de sus pantallas y pulsa volver
- **THEN** regresa a la pantalla anterior
- **AND** NO sale de la aplicación

#### Scenario: Recargar en una pantalla cualquiera

- **WHEN** se recarga estando en un destino
- **THEN** se vuelve a mostrar ese mismo destino
- **AND** no se vuelve al inicio

#### Scenario: Abrir un enlace guardado

- **WHEN** alguien con la sesión adecuada abre directamente la dirección de un destino
- **THEN** llega a ese destino

### Requirement: Cada rol recibe su propio marco, y el marco declara la escala

La aplicación SHALL envolver el contenido en un marco de navegación que **persista** entre destinos y
que se elija por el rol de quien está operando. Ese marco SHALL declarar la escala de la audiencia,
que es lo que hace que las mismas piezas rindan distinto para un niño y para un padre.

El marco SHALL construirse únicamente con piezas del sistema de diseño.

#### Scenario: Un niño con su perfil activo

- **WHEN** un niño está dentro de la aplicación
- **THEN** ve el marco de navegación del niño
- **AND** el contenedor declara la escala del niño

#### Scenario: Un padre con su perfil activo

- **WHEN** un padre está dentro de la aplicación
- **THEN** ve el marco de navegación del padre
- **AND** el contenedor declara la escala del padre

#### Scenario: El marco sobrevive a la navegación

- **WHEN** se navega de un destino a otro dentro del mismo rol
- **THEN** el marco no se desmonta ni se vuelve a construir

#### Scenario: Objetivo de toque de la navegación del niño

- **WHEN** se rinde la navegación bajo la escala del niño
- **THEN** cada destino tiene un área tocable de al menos 44 píxeles en su lado menor

### Requirement: El acceso a un destino se decide antes de pintarlo

La comprobación de si alguien puede estar en un destino SHALL ocurrir **antes** de mostrarlo, y su
resultado SHALL ser una redirección a la dirección que sí corresponde, no una pantalla distinta bajo
la dirección equivocada.

Esta guarda NO es la de verdad: la de verdad sigue en el servidor, que responde 401 o 403 a quien no
debe. Esta solo evita enseñar una interfaz que no va a funcionar, y evita dejar a alguien parado en
una dirección que no es suya.

#### Scenario: Sin sesión

- **WHEN** alguien sin sesión abre cualquier destino de la aplicación
- **THEN** acaba en la pantalla de acceso

#### Scenario: Con cuenta acreditada y sin perfil elegido

- **WHEN** alguien con la cuenta acreditada pero sin perfil activo abre un destino que exige actor
- **THEN** acaba en la rejilla de selección de perfil
- **AND** no se muestra el contenido del destino

#### Scenario: Un niño abre un destino del padre

- **WHEN** un niño abre la dirección de una pantalla de gestión del padre
- **THEN** acaba en su propio inicio
- **AND** no se le acusa de nada: no aparece ningún mensaje de error

#### Scenario: Un padre abre un destino del niño

- **WHEN** un padre abre la dirección de una pantalla del niño
- **THEN** acaba en su propio inicio

#### Scenario: Una dirección que no existe

- **WHEN** se abre una dirección que no corresponde a ningún destino
- **THEN** se muestra una pantalla que lo dice
- **AND** ofrece una salida hacia un destino válido

### Requirement: El filtro y la página de un listado viajan en la dirección

En un listado con filtros o paginación, el filtro aplicado y la página SHALL formar parte de la
dirección. Volver atrás desde una pantalla abierta desde ese listado SHALL devolver el listado **con
su filtro y su página**, no reiniciado.

Un padre que filtra por «esperando mi aprobación», entra a resolver una y vuelve, no debería tener
que volver a filtrar.

#### Scenario: Volver a un listado filtrado

- **WHEN** se filtra un listado, se abre otra pantalla desde él y se vuelve atrás
- **THEN** el listado conserva el filtro y la página que tenía

#### Scenario: Compartir un listado filtrado

- **WHEN** se abre directamente la dirección de un listado con un filtro
- **THEN** el listado aparece ya filtrado

#### Scenario: Un filtro inválido en la dirección

- **WHEN** la dirección trae un filtro o una página que no son válidos
- **THEN** el listado se muestra con los valores por defecto
- **AND** no se rompe ni se queda en blanco

### Requirement: La navegación no se cablea a mano entre componentes

Un componente de pantalla NO SHALL recibir de quien lo usa una función para volver o para cerrarse.
Navegar SHALL hacerse contra el sistema de rutas.

Ese cableado a mano es lo que obliga a que cada pantalla conozca a la que la abrió, y es la razón por
la que las mismas pantallas no se pueden alcanzar desde dos sitios distintos.

#### Scenario: Un componente recibe una función de vuelta

- **WHEN** un componente de pantalla declara una propiedad para que quien lo usa le diga cómo volver
- **THEN** se considera un defecto, y la verificación del proyecto lo señala

#### Scenario: Llegar a la misma pantalla desde dos sitios

- **WHEN** se llega a un mismo destino desde dos pantallas distintas
- **THEN** funciona igual en ambos casos, sin que el destino sepa desde dónde se llegó


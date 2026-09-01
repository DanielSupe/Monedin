## ADDED Requirements

### Requirement: Dentro de un perfil hay UNA sola navegación

Con un perfil activo, todos los destinos del rol SHALL ofrecerse desde un mismo sitio. El marco NO
SHALL ofrecer un destino desde dos sitios distintos.

Hoy cada rol tiene su propia barra y, además, un destino que no está en ella y cuelga del avatar de
la cabecera. Son dos maneras de moverse y ninguna completa. Ofrecer lo mismo dos veces es además el
defecto que el inicio del padre acaba de dejar atrás.

#### Scenario: Se enumeran los destinos del marco

- **WHEN** se recorre el marco de un rol
- **THEN** cada destino aparece exactamente una vez

#### Scenario: Un destino que antes colgaba del avatar

- **WHEN** el padre busca su cuenta, o el niño su perfil
- **THEN** lo encuentra en la misma lista que el resto de sus destinos

### Requirement: La navegación se abre desde un control con nombre y se cierra sola al llegar

La navegación SHALL abrirse desde un control anunciado con su nombre, y SHALL cerrarse cuando cambie
la dirección.

Cerrar al **cambiar de dirección** y no al pulsar un enlace no es un matiz: el botón atrás también
cambia la dirección, y un panel que sigue abierto tapando la pantalla a la que se acaba de volver es
peor que no tenerlo.

#### Scenario: Se elige un destino

- **WHEN** se abre la navegación y se pulsa uno de sus destinos
- **THEN** se llega al destino
- **AND** la navegación queda cerrada

#### Scenario: Se vuelve atrás con la navegación abierta

- **WHEN** la navegación está abierta y se usa el botón atrás
- **THEN** la navegación queda cerrada

### Requirement: El estado de apertura de la navegación no viaja en la dirección

Que la navegación esté abierta NO SHALL representarse en la dirección.

Es el caso contrario al del modo «administrar» de la rejilla, y por la razón contraria: aquel tenía
que **sobrevivir** a una navegación —cruza hasta el teclado de PIN—, y este tiene que **morir** con
ella. Guardarlo en la dirección haría que recargar abriera un panel que nadie pidió, y que el botón
atrás cerrara el panel en vez de volver.

#### Scenario: Se recarga con la navegación abierta

- **WHEN** se abre la navegación y se recarga la página
- **THEN** la navegación aparece cerrada

### Requirement: El destino vigente se anuncia como tal

Dentro de la navegación, el destino que corresponde a la dirección actual SHALL anunciarse como la
página actual.

Un destino que solo se distingue por el color no existe para quien no distingue esos colores, ni para
quien usa un lector de pantalla.

#### Scenario: Se abre la navegación desde un destino

- **WHEN** se abre la navegación estando en uno de sus destinos
- **THEN** ese destino se anuncia como el actual
- **AND** los demás no

### Requirement: Las pantallas previas a tener un rol no reciben navegación

`EntryShell` NO SHALL ofrecer la navegación de destinos.

Antes de entrar a un perfil no hay rol, así que no se sabe de quién serían los destinos; y las
pantallas de ese camino —acceso, rejilla, teclado de PIN— existen para llevar a un sitio, no para
ofrecer alternativas.

#### Scenario: Se abre la rejilla de perfiles

- **WHEN** se llega a la rejilla sin perfil activo
- **THEN** no hay control de navegación en el marco

# app-navigation

## ADDED Requirements

### Requirement: El tema del perfil se aplica al documento entero

Cuando haya un perfil activo, el marco SHALL aplicar su preferencia de tema **a la raíz del
documento**, no al contenedor del marco.

Tiene que ser la raíz porque el tema tiene que alcanzar lo que se pinta FUERA del marco: los diálogos
y el velo del recorrido de bienvenida salen por un portal, al final del documento, y con el atributo
puesto más abajo se quedarían con el tema contrario.

Cuando la preferencia sea seguir al sistema, el marco NO SHALL escribir ningún tema explícito: es la
ausencia del atributo lo que deja mandar a la preferencia del dispositivo.

Ninguna pieza del sistema de diseño SHALL recibir ni consultar el tema. Lo que cambia es el valor de
los tokens, y esa es la razón por la que esto se resuelve en el marco y no en treinta componentes.

#### Scenario: Un perfil que eligió el tema oscuro

- **WHEN** entra un perfil cuya preferencia es oscuro
- **THEN** la interfaz se pinta en oscuro, incluidos los diálogos que salen por un portal

#### Scenario: Un perfil que sigue al sistema

- **WHEN** entra un perfil cuya preferencia es seguir al sistema
- **THEN** la interfaz sigue a la preferencia del dispositivo, sin tema explícito escrito

#### Scenario: Se cambia de perfil

- **WHEN** se sale de un perfil en oscuro y se entra a otro que prefiere claro
- **THEN** la interfaz pasa al claro sin recargar la página

### Requirement: La cabecera ofrece cambiar de tema

Los dos marcos con perfil activo SHALL ofrecer un control de tema en su cabecera, a la derecha.

SHALL recorrer los tres estados con un solo control, y no ofrecer tres. La cabecera es donde el sitio
es caro y son tres estados que un icono distingue.

SHALL anunciar el estado ACTUAL y no el siguiente: lo que alguien necesita al llegar al control es
saber dónde está, no a dónde iría. El nombre SHALL cambiar con el estado, porque lo que el control
hace cambia — es la misma regla que el control de contraer el lateral.

Las pantallas previas a elegir perfil NO SHALL ofrecerlo: allí no hay actor, así que no habría dónde
guardar la elección.

#### Scenario: Dentro de un perfil

- **WHEN** se mira la cabecera con un perfil activo
- **THEN** hay un control de tema a la derecha, anunciado con el estado en el que está

#### Scenario: Se recorre el ciclo

- **WHEN** se acciona el control tres veces desde «seguir al sistema»
- **THEN** pasa por claro y oscuro y vuelve a seguir al sistema, guardando cada paso

#### Scenario: Antes de elegir perfil

- **WHEN** se mira el acceso, la rejilla o el teclado de PIN
- **THEN** no hay control de tema

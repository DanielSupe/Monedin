## Purpose

Qué se le explica a cada rol la primera vez que entra a su perfil, cómo se sale de esa explicación y
cómo se vuelve a ella. Cubre el recorrido guiado del inicio, no la ayuda del resto del producto.

## ADDED Requirements

### Requirement: Cada rol recibe su propio recorrido la primera vez

La primera vez que se entra a un perfil, el sistema SHALL ofrecer un recorrido guiado sobre la
pantalla de inicio de ese perfil. SHALL haber **uno por rol**, con su propio contenido.

No es el mismo con ramas: a un adulto que gestiona hay que decirle dónde aprueba, dónde crea y dónde
ve a sus hijos; a un niño, qué son esas monedas y cómo consigue más. Un recorrido que sirviera a los
dos no serviría a ninguno, por la misma razón por la que el producto tiene dos escalas.

El recorrido SHALL explicar, paso a paso, partes de la pantalla que el perfil está viendo, y NO SHALL
inventar datos de ejemplo para tener algo que enseñar.

#### Scenario: Un padre entra a su perfil por primera vez

- **WHEN** un padre activa su perfil y nunca ha visto el recorrido
- **THEN** se le ofrece el recorrido del padre sobre su panel

#### Scenario: Un niño entra a su perfil por primera vez

- **WHEN** un niño activa su perfil y nunca ha visto el recorrido
- **THEN** se le ofrece el recorrido del niño sobre su inicio
- **AND** su contenido es distinto del que recibe el padre

#### Scenario: Una cuenta recién creada

- **WHEN** un padre sin hijos, sin tareas y sin premios ve el recorrido
- **THEN** el recorrido se completa igualmente
- **AND** no se muestran datos inventados en su lugar

### Requirement: El recorrido atenúa la pantalla y destaca lo que explica

Mientras el recorrido está en curso, el sistema SHALL atenuar la pantalla y SHALL dejar **destacado**
lo que el paso está explicando.

Es lo que convierte una explicación en una indicación: un texto que dice «aquí ves a tus hijos» sin
señalar nada obliga a buscarlo, y quien necesita el recorrido es justo quien no sabe dónde mirar.

El destacado SHALL seguir a la parte que corresponde a cada paso, de modo que avanzar mueva el foco.

Lo destacado NO SHALL poder usarse mientras el recorrido está en curso: lo que se pulsa es el control
de avanzar. El foco señala, no invita a interactuar.

Cuando un paso no encuentre en la pantalla la parte que explica, SHALL mostrarse igualmente, centrado
y sin destacar nada, y NO SHALL interrumpir el recorrido. Una pantalla vacía es precisamente la de
quien más lo necesita.

#### Scenario: Se avanza de un paso al siguiente

- **WHEN** alguien avanza en el recorrido
- **THEN** el destacado pasa a la parte que explica el paso nuevo

#### Scenario: Un paso cuya parte no está en pantalla

- **WHEN** un paso explica algo que esa pantalla no muestra todavía
- **THEN** el paso se muestra centrado y sin destacar nada
- **AND** el recorrido continúa

#### Scenario: Se intenta usar lo destacado

- **WHEN** alguien intenta usar la parte destacada durante el recorrido
- **THEN** no responde
- **AND** el control de avanzar sigue siendo lo único que actúa

### Requirement: El recorrido se ve una vez, y el sistema lo recuerda por perfil

El sistema SHALL recordar, **por perfil**, que a ese perfil ya se le mostró el recorrido, y NO SHALL
volver a ofrecerlo.

SHALL recordarlo de forma que sobreviva a cambiar de dispositivo, de navegador o a borrar sus datos:
quien ya lo vio en la tablet de casa no debe volver a verlo en el teléfono.

Que un perfil lo haya visto NO SHALL afectar a los demás perfiles de la familia.

#### Scenario: Se vuelve a entrar al mismo perfil

- **WHEN** alguien que ya vio su recorrido vuelve a entrar a su perfil
- **THEN** no se le ofrece de nuevo

#### Scenario: Se entra desde otro dispositivo

- **WHEN** alguien que ya vio su recorrido entra a su perfil desde otro dispositivo
- **THEN** tampoco se le ofrece

#### Scenario: Un hermano todavía no lo ha visto

- **WHEN** un niño ve su recorrido y su hermano entra después a su propio perfil
- **THEN** el hermano recibe el suyo

#### Scenario: Un perfil recién creado

- **WHEN** se crea un perfil
- **THEN** consta que todavía no ha visto el recorrido

### Requirement: Se puede salir del recorrido, y volver a él

El recorrido SHALL poder abandonarse desde el primer paso, y abandonarlo SHALL contar como visto.

Obligar a un adulto a pasar cinco pantallas para llegar a su panel es cómo se aprende a cerrar cosas
sin leerlas; y un recorrido del que no se puede salir es una pantalla que no deja pasar.

El sistema SHALL ofrecer además, desde los ajustes de cada perfil, **volver a verlo**. Sin eso, quien
lo saltó por prisa pierde la explicación para siempre — y es quien más la necesitará después.

Volver a verlo SHALL afectar solo al perfil que lo pide.

#### Scenario: Se abandona el recorrido

- **WHEN** alguien abandona el recorrido en cualquier paso
- **THEN** el recorrido se cierra
- **AND** no vuelve a ofrecerse al entrar de nuevo

#### Scenario: Se completa el recorrido

- **WHEN** alguien llega al último paso y lo termina
- **THEN** cuenta como visto igual que si lo hubiera abandonado

#### Scenario: Se pide verlo otra vez

- **WHEN** alguien pide desde sus ajustes volver a ver el recorrido
- **THEN** vuelve a ofrecérsele
- **AND** los demás perfiles de la familia no se ven afectados

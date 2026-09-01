## ADDED Requirements

### Requirement: Una acción irreversible se confirma con un diálogo

Dar de baja un perfil de hijo SHALL confirmarse con el diálogo modal del sistema. NO SHALL
confirmarse con un párrafo y dos botones dentro de la fila.

La baja no se puede deshacer y lo dice su propio mensaje. Un diálogo atrapa el foco, cierra con
Escape y marca inerte el resto del documento; un párrafo con dos botones no hace nada de eso, y deja
la acción destructiva a un toque de distancia de la fila del hijo de al lado.

Es además lo que ya hace la retirada de un premio, que pesa menos: retirar se puede revertir
publicando otra vez, y dar de baja no.

#### Scenario: Se pide la baja de un perfil

- **WHEN** el padre pulsa dar de baja
- **THEN** se abre un diálogo que explica que no se puede deshacer
- **AND** el foco queda dentro hasta que decida

#### Scenario: Se cierra sin confirmar

- **WHEN** el padre cierra el diálogo con Escape
- **THEN** el perfil sigue como estaba

### Requirement: El estado de un perfil se lee como estado, no como error

Un perfil bloqueado SHALL señalarse con la etiqueta de estado del sistema, en tono de advertencia. NO
SHALL señalarse con un color escrito a mano dentro de una frase.

Estar bloqueado significa que ese niño falló el PIN varias veces. No es una avería ni una culpa del
padre, y el rojo se lo dice. Es el mismo criterio con el que un canje rechazado va en ámbar.

El tono acompaña al texto y nunca lo sustituye.

#### Scenario: Un perfil bloqueado en el listado

- **WHEN** un hijo tiene el perfil bloqueado
- **THEN** se ve con la etiqueta de estado en advertencia
- **AND** su significado se lee también sin distinguir el color

### Requirement: Reponer el PIN de un hijo es un formulario

Reponer el PIN de un hijo desde el listado SHALL ser un `<form>` con su envío. NO SHALL ser un campo
suelto con un botón al lado.

Es la misma regla que `redesign-parent-authoring` aplicó a las tres pantallas de escritura: teclear
cuatro dígitos y pulsar Enter es lo que hace cualquiera.

#### Scenario: Se repone el PIN con el teclado

- **WHEN** el padre escribe el PIN nuevo y pulsa Enter
- **THEN** se envía

### Requirement: Cada perfil enseña lo que el padre necesita para decidir

La fila de un hijo SHALL mostrar su avatar, su nombre, su saldo y su estado, y ofrecer solo las
acciones que su estado permite: desbloquear únicamente si está bloqueado.

Ofrecer desbloquear un perfil que no lo está es prometer algo que no hace nada, que es la misma regla
que gobierna las dos bandejas.

#### Scenario: Un perfil que no está bloqueado

- **WHEN** el listado enseña un hijo sin bloquear
- **THEN** no ofrece desbloquearlo

#### Scenario: El saldo de cada hijo

- **WHEN** el padre mira su listado de perfiles
- **THEN** ve el saldo de cada uno con la pieza de monedas

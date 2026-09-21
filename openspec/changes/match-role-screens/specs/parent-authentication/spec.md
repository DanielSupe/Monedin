# parent-authentication

## ADDED Requirements

### Requirement: La cuenta explica lo que cuesta cerrar sesión y en qué se diferencia el PIN

La pantalla de la cuenta SHALL decir, junto a cerrar sesión, que para volver habrá que teclear el
correo y la contraseña; y SHALL decir, junto a donde se cambia el PIN, para qué sirve cada una de las
dos credenciales.

Que cerrar sesión y cambiar de perfil sean distintos ya estaba resuelto poniéndolos en pantallas
distintas, pero eso lo sabe quien conoce la decisión y no quien mira el botón. Lo que hace falta
antes de pulsar no es que son distintos, sino qué ocurre: que este dispositivo se desvincula.

Y el registro explica las dos credenciales una vez, hace meses. Donde hace falta otra vez es donde
alguien está a punto de cambiar una.

Una pista del asistente NO SHALL contar como esa explicación: vive dentro de un globo que hay que
abrir, y esto tiene que estar al lado del control.

#### Scenario: Alguien va a cerrar sesión

- **WHEN** mira el control de cerrar sesión
- **THEN** lee al lado que para volver habrá que teclear el correo y la contraseña

#### Scenario: Alguien va a cambiar su PIN

- **WHEN** mira la sección del PIN
- **THEN** lee para qué sirve el PIN y para qué la contraseña

### Requirement: La cuenta dice de quién es antes de enumerar lo que cambia

El antetítulo de la pantalla de la cuenta SHALL decir que lo que hay allí es del adulto y no de sus
hijos.

En una tablet que comparte toda la familia, la confusión real no es qué se puede cambiar sino a quién
se le cambia. Enumerar el contenido —«tu foto, tu PIN y tu sesión»— no avisa de eso.

#### Scenario: Se abre la cuenta

- **WHEN** se lee su encabezado
- **THEN** dice que lo de esa pantalla es del adulto y no de un hijo

### Requirement: La pantalla del hijo que se edita dice a quién se está editando

La pantalla de edición de un perfil SHALL identificar al hijo: su nombre, y las cifras que confirman
que es el que se quería —su edad y su saldo—.

Se llega desde una lista de caras, y un formulario que solo dice «Editar perfil» deja esa pregunta
contestada por lo que el formulario trajera dentro.

El TÍTULO SHALL seguir nombrando la operación y no al hijo: el título de una pantalla dice qué se
hace allí, y con el nombre de un hijo de título la pantalla deja de decir para qué sirve.

Si el perfil está bloqueado, SHALL decirlo, porque explica por qué alguien ha llegado ahí. La acción
de desbloquear NO SHALL duplicarse aquí: informar en dos pantallas está bien, tener la misma mutación
en dos sitios son dos caminos.

#### Scenario: Se abre la edición de un hijo

- **WHEN** se mira la pantalla
- **THEN** su título dice que se está editando un perfil
- **AND** se puede leer de qué hijo se trata, con su edad y su saldo

#### Scenario: El perfil está bloqueado

- **WHEN** se abre su edición
- **THEN** la pantalla lo dice

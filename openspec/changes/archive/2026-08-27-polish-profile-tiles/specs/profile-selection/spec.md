## ADDED Requirements

### Requirement: El perfil del adulto se distingue del de los hijos

En la rejilla, el perfil del adulto SHALL distinguirse visualmente de los de los hijos, y esa
distinción SHALL anunciarse también a quien no ve la pantalla.

Hoy solo se distingue por la foto, si el adulto puso una, y por nada si no la puso. En un aparato
compartido, el perfil que abre las tareas y los premios de toda la familia no puede parecer uno más.

La distinción SHALL salir del rol que la rejilla ya conoce y NO SHALL exigir ningún dato nuevo del
servidor.

#### Scenario: Se muestra la rejilla de una familia

- **WHEN** se listan los perfiles
- **THEN** el del adulto se presenta con una marca que los de los hijos no tienen

#### Scenario: Alguien que no ve la pantalla

- **WHEN** se recorre la rejilla con un lector de pantalla
- **THEN** el perfil del adulto se anuncia como tal
- **AND** no hace falta ver la marca para saber cuál es

### Requirement: Los perfiles responden al señalarlos

Cuando se señale un perfil con un puntero, la tesela SHALL responder de forma perceptible.

Ese realce SHALL usar movimiento **solo cuando el sistema de quien mira no lo desaconseje**. Con
movimiento reducido, la tesela SHALL seguir respondiendo por un medio que no sea movimiento, y NO
SHALL limitarse a hacer el mismo movimiento más deprisa.

#### Scenario: Se señala un perfil con el ratón

- **WHEN** el puntero entra en una tesela
- **THEN** la tesela se realza

#### Scenario: Se señala un perfil con movimiento reducido

- **WHEN** el sistema pide movimiento reducido y el puntero entra en una tesela
- **THEN** la tesela sigue realzándose
- **AND** no cambia de tamaño

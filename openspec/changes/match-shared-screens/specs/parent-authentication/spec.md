# parent-authentication

## ADDED Requirements

### Requirement: Las pantallas de acceso encabezan con lo que se viene a hacer

En entrar y en registrarse, el elemento más grande del panel del formulario SHALL ser **a cuál de los
dos se ha llegado**, y el saludo SHALL quedar por encima como antetítulo.

Era al revés: «¡Bienvenido!» ocupaba el tamaño grande y lo que distingue las dos pantallas se leía de
letra pequeña debajo. Un saludo no dice nada que ayude a nadie a decidir, y esta es la única pantalla
del producto que mira un adulto antes de confiar en él.

El panel de presentación SHALL llevar además la frase del producto, la que no cambia entre las dos
pantallas, tomada de donde ya vive en el catálogo y no escrita otra vez.

#### Scenario: Se llega a entrar

- **WHEN** se abre la pantalla de entrar
- **THEN** su encabezado dice que se va a entrar a una cuenta, y el saludo queda por encima

#### Scenario: Se llega a registrarse

- **WHEN** se abre la pantalla de registro
- **THEN** su encabezado dice que se va a crear una cuenta, y el saludo queda por encima

#### Scenario: Las dos dicen qué es Monedín

- **WHEN** se mira cualquiera de las dos
- **THEN** su panel de presentación lleva la frase del producto, y es la misma en las dos

### Requirement: La acción principal del acceso lleva su nombre a la vista

El control que envía cualquiera de los dos formularios de acceso SHALL llevar su nombre **escrito**,
y NO SHALL llevarlo solo en su etiqueta accesible.

Era una flecha redonda con el nombre en `aria-label`: existía para quien no ve la pantalla y no para
quien la mira. En la única pantalla donde un adulto decide si el producto es de fiar, una flecha sin
palabra obliga a deducir qué va a pasar al pulsarla.

SHALL ocupar el ancho de su panel, que es lo que la distingue de una acción cualquiera.

#### Scenario: Alguien mira el formulario

- **WHEN** se abre entrar o registrarse
- **THEN** su acción principal lleva escrito lo que hace

#### Scenario: No queda ninguna acción sin palabra

- **WHEN** se revisan las dos pantallas de acceso
- **THEN** ninguna acción principal se ofrece solo como icono

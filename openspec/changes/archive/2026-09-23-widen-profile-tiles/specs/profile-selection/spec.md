# profile-selection

## ADDED Requirements

### Requirement: La cara de un perfil cabe dentro de su tesela con aire

La tesela de un perfil SHALL ser más ancha que la cara que lleva dentro, de modo que el dibujo no
toque su borde ni lo pise, y que la corona del adulto —que se coloca sobresaliendo de la esquina de
la cara— quede dentro de la tarjeta.

Hoy las dos miden lo mismo: 144 px de tesela y 144 px de círculo. La cara llega al borde, lo pisa por
los 2 px que el borde ocupa hacia dentro, y la corona se sale. Leída de lejos, la tarjeta parece
estrecha; su maqueta es casi cuadrada y la cara ocupa poco más de la mitad de su ancho.

Agrandar la cara hasta el borde no compra nada de lo que buscaba: el objetivo de toque es la **tesela
entera** y no el círculo, y la tesela es varias veces más alta que un dedo.

La tesela SHALL aprovechar el ancho disponible cuando lo haya, sin bajar del mínimo que el caso
estrecho exige: en la pantalla más angosta que el producto contempla tienen que caber **dos**
columnas de teselas.

#### Scenario: Se abre la rejilla

- **WHEN** se muestran los perfiles de una familia
- **THEN** cada tesela declara un ancho mayor que la talla de la cara que contiene

#### Scenario: El hueco para crear un perfil sigue la misma medida

- **WHEN** se muestra el hueco para crear un perfil
- **THEN** su marca de «más» mide lo mismo que la cara de los perfiles que lo acompañan

#### Scenario: Un nombre largo no toca el borde de su tesela

- **WHEN** un perfil tiene un nombre que ocupa el ancho de la tesela
- **THEN** el nombre lleva su propio margen lateral
- **AND** ese margen no se le resta al ancho de la cara

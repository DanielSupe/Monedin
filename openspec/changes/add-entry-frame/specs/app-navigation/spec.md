## ADDED Requirements

### Requirement: Las pantallas previas a tener un rol también reciben marco

Las pantallas por las que se pasa **antes de que exista un actor** —el acceso, la rejilla, el teclado
de PIN, el alta de un perfil y el restablecimiento del PIN— SHALL recibir un marco propio, y NO
SHALL quedarse sin marca.

El marco SHALL mostrar la marca del producto en la parte superior izquierda y SHALL centrar su
contenido **horizontal y verticalmente** en el espacio disponible.

Sin esto, se entra por una página con marca, se pasa por cuatro pantallas anónimas y la marca vuelve
al final. Quien está en un paso intermedio no tiene nada que le diga dónde está, y el contenido queda
pegado al borde superior con la pantalla vacía debajo.

Qué pantallas son SHALL deducirse del estado —no hay actor y la ruta no pide el ancho completo— y NO
SHALL escribirse como una lista de direcciones. Una lista se desincroniza en cuanto alguien renombra
o añade una ruta, y nada lo detecta.

#### Scenario: Se está eligiendo perfil

- **WHEN** se muestra cualquiera de las pantallas previas a tener un rol
- **THEN** la marca del producto se ve en la parte superior izquierda
- **AND** el contenido queda centrado en la pantalla

#### Scenario: Se avanza de un paso al siguiente

- **WHEN** se pasa de la rejilla al teclado de PIN
- **THEN** la marca sigue en el mismo sitio
- **AND** no cambia el encuadre del contenido

#### Scenario: Ya hay un perfil activo

- **WHEN** hay un actor
- **THEN** se ve el marco de su rol y no el de entrada

#### Scenario: La puerta pública trae el suyo

- **WHEN** se muestra una pantalla que pide el ancho completo
- **THEN** se rinde sin el marco de entrada
- **AND** no se muestran dos marcas a la vez

#### Scenario: Se añade una pantalla previa al rol

- **WHEN** se añade un destino nuevo que se alcanza sin actor
- **THEN** recibe el marco de entrada sin declararlo en ninguna lista

### Requirement: La rejilla se toca con el dedo de un niño

Los perfiles de la rejilla SHALL presentarse con un área tocable holgada, pensada para el dedo de un
niño de seis años y no para el cursor de un adulto.

La medida SHALL salir del sistema de diseño y NO SHALL escribirse en la pantalla que la usa: si una
pieza compartida no tiene la talla que hace falta, se le añade la talla.

#### Scenario: Se elige perfil en una tablet

- **WHEN** se muestra la rejilla
- **THEN** cada perfil ofrece un área tocable claramente mayor que el mínimo del sistema

#### Scenario: La talla no se improvisa

- **WHEN** una pantalla necesita un avatar de un tamaño que la pieza no ofrece
- **THEN** la talla se añade a la pieza
- **AND** no se escribe una medida suelta en la pantalla

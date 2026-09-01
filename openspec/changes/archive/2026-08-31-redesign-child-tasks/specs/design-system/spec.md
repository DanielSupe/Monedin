## ADDED Requirements

### Requirement: Elegir un archivo no depende del control nativo del navegador

El control para elegir una imagen SHALL presentarse con las piezas del sistema, y NO SHALL mostrar el
control de archivo nativo del navegador.

No es solo aspecto. El ancho mínimo intrínseco de ese control ronda los 360 píxeles y **arrastra a
cualquier columna que lo contenga**: dos pantallas del niño desbordaban por él a 390 px, y ninguna de
las dos lo tenía en su propio código. Un control que impone su medida a la disposición que lo rodea
no se puede vestir desde fuera.

El control nativo SHALL seguir existiendo, porque es lo que abre el selector del sistema, pero SHALL
quedar oculto detrás de la pieza que lo dispara, sin dejar de ser alcanzable con el teclado ni de
anunciarse a quien no ve la pantalla.

#### Scenario: Elegir una foto en una pantalla estrecha

- **WHEN** se muestra el control de subir imagen en una pantalla de 390 píxeles
- **THEN** no obliga a su contenedor a ser más ancho que la pantalla

#### Scenario: Se elige una foto con el teclado

- **WHEN** se recorre la pantalla con el teclado y se activa el control
- **THEN** se abre el selector de archivos del sistema

#### Scenario: Se anuncia lo que hace

- **WHEN** se recorre el control con un lector de pantalla
- **THEN** se anuncia como un control para elegir una imagen

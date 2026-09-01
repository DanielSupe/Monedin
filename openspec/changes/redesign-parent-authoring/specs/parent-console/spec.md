## ADDED Requirements

### Requirement: Elegir a quién y por cuánto se resuelve en un solo sitio

Repartir una tarea y publicar un premio piden lo mismo: **a qué hijos** y **cuántas monedas a cada
uno**, con los dos modos —el mismo valor para todos, o uno por hijo—. Eso SHALL resolverse con una
pieza compartida. NO SHALL escribirse una vez por pantalla.

Hoy está escrito tres veces: entero en las dos altas, casi línea por línea, y una tercera vez dentro
del catálogo para reasignar precios. Tres copias de la misma decisión de negocio es cómo una de ellas
acaba comportándose distinto sin que nadie lo note.

La pieza SHALL exigir que se elija al menos un hijo antes de enviar, y SHALL decirlo antes de
rechazar y no después.

#### Scenario: Se reparte una tarea y se publica un premio

- **WHEN** se comparan las dos pantallas de alta
- **THEN** eligen hijos y precios con la misma pieza
- **AND** se comportan igual en los dos modos

#### Scenario: Se cambia al modo de precio por hijo

- **WHEN** se pasa de «el mismo valor» a «uno por hijo»
- **THEN** cada hijo elegido pide su propia cantidad

#### Scenario: No se ha elegido a nadie

- **WHEN** se intenta guardar sin ningún hijo elegido
- **THEN** se explica qué falta
- **AND** no se envía nada al servidor

### Requirement: Una pantalla de escritura es un formulario

Toda pantalla donde el padre escriba SHALL ser un `<form>` con su botón de envío. NO SHALL ser un
contenedor con un botón que llama a una función.

Escribir un título y pulsar Enter es lo que hace cualquiera, y hoy no hace nada en dos de las tres:
son un `<section>` con un `type="button"`. La tercera sí es un formulario, así que la misma acción
responde distinto según la pantalla dentro del mismo producto.

#### Scenario: Se envía con el teclado

- **WHEN** el padre escribe en un campo y pulsa Enter
- **THEN** el formulario se envía

#### Scenario: Falta algo

- **WHEN** el envío no pasa la validación
- **THEN** se explica qué falta
- **AND** no se llama al servidor

### Requirement: Un premio se edita donde se ve

Editar el título, la foto y los precios de un premio SHALL ocurrir en el propio catálogo, sin cambiar
de dirección.

Es un retoque pequeño y frecuente —subir un precio, cambiar una foto—, y sacarlo a otra pantalla
obliga a ir y volver por cada cambio.

Queda anotada la asimetría con los perfiles de hijo, que sí se editan en su propia ruta:
`redesign-parent-children` es quien mira esa otra mitad y quien decide si se unifican.

#### Scenario: Se cambia el precio de un premio

- **WHEN** el padre edita lo que ofrece un premio
- **THEN** lo hace sin salir del catálogo

#### Scenario: Se abandona la edición

- **WHEN** el padre deja de editar sin guardar
- **THEN** el premio se ve como estaba

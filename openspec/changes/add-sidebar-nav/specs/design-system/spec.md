## ADDED Requirements

### Requirement: El sistema ofrece un panel lateral, y no se escribe a mano

El sistema SHALL ofrecer una pieza de panel lateral que atrape el foco mientras esté abierta, cierre
con Escape, deje inerte el resto del documento y devuelva el foco al control que la abrió. Ninguna
pantalla SHALL implementar ese comportamiento por su cuenta.

Es el mismo criterio que ya justifica que el diálogo modal vaya sobre una base probada: nada de eso
se escribe bien a mano, y lo peor es que roto **no se nota** hasta que alguien lo necesita de verdad.

La pieza SHALL recibir su disparador y su contenido de quien la usa, y NO SHALL importar el router ni
conocer el dominio, igual que el resto de las piezas.

#### Scenario: Se abre y se cierra con el teclado

- **WHEN** se activa el disparador con el teclado
- **THEN** el foco entra en el panel
- **WHEN** se pulsa Escape
- **THEN** el panel se cierra y el foco vuelve al disparador

#### Scenario: Se monta en el catálogo

- **WHEN** el catálogo vivo dibuja la pieza
- **THEN** se monta sin router y sin proveedores

### Requirement: Un panel lateral no es un diálogo centrado, y no se le impone con clases

El panel lateral SHALL ser una pieza propia. NO SHALL obtenerse pasándole clases al diálogo modal.

`cx` no fusiona utilidades de Tailwind, así que colocar un diálogo centrado a la izquierda con clases
desde fuera deja dos posiciones en la misma cadena y gana la que decida el orden del CSS generado —un
fallo que no se ve leyendo y que no tiene por qué ser estable entre compilaciones—. Es la misma razón
por la que la forma de un avatar es una prop.

Sus formas además difieren de verdad: el diálogo es título, descripción, cuerpo y pie de botones, y
se abre sin disparador; el panel es una superficie de navegación con disparador propio.

#### Scenario: Se necesita un panel lateral

- **WHEN** una pantalla necesita un panel anclado a un lado
- **THEN** usa la pieza de panel lateral
- **AND** no el diálogo modal con clases de posición

### Requirement: El aspecto de un destino de navegación lo exporta quien lo define

Cuando varios enlaces compartan el aspecto de un elemento de navegación, ese aspecto SHALL exportarse
como clases desde un único sitio. NO SHALL escribirse en cada enlace.

Es el mismo precedente que `buttonClasses` y `tabLinkClasses`: cuando el destino es una dirección el
control es un enlace, y el aspecto tiene que vivir en un solo sitio para que las variantes no se
separen.

#### Scenario: Se añade un destino a la navegación

- **WHEN** se añade un enlace a la lista de destinos
- **THEN** toma su aspecto de las clases exportadas
- **AND** no declara el suyo propio

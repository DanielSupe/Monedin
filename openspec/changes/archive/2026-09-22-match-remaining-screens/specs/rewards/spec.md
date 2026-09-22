# rewards

## ADDED Requirements

### Requirement: El catálogo del padre se lee sin fotos

En el catálogo del padre, un premio SHALL ocupar el alto de su contenido y NO SHALL reservar para su
imagen un espacio que domine la tarjeta.

El estado normal de una familia que empieza es un catálogo SIN fotos. Con la imagen a todo el ancho,
cada premio gastaba el alto de una pantalla en enseñar un hueco, y cuatro premios no cabían a la vez.

La talla de la imagen SHALL declararla la pieza que la dibuja, y NO SHALL imponerse desde la pantalla
que la coloca.

El escaparate del niño NO SHALL cambiar: allí la imagen es lo que se mira y la tesela cuadrada es lo
que permite comparar dos precios de un vistazo.

#### Scenario: Un catálogo sin fotos

- **WHEN** se abre el catálogo con varios premios sin imagen
- **THEN** caben varios en una pantalla

#### Scenario: Se compara con el escaparate del niño

- **WHEN** se miran las dos pantallas
- **THEN** la del niño conserva su tesela cuadrada

### Requirement: Las ofertas de un premio se leen de un vistazo

Las ofertas de un premio SHALL enseñarse en línea, con el hijo y su precio juntos, y NO SHALL ocupar
un renglón por hijo.

Lo que esa pantalla responde es a quién se le ofrece y por cuánto. En columna, cada hijo gastaba un
renglón entero para dos datos cortos.

El conjunto SHALL seguir teniendo nombre para quien no ve la pantalla, aunque no se dibuje: un nombre
y una cifra sueltos detrás del título de un premio no dicen de qué son.

#### Scenario: Un premio ofrecido a varios hijos

- **WHEN** se mira su tarjeta
- **THEN** los hijos y sus precios se leen sin recorrer una columna

#### Scenario: Se recorre con un lector de pantalla

- **WHEN** se llega a la lista de ofertas
- **THEN** se anuncia qué es esa lista

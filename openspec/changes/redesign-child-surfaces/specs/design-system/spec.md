## ADDED Requirements

### Requirement: El sistema ofrece filas de datos alineadas, y no se escriben a mano

El sistema SHALL ofrecer una pieza para presentar **datos tabulares**: encabezados de columna y filas
cuyos valores caen en las mismas posiciones. Una pantalla que necesite esa forma SHALL usarla y NO
SHALL escribir su propia tabla.

Es la razón por la que existe `Pagination`: un bloque copiado en dos pantallas son dos bloques que se
separan. Aquí pesa más, porque una tabla accesible tiene partes fáciles de olvidar —el nombre de la
tabla, el ámbito de cada encabezado— y olvidarlas no rompe nada visible.

La pieza SHALL anunciarse como datos tabulares, con cada encabezado asociado a su columna, y SHALL
llevar un nombre que diga de qué es la tabla.

La pieza NO SHALL conocer el dominio: recibe sus encabezados y sus filas ya compuestos, como
`Pagination` recibe sus enlaces. NO SHALL importar nada de `features/` ni de `api/`, de modo que se
pueda montar en un test sin proveedores y en el catálogo vivo sin aplicación.

La pieza SHALL cubrir el caso de **ninguna fila** sin dibujar una tabla vacía con encabezados.

Su contenido ancho SHALL poder desplazarse dentro de la propia pieza, sin que la página entera se
desplace en horizontal.

#### Scenario: Se montan unas filas de datos

- **WHEN** se monta la pieza con unos encabezados y unas filas
- **THEN** se anuncia como una tabla con nombre
- **AND** cada valor queda asociado al encabezado de su columna

#### Scenario: Sin filas

- **WHEN** se monta la pieza sin ninguna fila
- **THEN** no dibuja una tabla con encabezados y nada debajo

#### Scenario: La pieza no sabe de dominio

- **WHEN** se revisan sus importaciones
- **THEN** no importa nada de `features/` ni de `api/`

#### Scenario: La pieza está en el catálogo vivo

- **WHEN** se abre el catálogo de piezas
- **THEN** la pieza aparece con sus estados

### Requirement: Una pantalla que cuenta sus elementos no repite la cifra a mano

Cuando una pantalla anuncie **cuántos elementos** tiene, esa cifra SHALL componerse en el punto de uso
a partir de los datos, y el texto del catálogo de mensajes NO SHALL llevar ninguna cifra dentro.

Es la misma regla que ya cubre los números de negocio dentro de un texto, y por el mismo motivo: al
código lo protege un esquema y al texto no lo protege nada, así que una cifra escrita en una cadena
sobrevive al cambio que la deja mintiendo.

#### Scenario: El texto no lleva la cifra dentro

- **WHEN** se revisan las cadenas del catálogo de mensajes
- **THEN** ninguna lleva una cifra dentro

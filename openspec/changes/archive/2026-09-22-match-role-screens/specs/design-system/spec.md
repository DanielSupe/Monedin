# design-system

## ADDED Requirements

### Requirement: Una fecha visible se escribe en un solo sitio, y en el idioma del producto

El formato con el que el producto escribe una fecha SHALL decidirse en un solo sitio, y ninguna
pantalla SHALL elegir el suyo.

Es una decisión del producto, como el tamaño de un título o el mínimo de una contraseña. Escrita en
cada pantalla, cuatro acabaron con tres formatos distintos y la quinta habría inventado el cuarto.

La configuración regional SHALL declararse y NO SHALL heredarse del dispositivo. Un producto entero
en español que deja la fecha al dispositivo imprime el mes antes del día en un teléfono en inglés, y
quien desarrolla no lo ve nunca porque el suyo está en español.

#### Scenario: Una pantalla enseña una fecha

- **WHEN** cualquier pantalla escribe una fecha
- **THEN** sale con el formato del producto, sea cual sea la configuración del dispositivo

#### Scenario: Una pantalla nueva necesita escribir una fecha

- **WHEN** se añade una pantalla que enseña fechas
- **THEN** usa la del producto en vez de decidir un formato, y no hacerlo falla una verificación

### Requirement: El nombre de un grupo de opciones se ve, no solo se oye

Un grupo de opciones excluyentes SHALL mostrar en pantalla qué se está eligiendo, y NO SHALL dejar
ese nombre únicamente en su etiqueta accesible.

Existe para que dos opciones se COMPAREN sin abrir nada. Sin la pregunta delante, «el mismo valor
para todos» y «uno para cada uno» no dicen el mismo valor de qué.

El nombre SHALL seguir atado al grupo además de dibujarse: un texto colocado al lado no nombra un
grupo por estar cerca.

#### Scenario: Se mira un grupo de opciones

- **WHEN** se abre una pantalla que ofrece elegir entre dos modos
- **THEN** la pregunta que los distingue está en la pantalla
- **AND** el grupo sigue anunciándose con ella

### Requirement: Un valor que se reparte dice a cuántos va

Cuando un valor se aplique a varios destinatarios a la vez, la pantalla SHALL decir a cuántos va, y
NO SHALL dejarlo a deducir de la cifra.

Es la duda que cuesta dinero si se entiende al revés: si ocho monedas son ocho en total o ocho para
cada hijo elegido.

La cifra y su unidad SHALL componerse donde se usan y declinar con el número, para que un valor de
uno no diga «1 monedas».

#### Scenario: Se escribe un valor para todos

- **WHEN** se pone un valor que reciben todos los elegidos
- **THEN** la pantalla dice que es para cada uno

#### Scenario: El valor es uno

- **WHEN** se escribe uno
- **THEN** la unidad va en singular

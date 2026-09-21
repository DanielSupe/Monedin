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

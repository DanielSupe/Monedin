# design-system

## ADDED Requirements

### Requirement: La escala y el peso salen de las maquetas, y se pueden medir

Los pasos de cada escala tipográfica y el registro de pesos del sistema SHALL corresponder a lo que
las maquetas de referencia usan, y esa correspondencia SHALL ser verificable contando las
declaraciones de los artboards en lugar de mirándolos.

Los artboards son HTML con estilos en línea, así que cada tamaño y cada peso se puede contar. Eso
convierte «se ve distinto» en una cifra, y es lo que permite distinguir un defecto de una pantalla de
un defecto del sistema: si la aplicación escribe 30px donde la maqueta escribe 16 en dieciocho
sitios, lo que está mal es el token.

El registro de pesos SHALL declararse en la capa de tokens y NO SHALL reescribirse en cada pieza. Una
pieza pide «semibold» y lo que cambia es a qué apunta esa palabra en este producto, igual que un
color semántico cambia de valor sin que ninguna pieza se entere.

Cuando el registro declarado haga que un nombre signifique algo distinto de su valor habitual, SHALL
decirse en el propio archivo de tokens. Una palabra que significa otra cosa sin avisar es peor que un
valor raro.

#### Scenario: Se compara una pantalla con su maqueta

- **WHEN** se cuentan los tamaños y pesos de una pantalla y los de su maqueta
- **THEN** los pasos que domina cada una son los mismos

#### Scenario: El diseño ajusta su registro tipográfico

- **WHEN** las maquetas cambian el peso con el que se escribe el producto
- **THEN** se ajusta en la capa de tokens, sin tocar ninguna pieza ni ninguna pantalla

#### Scenario: Una cifra de la aplicación no sale de la maqueta

- **WHEN** un paso de la escala se aparta de lo que la maqueta usa por una decisión de producto
- **THEN** esa decisión queda escrita donde vive el token, en lugar de corregirse en silencio

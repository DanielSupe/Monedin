# app-navigation

## ADDED Requirements

### Requirement: La columna de navegación no pesa lo mismo en todas las pantallas

Cuando la navegación esté delante como columna, su ancho SHALL tener en cuenta el que le queda al
contenido: SHALL ser más estrecha en las ventanas donde el sitio escasea y ensancharse donde sobra.

Una medida fija pesa distinto según lo que tenga alrededor. La columna se monta desde que hay ancho
para ella, y en la ventana más estrecha que la recibe una medida pensada para un monitor grande se
lleva más de la cuarta parte de la pantalla.

NO SHALL estrecharse tanto que el nombre de un destino deje de caber: lo que nombra un destino es su
texto, y un texto partido en dos renglones o recortado deja de nombrarlo.

#### Scenario: La ventana más estrecha que recibe la columna

- **WHEN** la pantalla es ancha por poco
- **THEN** la columna usa su medida estrecha
- **AND** los nombres de los destinos siguen cabiendo en una línea

#### Scenario: Una ventana amplia

- **WHEN** hay ancho de sobra
- **THEN** la columna usa su medida amplia

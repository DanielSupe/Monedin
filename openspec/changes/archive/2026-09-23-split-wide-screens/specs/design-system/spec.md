# design-system

## ADDED Requirements

### Requirement: Una pantalla con panel de apoyo lo coloca al lado cuando hay ancho

Cuando una pantalla tenga un contenido principal y un panel que lo apoya —que explica, resume o
remata—, y haya ancho para los dos, el sistema SHALL colocarlos **lado a lado**, con el principal
más ancho que el de apoyo. Sin ancho, SHALL apilarlos.

El reparto SHALL declararlo **una** pieza del sistema y NO cada pantalla por su cuenta: son varias
las que lo necesitan, y que cada una escriba su propia rejilla es cómo dejan de parecerse.

El panel de apoyo SHALL ir **después** del contenido principal en el orden del documento, en los dos
anchos. Quien recorre la pantalla con teclado o con un lector llega primero a lo que hay que hacer y
después a lo que lo explica, igual que quien la mira.

#### Scenario: Una pantalla con panel de apoyo

- **WHEN** se monta una pantalla que declara contenido principal y panel de apoyo
- **THEN** los dos están en la misma banda
- **AND** el panel de apoyo viene después del contenido en el documento

#### Scenario: El panel no se estira con el contenido

- **WHEN** el contenido principal es más alto que el panel
- **THEN** el panel conserva su propia altura

## ADDED Requirements

### Requirement: La navegación que está delante sigue delante después de desplazar

Cuando la navegación esté delante como columna del marco, SHALL permanecer visible **entera** al
desplazar el contenido, incluido su pie —el perfil y el control de contraer—.

La columna NO SHALL crecer con el largo de la página. Hoy lo hace: el marco no acota su altura, así
que se estira hasta el final del documento y su pie se va con el desplazamiento. Una navegación que
desaparece al leer un listado largo no está delante; está delante **al principio**, que es otra cosa.

Lo que SHALL desplazarse en ese caso es el contenido, y no el documento entero.

Si los destinos no cupieran en la altura de la pantalla, SHALL desplazarse **dentro de la propia
columna**, sin que el pie deje de verse.

En pantalla estrecha NO SHALL cambiar nada: allí la navegación se abre y se cierra sobre el
contenido, y atar la altura de la pantalla pelea con la barra del navegador de un móvil, que aparece
y desaparece al desplazar.

#### Scenario: Se desplaza una pantalla larga

- **WHEN** hay un perfil activo, la pantalla es ancha y se desplaza un listado largo
- **THEN** la navegación sigue visible con todos sus destinos
- **AND** su pie sigue visible

#### Scenario: El pie está al final de la pantalla, no al final de la página

- **WHEN** se abre una pantalla más larga que la ventana
- **THEN** el pie de la navegación se ve sin desplazar

#### Scenario: Muchos destinos

- **WHEN** los destinos no caben en la altura de la ventana
- **THEN** se desplazan dentro de la columna
- **AND** el pie sigue visible

#### Scenario: En pantalla estrecha se desplaza como siempre

- **WHEN** la pantalla es estrecha
- **THEN** la navegación sigue detrás de su control
- **AND** el documento se desplaza como hasta ahora

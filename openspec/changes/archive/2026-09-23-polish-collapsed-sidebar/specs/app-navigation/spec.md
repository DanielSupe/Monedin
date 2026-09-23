# app-navigation

## ADDED Requirements

### Requirement: Contraída, la navegación cabe en su columna

Con la navegación contraída a solo iconos, nada de lo que dibuja SHALL salirse de la columna ni
desplazar al icono de su centro.

Una cuenta de cosas pendientes NO SHALL dibujar su cifra en esa forma: no cabe, y al ocupar sitio en
la fila empuja al icono contra el borde contrario. SHALL quedar en su lugar una marca que diga que
hay algo esperando, sin decir cuántos.

La cuenta NO SHALL perderse para quien no ve la pantalla: el texto que ya la anunciaba SHALL seguir
entero. Lo que se quita es el dibujo, no el dato.

Un glifo decorativo al final de una fila —el que acompaña al perfil— NO SHALL dibujarse en esa forma:
comparte sitio con el avatar, y contraído solo compite con él.

#### Scenario: Hay tareas esperando y la navegación está contraída

- **WHEN** la pantalla es ancha, hay cosas esperando y se contrae la navegación
- **THEN** la cifra no se ve
- **AND** el destino sigue anunciando cuántas hay para quien no ve la pantalla

#### Scenario: La misma cuenta con la navegación extendida

- **WHEN** la pantalla es ancha, hay cosas esperando y la navegación está extendida
- **THEN** la cifra se ve junto al nombre de su destino

#### Scenario: El pie del perfil con la navegación contraída

- **WHEN** la navegación está contraída
- **THEN** la fila del perfil se queda con su avatar
- **AND** el glifo que la acompañaba no está en el documento

### Requirement: El control de contraer encabeza la navegación

El control que contrae la navegación SHALL ir **antes** que los destinos en el orden del documento, en
una cabecera propia de la columna, y NO SHALL ir al final, debajo del perfil.

Es el control del marco y no un destino más. Al final de la lista queda detrás de todo lo que se usa a
diario, que es el último sitio donde se busca. Arriba es donde se busca y donde lo ponen las
bibliotecas de las que este marco copia su forma.

SHALL seguir existiendo solo cuando la navegación está delante: en pantalla estrecha es un cajón que
se abre encima y no hay nada que contraer.

#### Scenario: Se recorre la navegación con teclado

- **WHEN** la pantalla es ancha y hay un perfil activo
- **THEN** el control de contraer se alcanza antes que el primer destino

#### Scenario: En pantalla estrecha no hay control de contraer

- **WHEN** la pantalla es estrecha
- **THEN** no existe control de contraer

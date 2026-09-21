## Context

El método ya está probado en las ocho compartidas: se extrae el texto visible de
cada maqueta y de su pantalla, en orden, y se comparan las dos listas. Una
diferencia de contenido sale como un renglón que falta y una de jerarquía como
dos intercambiados.

Lo que cambia aquí es la escala del trabajo: veinticuatro pantallas en vez de
ocho. Así que primero se resuelve lo que es de TODAS y después lo de cada una;
al revés, la misma corrección se escribiría veinticuatro veces.

## Goals / Non-Goals

**Goals**

- Que ningún renglón de una maqueta falte en su pantalla sin que esté escrito por
  qué.
- Que lo que se repite en varias pantallas se corrija en un solo sitio.

**Non-Goals**

- El color.
- Reabrir las decisiones de producto que las maquetas contradicen.

## Decisions

### 1. Las fechas las escribe UNA función, con el idioma del producto

Hoy las escriben cuatro sitios de tres maneras, y los cuatro pasan `undefined`
como configuración regional — o sea la del dispositivo. Un producto entero en
español imprime `9/21/2026` en un teléfono en inglés, y nadie lo ve porque el
dispositivo de quien desarrolla está en español.

Es exactamente el caso de la regla del origen único: el formato de una fecha es
una decisión del producto, como el tamaño de un título o el mínimo de una
contraseña, y vive en un sitio.

El idioma **se declara**, no se hereda. Y se declara junto a la función, no en
cada punto de uso.

**Alternativa descartada: arreglar los cuatro sitios dejándolos cuatro.** Es la
misma línea escrita cuatro veces, y la quinta pantalla que escriba una fecha
volvería a elegir su formato.

### 2. La ayuda es un destino del lateral, no un icono de la cabecera

`add-sidebar-nav` dejó escrito el argumento y lo aplicó a cinco destinos: «un
destino que solo se alcanza pulsando una foto sin texto no se encuentra». La
ayuda se quedó fuera, colgando de un icono sin palabra en la cabecera, que es la
misma forma del defecto.

Al moverla hay que quitarla de la cabecera y no dejarla en los dos sitios: el
test que enumera los destinos de cada rol prohíbe que uno aparezca dos veces en
el marco, y **la única excepción declarada es el perfil**. Dos accesos a la ayuda
serían una segunda excepción, y la pregunta entonces sería si sigue siendo una
excepción.

### 3. Cada pantalla se cierra antes de pasar a la siguiente

Se compara, se ajusta, se vuelve a comparar y se deja escrito lo que sigue sin
cuadrar y por qué. Lo que no se pueda cerrar sin una decisión de producto se
nombra en el apartado de lo que no incluye, en vez de resolverse por la puerta de
atrás.

## Risks / Trade-offs

- **Cambiar el formato de las fechas toca cuatro pantallas de golpe**, dos del
  padre y dos del niño. Es el precio de tenerlo en un sitio, y es el que se
  quiere pagar.
- **Mover la ayuda al lateral gasta un renglón** de una columna que ya lleva
  cinco destinos y el perfil. La maqueta lo dibuja así, y la alternativa medida
  es la que hay hoy: un destino que no se encuentra.

## Open Questions

- Ninguna que bloquee. Las dos que hay —el coral y el saldo del niño— están
  fuera de alcance a conciencia y nombradas en el proposal.

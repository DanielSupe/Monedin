# Diseño

## 1. La talla baja en la PIEZA, no en la pantalla

`Avatar` declara sus medidas y ninguna pantalla escribe píxeles. La regla ya estaba
escrita en su propia cabecera cuando `polish-profile-tiles` subió `xlarge`: «si a
`large` la tesela queda pequeña, la talla se le añade a la pieza y NO se escribe una
medida suelta en la pantalla que la usa». Bajarla se hace por el mismo sitio.

`xlarge` solo lo usan la rejilla y el catálogo vivo, así que el cambio no alcanza a
ninguna otra pantalla. Se comprobó antes de tocarlo.

**Descartado**: dejar `xlarge` en 144 y meter relleno lateral en la tesela. A 144 de
ancho con 2 de borde quedan 140 de caja de contenido; con 12 de relleno a cada lado
caben 116, y un círculo de 112 deja 2 px — la corona, que sobresale 4, seguiría
fuera. La aritmética no da: en un teléfono la tesela no puede crecer, así que lo que
tiene que bajar es la cara.

## 2. La tesela crece con el ancho disponible, y el teléfono manda en el mínimo

`w-36 sm:w-44`. El ancho de teléfono está medido y documentado: a 390 px hay 343
útiles en cuanto aparece la barra de desplazamiento, el hueco entre teselas son 24, y
dos teselas tienen que caber. Eso deja 159 por tesela, así que 144 es el escalón que
entra y 160 el que falla — **por un píxel**, y al caer a una columna la página se
alarga, la barra se queda y el salto se repite. Ese análisis sigue valiendo entero.

Lo que no valía es aplicarle ese techo a un monitor. A partir de `sm` no hay ninguna
razón para quedarse en 144, y 176 acerca la tesela a los 186 de la maqueta sin tocar
el caso estrecho.

**Descartado**: 186 exactos con un valor arbitrario. Un test prohíbe los valores
arbitrarios de Tailwind, y con razón — la escala existe para que dos pantallas no
elijan dos números parecidos. 176 es el escalón de al lado.

## 3. La altura es un MÍNIMO y la iguala la fila

`h-60` era un número fijo elegido para que ninguna tesela quedara más baja que otra.
Hace las dos cosas mal:

- Con la cara a 112 sobra hueco abajo en la tesela normal.
- Y se queda corto en la peor combinación que el producto puede producir: un nombre
  que parte en dos renglones **más** la insignia de «Bloqueado». Eso ya pasaba antes
  de este change.

La salida es la que el propio CSS ofrece: los elementos de una fila de `flex-wrap` se
estiran a la altura de la fila. Basta con que el `li` sea contenedor flexible para
que la tarjeta de dentro llene su altura, y con que la tesela declare un **mínimo** en
vez de una medida. Así la fila se iguala sola y crece solo lo que su contenido pida.

Con `flex-wrap` la igualación es **por fila**, no por rejilla entera. Es lo correcto:
lo que se compara de un vistazo son las caras que están una al lado de la otra.

## 4. El relleno lateral es del NOMBRE

Si el relleno se le pone a la tarjeta se lo quita al círculo, que es lo que no
sobra. Y quien lo necesita es el texto: un nombre largo tocando el borde. Se lo lleva
quien lo pide.

## 5. Qué test lo sostiene

Ninguno de los de hoy falla ante esta regresión, porque jsdom no aplica CSS y no hay
medidas que leer. Lo que sí se puede comprobar es la **declaración**: que el escalón
de ancho de la tesela sea mayor que el escalón de talla del avatar que lleva dentro.
Las dos son clases de Tailwind y están en el DOM renderizado.

Es la misma forma que «los dos ejes de `overflow` están declarados en el mismo sitio»:
cuando el resultado no se puede medir, se fija la elección. Y distingue de verdad —
con las dos medidas iguales, que es el estado de hoy, el test falla.

**Lo que ese test NO prueba** y queda como tarea manual: que la tesela se vea
equilibrada y que a 390 px sigan entrando dos columnas. Eso se mira abriendo la
aplicación.

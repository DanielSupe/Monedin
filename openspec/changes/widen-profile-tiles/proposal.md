# Ensanchar las teselas de la rejilla de perfiles

## Por qué

La cara ocupa la tesela ENTERA. Medido en el navegador: la tesela son 144 px de ancho
y el círculo del avatar son 144 px también, así que el dibujo llega hasta el borde
—y lo pisa, porque el borde son 2 px por dentro— y la corona del adulto, que se
coloca a −4 px de la esquina, se sale de la tarjeta.

El efecto que se ve es el que describe quien lo reportó: las tarjetas parecen
**estrechas**. No es solo el círculo apretado. La tesela mide 144 × 240, o sea
1 : 1,67 —alta y angosta—, y su maqueta mide 186 × 196, que es casi cuadrada. La
cara que va dentro ocupa el 56 % del ancho en la maqueta y el 100 % en la
aplicación.

De dónde salió: `polish-profile-tiles` subió el avatar a 9 rem «para el dedo de un
niño de seis años» y la tesela se dejó exactamente igual de ancha que él, con la
nota de que «la tesela mide EXACTAMENTE lo que el avatar». El objetivo de toque es
la tesela completa —240 px de alto—, no el círculo, así que agrandar el dibujo
hasta el borde no compraba nada de lo que buscaba y costó el aire de la tarjeta.

## Qué cambia

- El avatar `xlarge` baja de 144 px a 112 px, que es la proporción de la maqueta
  llevada a nuestra tesela.
- La tesela crece a partir de `sm`: 144 px en un teléfono —donde tiene que haber
  dos columnas— y 176 px en cuanto hay sitio, cerca de los 186 de la maqueta.
- La altura deja de ser un número fijo y pasa a ser un mínimo. Con la cara más
  pequeña, `h-60` dejaba un hueco muerto abajo; y un alto fijo ya se quedaba corto
  cuando un nombre parte en dos renglones y además hay insignia de bloqueado.
  Ahora las teselas de una fila se igualan entre ellas, que es lo que se quería.
- El relleno lateral se le pone al NOMBRE y no a la tarjeta, para que el nombre no
  toque el borde sin robarle ancho al círculo.

## No incluye

- La medida del teléfono no se toca: dos columnas a 390 px sigue siendo el
  requisito que fija el ancho mínimo, y el escalón de `w-40` sigue descartado por
  el bucle de la barra de desplazamiento que documenta `polish-profile-tiles`.
- El color del borde por rol, el lápiz del modo administrar y la corona se quedan
  como están.
- Las otras pantallas que usan `Avatar` no cambian: `xlarge` solo se usa aquí y en
  el catálogo vivo.

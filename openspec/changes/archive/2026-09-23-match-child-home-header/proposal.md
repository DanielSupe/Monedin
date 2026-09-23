# El saldo del niño, como lo pone su maqueta

## Por qué

Puesto el inicio del niño al lado de su maqueta, la diferencia que salta es el
saldo. La maqueta abre con una cabecera de una línea —la fecha y «Hola, Mateo» a
la izquierda, una píldora con las monedas a la derecha— y la aplicación gasta el
tercio superior de la pantalla en una tarjeta centrada con la cifra a tamaño
`hero`.

En una pantalla de 950 px de alto eso empuja las tareas por debajo del pliegue: lo
primero que un niño ve al entrar es cuánto tiene, y lo que viene a hacer hay que
buscarlo desplazando.

## Qué cambia

- **La cabecera del inicio pasa a la forma de la maqueta**: fecha y saludo a la
  izquierda, saldo en una píldora a la derecha. La píldora sigue llevando al
  historial, que es el gesto que ya existía sobre la cifra.
- **`Coins` estrena una talla intermedia.** Entre `normal` —el precio de una fila—
  y `hero` —media pantalla— no había nada, y la píldora pide justo eso.
- **«Cambiar de perfil» pasa a botón** de ancho completo al pie de la columna de
  apoyo, como lo dibuja la maqueta. Era un enlace de texto suelto.
- **Las tres últimas monedas del inicio pierden la fecha.** En el inicio son un
  resumen de tres líneas; la fecha se queda donde se viene a mirar, que es el
  historial.

## Lo que esto REVIERTE, dicho con todas las letras

El requisito `El saldo es lo principal del inicio del niño` dice hoy que el saldo
**SHALL ser el elemento más grande y lo primero que se lee**. Esta propuesta lo
contradice, y se cambia el requisito en el mismo change en vez de dejarlo
mintiendo.

El argumento que lo puso sigue siendo cierto a medias y se conserva: el saldo es lo
que el producto existe para enseñar, así que **no se esconde y no se dice dentro de
una frase**. Lo que deja de ser cierto es que para enseñarlo haga falta el tamaño
más grande de la pantalla. Una píldora con su moneda, en la esquina donde siempre
está, se encuentra igual de rápido y deja ver lo que hay que hacer.

Es la misma decisión que `match-role-screens` tomó al revés, y se toma otra vez con
las dos pantallas delante.

## Y el ancho del lateral, de la misma revisión

Medido: el lateral son 272 px y su maqueta 264 — 8 px, con la letra además más
pequeña (15 px frente a 17). O sea que **no estaba mal dibujado**.

Lo que sí estaba mal es que fuera una medida FIJA. La columna se monta a partir de
1024 px, y ahí 272 px son el 27 % de la pantalla; en la maqueta, dibujada a 1440,
son el 18 %. La misma medida pesa distinto según lo que tenga alrededor.

Pasa a dos medidas: 240 px de base —donde el sitio escasea— y los 272 desde `xl`,
que es el ancho para el que está dibujada la maqueta.

## No incluye

- El marco sigue sin mostrar el saldo: la píldora es de la PANTALLA de inicio, no
  de la cabecera de la aplicación. El requisito que lo prohíbe no se toca.
- El historial completo conserva su fecha por fila: ahí es lo que se viene a mirar.
- La banda de Monedín no cambia de forma en este change.

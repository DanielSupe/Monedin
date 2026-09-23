# Diseño

## 1. Qué se conserva del requisito que se revierte

El requisito tenía dos mitades y solo una se cae.

**Se cae**: «el elemento más grande y lo primero que se lee». Nació de un defecto
real —el saldo iba en negrita dentro de un párrafo, al tamaño de los enlaces de al
lado— y la cura fue el extremo contrario. En una pantalla de 950 px la tarjeta
empuja las tareas por debajo del pliegue: lo primero que ve un niño al entrar es
cuánto tiene, y lo que viene a hacer hay que buscarlo.

**Se queda, palabra por palabra**: que el saldo NO se presenta como un dato dentro
de una frase, que se dibuja con la pieza del sistema, y que se anuncia con su
unidad. Eso es lo que el requisito existía para impedir, y sigue impedido.

Lo que sustituye al tamaño es el SITIO: una píldora en la esquina superior derecha
del contenido, siempre la misma, con la moneda dibujada al lado. Se encuentra por
posición en vez de por tamaño.

## 2. La píldora lleva al historial, y eso no es adorno

La cifra era un enlace: «tocar el número y preguntar de dónde viene es el gesto
natural», y el historial del niño no tiene destino propio en su navegación — se
llega desde aquí. Si la píldora fuera estática, ese camino se perdería para quien
lo recorre con teclado, y hay un escenario vigente que dice que desde el inicio se
abre de dónde salió cada moneda.

La maqueta la dibuja estática, y aquí manda el requisito: **una maqueta manda en el
aspecto, no en los caminos que el producto garantiza.**

## 3. La talla intermedia la declara la pieza

`Coins` tenía `normal` —el precio de una fila— y `hero` —media pantalla—. La píldora
pide algo en medio, y la regla del proyecto es clara: la talla se le añade a la
pieza, nunca se escribe una medida suelta en la pantalla que la usa. Es lo mismo que
ya se hizo con `Avatar xlarge` y con `Button keypad`.

Se llama `large`, por su tamaño y no por su caso de uso — nombrar una opción por su
primer punto de uso es cómo se acaba escribiendo `forAvatar: true` para algo que no
es un avatar.

## 4. El ancla del recorrido se muda con el saldo

El recorrido de bienvenida ilumina `child-balance`. Si el atributo se quedara en la
tarjeta que desaparece, el primer paso del recorrido apuntaría a un hueco. Se mueve
a la píldora, que es lo que ahora ES el saldo.

## 5. La fecha de las tres últimas monedas

`MovementRow` la dibuja desde `match-remaining-screens`, y ahí sigue siendo
correcta: el historial existe para contestar «este saldo no me cuadra» y sin fecha
una fila no se puede cruzar con nada. En el inicio son tres líneas de resumen y la
maqueta no la pone.

Se declara con una opción de la fila, no con una copia: `compact`. Copiar la fila
para quitarle un dato es cómo acaban existiendo dos filas que se separan.

## 6. Qué test lo sostiene

- Que el saldo del inicio sigue siendo **alcanzable como enlace al historial**, que
  es la mitad del requisito que NO se revierte y la que un rediseño se llevaría por
  delante sin enterarse.
- Que sigue anunciándose con su unidad.
- Que el ancla del recorrido está donde está el saldo.

Lo que no se prueba: que la píldora se vea arriba a la derecha. jsdom no aplica CSS.
Se mira abriendo la aplicación.

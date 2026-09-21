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

### 4. Cuando la aplicación y la maqueta discrepan, manda la FUNCIÓN; el aspecto se ajusta

Decidido al comparar la lista de hijos: **la funcionalidad tiene prioridad sobre
el diseño, y el diseño manda en todo lo demás**. Si la aplicación ofrece más
controles que la maqueta, se quedan; lo que se ajusta es que la pantalla se vea
como la maqueta.

Y conviene dejar escrito cómo llegó esta decisión, porque la pregunta que la
provocó estaba mal planteada. Yo leí que la maqueta movía las acciones de un hijo
a su pantalla de edición, y era falso: `PadreHijos` dibuja «Editar», «Historial»
y «Dar de baja» **en la fila**, igual que la aplicación. Lo único que la maqueta
pone en la pantalla del hijo y la aplicación además en la fila es «Cambiar su
PIN», o sea **un** control de diferencia.

Es la lección de la precaución copiada de `polish-profile-and-reward-image` otra
vez: una diferencia que se afirma hay que **mirarla en el artefacto**, no
deducirla de otra pantalla del mismo. Aquí la deduje de `PadreEditarHijo`, que sí
las lleva, y concluí que por tanto la lista no.

Las diferencias reales de esa pantalla, ya arregladas:

- **La edad se escribía «Edad: 8»** y la maqueta escribe «8 años». El mismo dato
  se escribía de dos maneras en el producto: así aquí y con `contar` en el perfil
  del propio niño. Ahora las dos usan `contar`, que es la forma que ya evita
  «1 años». La etiqueta suelta sobraba: nadie necesita que le digan que un número
  seguido de «años» es una edad.
- **Faltaba la nota que distingue dar de baja de bloquear.** La maqueta la lleva y
  hacía falta: la fila ofrece las dos, suenan a lo mismo, y una se deshace
  pulsándola otra vez mientras la otra se lleva el saldo y el historial de un
  niño para siempre. Va en la PANTALLA y no dentro del diálogo, porque al diálogo
  llega quien ya pulsó.
- **«Bloqueado» y «Desbloquear» no aparecían**, y no era un defecto de la
  pantalla: la siembra bloqueaba treinta minutos. Arreglado en
  `match-shared-screens`.

### 5. Lo que la maqueta dibuja y la aplicación NO va a copiar: el paginador de una página

`PadreHijos` dibuja «Anterior», «Página 1 de 1» y «Siguiente» sobre una lista de
tres. La pieza de la aplicación se oculta con una sola página, y lleva su razón
escrita desde `add-design-system`: «enseñar 1 / 1 y dos pasos apagados es ocupar
sitio para no decir nada».

Se queda oculta, y el argumento es sobre qué clase de artefacto es cada cosa: una
maqueta estática **tiene que dibujar el control para enseñar cómo es**, y de ahí
no se sigue que deba estar siempre. Copiarlo pediría además cambiar su texto
—la aplicación escribe «1 / 2»—, o sea dos cambios para satisfacer un artboard
que probablemente solo ilustraba la pieza.

Queda dicho en vez de decidido en silencio, para que se pueda corregir si la
intención era la contraria.

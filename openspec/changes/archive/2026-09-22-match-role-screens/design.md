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

## Open Questions

### La ayuda: ¿una lista para los dos roles, o una por rol?

La aplicación tiene **una sola** pantalla de preguntas frecuentes con nueve
entradas compartidas, y lo dice en su cabecera: «UNA SOLA PANTALLA para los dos
roles». Las maquetas tienen **dos** artboards, `PadreAyuda` y `NinoAyuda`, con
preguntas distintas.

Y las del padre son del padre de verdad, no una variante de tono:

- «Subí el precio de un premio que ya me habían pedido.»
- «Alguien olvidó su PIN o bloqueó su perfil.»
- «¿Retirar un premio es lo mismo que dejar de ofrecérselo a un hijo?»
- «Si rechazo un canje, ¿se le devuelven las monedas?»

Un niño no puede hacer ninguna de esas cuatro, y tiene que pasarlas por encima
para llegar a la suya. Al revés también: «¿cómo consigo un premio?» no es la duda
de quien los publica.

**Lo que hay a favor de dividir**: es lo que dibuja el diseño, y el argumento se
sostiene solo — una lista de preguntas sirve para encontrar la propia, y la mitad
que no puede ser tuya estorba.

**Lo que hay en contra**: la decisión de una sola pantalla está escrita, y
dividir no es cambiar un texto — son seis respuestas nuevas que redactar, decidir
cuáles siguen siendo comunes, y un segundo catálogo que mantener.

**No se toca aquí**: cuántas listas de ayuda tiene el producto no es un ajuste de
pantalla, y las nueve preguntas actuales son correctas para los dos aunque no
sean las óptimas para ninguno. Queda planteado.

### 6. Comparar dos listas dice qué texto NO COINCIDE, no qué falta

Se pagó al anotar el inicio del niño: la lista de diferencias ponía su saludo, su
cuenta de hechas y su panel de meta como «solo en la maqueta», y las tres cosas
están en la aplicación — dichas con otras palabras. Escribí en las tareas que
faltaban, y era falso.

Lo destapó abrir la pantalla y leerla entera. Así que el método de este change se
corrige: la comparación de textos sirve para **encontrar candidatos**, y cada
candidato hay que mirarlo en la pantalla antes de llamarlo ausencia. Un renglón
que solo aparece en la maqueta puede ser tres cosas distintas —algo que falta,
algo que está con otras palabras, o algo que la maqueta enseña de un estado que
la aplicación no está mostrando— y la lista no las distingue.

Es la tercera vez en este trabajo que la misma clase de error se cobra: la
precaución de las rutas copiada sin comprobar, las acciones del hijo deducidas de
otro artboard, y esto. Todas por afirmar una diferencia sin ir a verla.

### 7. La ayuda se divide por rol, y esto revierte una decisión escrita

`HelpScreen` decía en su cabecera «UNA SOLA PANTALLA para los dos roles», con el
argumento de que el marco ya reasigna la escala. **Eso sigue siendo cierto de la
pantalla y no lo es del contenido.**

«Subí el precio de un premio que ya me habían pedido» no es una duda que un niño
pueda tener, y las nueve preguntas estaban redactadas en tercera persona —«el
niño lo pide y un adulto lo aprueba»—, que es un manual para quien administra.
Una lista de preguntas sirve para encontrar la propia; la mitad que no puede ser
tuya no es neutral, estorba — y a los siete años estorba el doble.

Once para el padre, con las dos que faltaban y son las que más se preguntan
—subir el precio de un premio ya pedido, y retirar frente a dejar de ofrecer—.
Seis para el niño, en su voz.

### 8. Lo que las maquetas NO deciden: los hechos del modelo de datos

El diálogo de dar de baja dice en la maqueta que el saldo y el historial «se van
con el perfil». Lo copié tal cual y es **falso**: la baja de un hijo es lógica, y
su historial de monedas ni siquiera podría borrarse porque un disparador de
PostgreSQL lo impide.

Una maqueta manda en el aspecto. Cuando su texto afirma algo del producto, se
comprueba antes de copiarlo — y esto llegó a estar escrito en dos sitios de la
interfaz antes de que lo mirara.

### 9. Un defecto de la SIEMBRA se distingue de uno del código

La insignia «¡Ya te alcanza!» salía como ausente al comparar el escaparate del
niño, y estaba implementada desde siempre. Lo que pasaba es que el único premio
que el hijo de ejemplo podía pagar ya estaba canjeado, así que el caso no se
alcanzaba desde ninguna pantalla.

Es exactamente lo que la siembra existe para evitar, así que el arreglo va ahí y
no en el código: un premio barato y sin canjear. La regla que deja: antes de
escribir que algo falta, hay que comprobar que el ESTADO que lo enseñaría es
alcanzable con los datos que hay.

### 10. El color del camino de entrada: lo que se hizo y lo que se descartó

Las cinco pantallas de entrada salían monocromas comparadas con sus maquetas, y
el color de éstas no está en los controles sino en dos sitios: formas grandes al
fondo, y las propias teselas.

**Lo que funcionó**: la rejilla. Su pregunta pasa a un panel de marca con Monedín
—es la pantalla por la que se pasa cada vez que alguien coge la tablet, y era la
más sosa del producto— y cada perfil a una tarjeta con borde: violeta para el
adulto, coral para los hijos. El color sigue una REGLA y no un reparto: son los
dos tonos de la paleta con su significado puesto, así que la rejilla se lee sin
aprenderse nada. La maqueta alterna los dos entre los hijos, y alternar es una
decisión que hay que volver a tomar cada vez que se añade uno.

**Lo que se descartó**: los dos círculos difusos del fondo. Sobre el crema de
estas pantallas, desenfocados y a baja opacidad, no se leen como ambiente sino
como una mancha sucia en una esquina. Se vio abriendo la pantalla, que es lo
único que lo podía decir. Media decoración es peor que ninguna.

**Y lo que la regla impidió**: el segundo círculo iba a ser ámbar, como en la
maqueta, y el test de la reserva del color de la moneda lo rechazó antes de que
llegara a pantalla. También rechazó su medida, que era un valor arbitrario. Las
dos veces la verificación llegó antes que la revisión.

**El teclado del PIN se queda como está.** Su maqueta pinta las teclas con tres
tintes suaves alternados, y copiarlo exigiría o imponer colores a `Button` desde
fuera —lo que su propia cabecera prohíbe, y ya se cobró una vez en este mismo
teclado— o inventar una variante nombrada por su color en vez de por su papel. La
gracia no vale ninguna de las dos.

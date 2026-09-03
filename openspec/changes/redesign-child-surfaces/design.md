## Context

Ver `proposal.md` — Why. Lo que este documento añade es lo que condiciona el cómo:

- Las tres pantallas son hoy `<ul className="flex list-none flex-col gap-3 p-0">` con un `<li><Card>`
  dentro. Idénticas hasta en la clase.
- Cada una **ya resolvió bien su contenido**: los tres estados de una tarea tienen tono, los tres de
  un canje también, y el escaparate tiene `ProgressBar` para lo que falta. Nada de eso se toca.
- Un premio siempre tiene algo que dibujar desde `polish-profile-and-reward-image`: foto o respaldo.
- **No existe pieza de tabla en `ui/`.** Hay dieciocho piezas y ninguna presenta datos tabulares.
- El marco del niño declara `data-scale="child"`: tipografía y objetivos de toque más grandes. Lo que
  cabe en una fila del padre no cabe en una del niño.

## Goals / Non-Goals

**Goals:**

- Que las tres pantallas del niño se distingan por su forma, y que la forma diga qué es cada una.
- Que el escaparate permita comparar dos precios sin desplazar.
- Que el historial se lea recorriendo una columna, y que se anuncie como tabla a quien no la ve.
- Que la tabla entre en el sistema como pieza, no como un bloque suelto.

**Non-Goals:**

- Cambiar los tonos, los estados o los textos que las tres pantallas ya resolvieron.
- Tocar la API, los contratos o la navegación.
- Llevar esta pieza a las pantallas del padre. Probable algún día, no aquí.

## Decisions

### 1. La rejilla son DOS columnas, y no «tantas como quepan»

```
   Hoy                          Rejilla
   ───                          ───────
   ┌───────────────────┐        ┌────────┐ ┌────────┐
   │ foto              │        │ foto   │ │ foto   │
   │ título   precio   │        │ título │ │ título │
   │ [ pedir ]         │        │ precio │ │ precio │
   └───────────────────┘        │[pedir ]│ │[pedir ]│
   ┌───────────────────┐        └────────┘ └────────┘
   │ ...               │        ┌────────┐ ┌────────┐
   └───────────────────┘        │ ...    │ │ ...    │
   hay que desplazar            dos precios a la vez
   para comparar dos            sin mover nada
```

Dos y no una rejilla que crece con el ancho, porque **dos es lo que hace falta para comparar** y a
partir de ahí cada columna más encoge la foto, que es lo que hace que un premio se reconozca sin
leer. En pantallas anchas el contenido ya tiene un ancho máximo declarado por el sistema, así que la
rejilla no se estira sin límite.

**Sigue siendo una lista** (`<ul>`/`<li>`) y solo cambia cómo se colocan sus elementos: quien recorre
la pantalla sin verla oye «lista de seis elementos», que es exactamente lo que hay. Una rejilla no es
una estructura distinta para quien escucha, es una colocación.

**Alternativa descartada: una columna con la foto al lado del texto.** Cabrían más premios por
pantalla, pero la foto quedaría del tamaño de un avatar y dejaría de servir para reconocer el premio
de un vistazo — que es lo único que la foto aporta.

### 2. El historial es una TABLA de verdad, y esa es la decisión que más se discutió

El reflejo es que una tabla es cosa de adultos y que un niño de seis años no lee tablas. Lo segundo
es cierto para una tabla de veinte columnas; lo primero confunde **la forma con la densidad**.

Lo que hay aquí son cuatro datos por fila, siempre los mismos, sin nada que hacer con ellos. Eso es
tabular por definición, y escribirlo como párrafos dentro de tarjetas tiene dos precios concretos:

- **Para quien ve la pantalla**: sin columnas, las cantidades no alinean, y comparar «cuánto me costó
  cada cosa» obliga a leer cada tarjeta entera en vez de recorrer una columna.
- **Para quien no la ve**: una tabla con encabezados deja saltar de celda en celda sabiendo en qué
  columna se está. Una lista de párrafos obliga a escuchar la etiqueta repetida en cada fila.

Lo segundo es lo que decide. Un historial es el caso de manual de una tabla accesible.

**Cuatro columnas y no más**, y esto es lo que hace que quepa en la escala del niño:

```
   Premio            Monedas   Estado        Cuándo
   ────────────────  ───────   ───────────   ──────
   Helado                 60   Aprobado      3 sep
   Ir al cine            200   Esperando     2 sep
   Patines               350   No esta vez   1 sep
```

El premio es la única columna flexible y las otras tres son estrechas. La fecha va corta —día y mes—
porque el año no aporta nada en un historial que el niño mira cada pocos días.

**Esto NO lo cubre ningún test**, y hay que decirlo: jsdom no aplica CSS, así que que las cuatro
columnas quepan a 390 px sin desbordar se comprueba **abriendo la aplicación**, igual que el efecto
de tocar un token. Lo que sí se prueba es lo que jsdom ve: que es una tabla, que tiene nombre, que
cada encabezado tiene su ámbito y que hay una fila por canje.

**Alternativa descartada: una tabla que se convierte en tarjetas apiladas por debajo de un ancho.**
Es el patrón habitual y aquí está prohibido por una razón que el proyecto ya pagó: montar las dos
formas y esconder una con CSS deja **dos** estructuras en el árbol para quien recorre el documento
con teclado o lector, aunque solo se vea una. Es la misma decisión que `pin-sidebar-on-desktop` tomó
con el lateral y el cajón, y allí la salida fue montar **una** de las dos. Aquí no hace falta ni eso:
con cuatro columnas estrechas, una sola forma sirve para los dos anchos.

**Alternativa descartada: filas alineadas con rejilla CSS, sin semántica de tabla.** Alinea igual y
se queda sin lo que más aporta — los encabezados asociados. Sería quedarse con la mitad visible del
beneficio y tirar la otra.

### 3. La pieza recibe sus filas; no sabe qué es un canje

`ui/DataTable` toma encabezados y filas ya compuestas, con `caption` para su nombre. Es la misma
frontera que le impide a `Pagination` construir sus propios enlaces, y por lo mismo: una tabla que
supiera qué es un canje no se podría montar en el catálogo vivo sin aplicación.

**El estado sigue siendo un `Badge`** y lo pone quien usa la pieza, no la pieza. Ella no sabe qué
tonos existen ni por qué un canje rechazado va en advertencia.

**Ninguna fila del historial lleva acción**, y eso no es una limitación de la pieza sino del producto:
un canje no se cancela ni se repite. Si algún día una tabla necesita acciones, es una celda más con
contenido, no una prop nueva.

### 4. «Cuántos hay» se compone en el punto de uso

Las tres pantallas lo dicen, y las tres lo componen con los datos que ya tienen. **Ninguna cadena del
catálogo lleva la cifra dentro** — hay un test del proyecto que lo impide, y esta es exactamente la
clase de texto que se lo salta si nadie mira.

Cada una cuenta lo suyo, y no es lo mismo:

| Pantalla | Qué cuenta | De dónde sale |
| --- | --- | --- |
| Escaparate | premios ofrecidos | las filas recibidas |
| Tareas | las **pendientes** | filas con ese estado, no el total |
| Canjes | canjes | el `total` del listado |

Lo de las tareas es la trampa conocida: una lista de ocho tareas con siete aprobadas no es «ocho
cosas por hacer». Y lo de los canjes es legítimo aunque parezca incoherente con lo anterior —
`GET /redemptions` pagina **por fila**, así que su `total` sí es la cifra, a diferencia de
`GET /tasks`, que pagina por reparto. Dos cuentas del mismo producto obtenidas de dos maneras porque
las dos listas tienen unidades distintas.

### 5. Las tareas se quedan como están, y eso también es una decisión

Es el destino que menos cambia de aspecto y el único donde **hay algo que hacer**: marcarla, y
adjuntar una foto opcional antes. Comprimirlo a filas escondería la acción, y ponerlo en rejilla
dejaría el botón y el subidor en una tesela estrecha.

Lo que cambia no es la tarjeta sino su **contexto**: al dejar de ser la forma de las tres pantallas,
pasa a significar algo. Y gana la cuenta de pendientes, que es lo que responde a «¿qué hago ahora?».

## Risks / Trade-offs

- **La tabla desbordando a lo ancho en la escala del niño** → Cuatro columnas, tres de ellas
  estrechas, y la pieza desplaza su propio contenido si aun así no cabe, sin arrastrar a la página.
  Ningún test lo cubre: hay que abrir la aplicación, y así está escrito en las tareas.
- **Una pieza nueva es superficie nueva que mantener** → Es el precio de no copiar una tabla en la
  siguiente pantalla que la necesite, que es lo que pasaría. Entra con su entrada obligatoria en el
  catálogo vivo y sus tests de montaje.
- **«Distinguirse entre sí» es difícil de probar** → El test compara **las tres pantallas** por la
  estructura que cada una monta, no comprueba clases sueltas. Un test que solo mirase una pantalla
  pasaría con las tres iguales otra vez.
- **Tocar tres pantallas del mismo rol a la vez** → Ninguna depende de otra y las tres son
  presentación, así que un problema en una no bloquea las demás. Lo que sí hay que hacer de una vez
  es la comparación entre las tres, porque es lo único que no se puede comprobar por partes.

## Migration Plan

Sin migración: no hay datos, contratos ni rutas implicados.

## Decisiones que este change NO toma

- **Si el historial de canjes del PADRE usa esta misma pieza.** Probable, y su bandeja tiene filtros y
  acciones que este historial no tiene, así que se mira con la pieza ya construida delante.
- **Si el escaparate necesita ordenar o filtrar** — por precio, por lo que alcanza. Se mira con una
  rejilla de verdad delante y con más premios de los que hoy tiene nadie.
- **Si la fecha del historial debería ser relativa** («ayer», «hace tres días»). Es una decisión de
  producto sobre cómo un niño de seis años lee el tiempo, y merece mirarse sola.

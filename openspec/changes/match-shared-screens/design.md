## Context

Las maquetas son la fuente de verdad del aspecto y se pueden **leer**: son HTML
con estilos en línea, así que el texto visible de cada pantalla y el tamaño de
cada trozo se sacan sin abrir un navegador. Eso convierte «se ve distinto» en
dos listas que se comparan renglón a renglón.

`tune-scale-to-mockups` agotó lo que se arregla en la capa de tokens. Lo que
queda es de cada pantalla: qué dice, en qué orden y con qué peso relativo.

## Goals / Non-Goals

**Goals**

- Que el texto visible de cada pantalla compartida y su jerarquía sean los de su
  maqueta.
- Que la siembra alcance a enseñar todos los casos de cada pantalla, para que la
  siguiente comparación se pueda hacer mirando y no imaginando.

**Non-Goals**

- El padre y el niño, que van después.
- El color.

## Decisions

### 1. Se compara el TEXTO VISIBLE, no la captura

De cada pantalla se extrae la lista de sus nodos de texto visibles, en orden, y
se pone al lado de la de su maqueta. Una diferencia de contenido aparece como un
renglón que sobra o falta; una de jerarquía, como dos renglones intercambiados.

**Alternativa descartada: comparar capturas.** Dos imágenes parecidas no dicen
qué falta, y una que falta es justo lo que no se ve.

### 2. El saludo es el antetítulo y el propósito el título

El acceso tenía «¡Bienvenido!» en el tamaño grande y «entra para continuar» de
letra pequeña debajo. O sea que lo más grande de la única pantalla que mira un
adulto era un saludo que no dice nada, y lo que de verdad distingue entrar de
registrarse se leía de segundas.

Se invierte, como en la maqueta, y los dos textos del catálogo se reescriben
para que funcionen como títulos: «Entra a tu cuenta» y «Crea tu cuenta».

### 3. La acción principal del acceso lleva su nombre escrito

Era una flecha redonda con el nombre solo en `aria-label`. Su etiqueta existía
—un lector de pantalla la oía— pero quien mira veía una flecha.

Y es **la única pantalla del producto donde un adulto decide si esto es de
fiar**. Una flecha sin palabra obliga a deducir qué va a pasar al pulsarla justo
ahí. Se pinta ancha, que es además lo que dice que es LA acción y no una más.

Al quedarse sin uso, `ArrowRight` **se borra** en vez de dejarla puesta: una
pieza sin uso es la invitación a volver a poner el botón sin palabra.

### 4. «Dinero de mentira» va antes de «Así funciona», y el fondo viaja con el sitio

El orden lo dibuja la maqueta y lo explica lo que un adulto piensa al llegar: lee
«monedas» y «premios» en algo para su hijo, y su primera pregunta no es cómo
funciona el ciclo sino si esto mueve dinero de verdad.

Al intercambiarlas hay que intercambiar sus fondos, porque el fondo lo decide el
SITIO en la alternancia y no la sección. Dejarles el suyo deja dos iguales
seguidas y la página pierde el ritmo.

**Y lo que este cambio destapó**: el test que fijaba el orden llevaba escrito en
su comentario «la franja contesta una duda ANTES de que las tarjetas resuman el
ciclo» y comprobaba que iba **después**. La intención estaba escrita y lo que se
verificaba era lo contrario; así llegó a la aplicación. Es el mismo error que
`CLAUDE.md` ya recoge dos veces con otras caras: un test se escribe con lo que se
quiere garantizar, no con la forma que la respuesta tiene hoy.

### 5. Las maquetas internas de la portada llevan pie

Están construidas con las piezas del producto y con la escala de verdad, así que
se parecen tanto a la aplicación que un saldo de 340 monedas se lee como el de
alguien. La frase sale de la MISMA clave que ya nombra cada maqueta para un
lector de pantalla, compuesta en el punto de uso con el aviso: escrita dos veces
acabaría con una de las dos diciendo otra cosa.

### 6. El PIN va detrás de la edad

Como en la maqueta, y el orden dice algo: primero quién es —su nombre y su edad—
y solo después su secreto. Al revés, el campo que interrumpe para inventarse
cuatro cifras se cuela entre dos datos que ya se saben.

### 7. La siembra tiene que alcanzar a enseñar el producto

Con dos hijos hay estados que no se pueden mirar: bloquear a uno de los dos deja
la aplicación sin el caso normal al lado, y un reparto de dos no enseña lo que un
reparto de tres con estados mezclados —que es donde se ve que `GET /tasks` pagina
por reparto y devuelve el grupo entero—.

Se añade un tercer hijo que nace **bloqueado y sin edad**, dos estados válidos
que los otros dos no pueden dar a la vez, y dos tareas con fecha límite —una por
vencer y otra pasada—, porque `dueDate` es opcional y sin sembrarlo no aparece en
ninguna pantalla.

Todo lo sembrado sigue siendo un estado que el producto pudiera haber alcanzado,
que es la regla que `add-coin-history` pagó: el motor no distingue entre un test
y producción.

## Risks / Trade-offs

- **Reordenar dos secciones de la portada mueve dos fondos.** Se comprueba
  mirando la página, porque la alternancia no la verifica ningún test.
- **Un tercer hijo de ejemplo cambia todas las cifras que se ven al arrancar.**
  Es lo que se quiere: las de antes no enseñaban la mitad de los casos.

## Open Questions

- **El contraste del coral.** Medido sobre la rampa entera: `--color-primary`
  #FF6B4B da **2.82** contra blanco y contra la tinta clara que va encima, y el
  paso más oscuro que existe, #F55439, da **3.38**. Un texto normal pide 4.5 y
  uno grande 3. O sea que **hoy la etiqueta de cada botón principal está por
  debajo de AA**, y también los enlaces corales sobre superficie clara.

  Y no se arregla con un paso más oscuro sin más: cualquier coral que llegue a
  4.5 sobre blanco baja de 3 sobre la superficie oscura. Lo que hay son dos
  salidas, y la elección es de marca:

  1. **Que el coral con el que se ESCRIBE se reasigne por tema** —#D13A14 en
     claro (4.85) y #FF6B4B en oscuro (4.82)—, dejando el coral de marca para
     rellenar superficies grandes. Es lo que la arquitectura del sistema ya hace
     con las tintas de página, y es la recomendación.
  2. **Que el relleno de la acción principal se oscurezca** y el enlace coral
     sobre superficie clara deje de ser coral.


  **Y medido en los dos temas, que es la mitad que decide**: en OSCURO el coral
  sobre superficie ya pasa —#FF6B4B contra #322B3C da 4.82—, así que «Volver» y
  «Cancelar» se leen bien ahí y mal en claro. O sea que no hay que buscar un
  coral que sirva a los dos: **solo el tema claro necesita un paso más oscuro**,
  que es exactamente la forma de la salida 1 y la razón de recomendarla.

  Lo que NO arregla ninguna de las dos es la etiqueta blanca sobre el relleno
  coral, porque ahí el fondo es el mismo en los dos temas. Eso pide oscurecer el
  relleno de la acción principal, y es la parte que de verdad cambia cómo se ve
  el producto.

  No se toca aquí: cambiar el color principal del producto no es una decisión de
  ajustar pantallas.

## Context

Las maquetas son la fuente de verdad del aspecto, y se pueden medir: son HTML con
estilos en línea, así que cada `font-size` y cada `font-weight` se cuenta sin
abrir un navegador. Eso convierte «se ve distinto» en cifras.

La restricción que decide la forma de la solución: **una pieza solo usa la capa
semántica**. Ninguna escribe un tamaño ni un peso crudo, así que corregir el
sistema es corregir dos bloques de valores — y corregirlo pieza por pieza sería
tocar treinta archivos para el mismo resultado peor.

## Goals / Non-Goals

**Goals**

- Que el texto de cada pantalla mida y pese lo que mide y pesa en su maqueta.
- Que el arreglo viva en un solo sitio, para que la siguiente comparación se
  pueda hacer contra un sistema y no contra treinta pantallas.

**Non-Goals**

- Tocar una sola pieza o pantalla.
- Resolver las diferencias de estructura, que son de cada pantalla.

## Decisions

### 1. Los pasos salen de contar, no de mirar

Para cada grupo de pantallas se cuenta cuántas veces aparece cada tamaño y se
asigna el paso de la escala al valor que domina. El cuerpo del padre es 14px
porque aparece 261 veces; el del niño, 15px, porque 14 y 15 se reparten el peso y
el niño lee más grande que su padre por decisión del sistema.

**Alternativa descartada: copiar el tamaño de cada elemento.** Las maquetas usan
veinticuatro tamaños distintos; el sistema tiene siete pasos a propósito. Copiar
los veinticuatro sería volver al problema que la escala existe para resolver.

### 2. El registro de pesos se declara, y no se reescribe en cada pieza

En las 32 maquetas no hay **ni una** declaración de peso 400. El texto normal del
diseño son 700, el énfasis 800, y los titulares 900. La aplicación pinta 400
porque es lo que trae el navegador, y 600 donde una pieza pide `font-semibold`.

Se redefine el vocabulario de pesos en la capa de tokens. Una pieza que pide
«semibold» sigue pidiendo lo mismo; lo que cambia es a qué apunta esa palabra en
este producto, igual que `--color-primary` cambió de valor sin que ninguna pieza
se enterara.

**Alternativa descartada: cambiar la clase en cada pieza.** Son más de cien
puntos de uso, el resultado es idéntico, y la próxima vez que el diseño ajuste el
registro habría que volver a recorrerlos todos. Es exactamente lo que la capa de
tokens existe para evitar.

**La consecuencia que hay que aceptar**: `font-normal` deja de significar 400 en
este proyecto. Se declara con todas las letras en `tokens.css`, porque una
palabra que significa otra cosa sin decirlo es peor que un valor raro.

### 3. El `--text-hero` del niño NO se toca

La maqueta pone el saldo como píldora de la cabecera, a 34px. La aplicación lo
pone como el elemento más grande del inicio, a 64px, porque lo exige un requisito
vigente que la maqueta contradecía.

Bajarlo aquí resolvería una diferencia de cifras cambiando una decisión de
producto por la puerta de atrás. Se deja, se dice, y si hay que revisarla se
revisa donde se decidió.

## Risks / Trade-offs

- **Todo el texto se vuelve más pesado de golpe.** Es el objetivo, y es lo que
  las maquetas piden; pero es el cambio más visible que ha tenido el producto en
  una sola línea, así que se mira en pantalla antes de darlo por bueno.
- **Un tamaño más pequeño aprieta las pantallas densas.** Las del padre son las
  que más contenido llevan y son justo las que menos bajan.

## Open Questions

- Ninguna. La del saldo está fuera de alcance a conciencia.

## Correcciones durante la implementación

Las dos salieron de la tarea 4.1 —volver a contar sobre la aplicación—, que es
para lo que esa tarea existe.

### 4. El recuento agrupaba por la carpeta del diseño, no por lo que la app reasigna

El primer recuento usó las páginas del lienzo. Esa agrupación junta la puerta
pública con las cinco pantallas del marco de entrada, que escriben más pequeño,
así que la escala pública salió **un escalón por debajo** de lo que su única
pantalla usa: cuerpo 16 donde usa 18, título 24 donde usa 34.

Contada la portada sola y elemento por elemento, sus papeles son: pie 13, texto
secundario 16, párrafos 18, línea guía y pasos 20, los tres `h2` de sección 34 y
el titular 58.

**La lección, que vale más que las cifras**: un recuento se agrupa por lo que la
APLICACIÓN reasigna —aquí, por `data-scale`—, no por cómo estén ordenados los
archivos del diseño. Agrupar por carpeta es lo que hizo que dos audiencias
distintas se promediaran.

### 5. El camino de entrada es una audiencia propia

`EntryShell` no declaraba escala, con un argumento escrito y con un test que lo
sostenía: la escala la elige la audiencia, y ahí todavía no se sabe quién está
delante. **La mitad que sigue en pie**: aquí no se elige entre la del padre y la
del niño. **La que no**: sin declarar nada se quedaba con la base, que es la del
PADRE —la más densa del producto, medida para un adulto repasando listas
largas—. O sea que «no se sabe quién está delante» se resolvía eligiendo al
padre en silencio, que es justo la clase de valor por defecto que este proyecto
no admite en ningún otro sitio.

Y se mide. Contando sus siete maquetas elemento por elemento: ayuda al pie 13,
etiqueta de campo 15, botones y enlaces 16, el párrafo que encabeza 18, el
nombre de un perfil 22, el titular de un formulario 26–32 y el «¿Quién eres?»
46. Un paso entero por encima de lo que la escala del padre pone en cada uno.

Así que se declara `[data-scale="entry"]`, por la misma razón por la que
`public` es «una audiencia propia, no una excepción»: se lee de pie, de un
vistazo, por alguien que todavía no es nadie en el producto.

**Lo declaran DOS sitios y hacen falta los dos**: `EntryShell` para la rejilla,
el PIN, el alta y el restablecer; y `AccessLayout` para entrar y registrarse,
que van **a sangre** y por eso no pasan por el marco. Es exactamente lo que ya
hace la portada, que declara la suya ella misma.

### 6. La jerarquía de encabezados había colapsado dos pasos en uno

Con la escala corregida apareció lo que la tapaba: varias pantallas usaban
`text-title` para el encabezado de una sección **y** `text-title` era también el
tamaño del logo y de un botón grande. Un solo paso servía a tres papeles, así
que subir el paso rompía los otros dos.

Se reparten en los pasos que ya existían, sin inventar ninguno:

| pantalla | antes | ahora | maqueta |
| --- | --- | --- | --- |
| `h2` de sección de la portada | `text-title` | `text-display` | 34 |
| «Empieza esta semana» | `text-hero` | `text-display` | 34 |
| saludo del acceso y su frase | `text-hero` / `text-title` | `text-display` | 32 / 34 |
| «¿Quién eres?» | `text-display` | `text-hero` | 46 |
| nombre de un perfil | `text-body` | `text-title` | 22 |
| «Crear perfil» | `text-body` | `text-lead` | 18 |
| nombre en el teclado de PIN | `text-title` | `text-display` | 28 |
| ayuda de un campo | `text-small` | `text-micro` | 13 |

**Esto contradice el «no se toca ni una pieza ni una pantalla» de arriba**, y se
dice en vez de disimularlo: el no-goal valía mientras la diferencia fuera de
valores. Un paso que sirve a tres papeles no se arregla cambiando su valor,
porque no hay valor que sirva a los tres.

### 7. El teclado del PIN imponía su tamaño con una clase, y funcionaba por suerte

`Button` avisa en su propia cabecera de que `cx` no fusiona utilidades y de que
pasarle `px-6 text-title` desde una pantalla lo resolvería el orden del CSS
generado. El teclado del PIN hacía **exactamente eso**.

Funcionaba porque `text-title` se declara después de `text-body` en el bloque de
utilidades, así que ganaba. Al subir la tecla a `text-display` —que se declara
ANTES— habría perdido, y las teclas habrían salido al tamaño de un botón normal
**sin que nada fallara**.

Se arregla como la pieza dice: una talla más, `keypad`, declarada en `Button`.
Se nombra por lo que ES —una tecla de un teclado numérico— y no `xlarge`, porque
lo que la distingue no es el tamaño sino que es cuadrada y su contenido es una
cifra.

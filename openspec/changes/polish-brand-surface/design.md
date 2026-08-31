## Context

Ver `proposal.md` — Why.

Lo que condiciona el cómo:

- **La paleta se diseñó para superficies claras.** Los neutros llevan matiz 265 «para que el gris no
  sea sucio», y eso es correcto sobre blanco y equivocado sobre ámbar.
- **`[data-surface="brand"]` ya existe** y ya reasigna `--color-ink-muted`. El mecanismo está; lo que
  falta es usarlo para lo demás.
- **La capa 1 no genera utilidades**, a propósito: `bg-mnd-amber-400` no existe. Añadir primitivos no
  abre ninguna puerta.
- **`VARIANTS` de `Button` nombra papeles, no colores**: cuatro nombres y ninguna paleta.
- **`cx` no fusiona utilidades**, así que una variante es una prop y no una clase desde fuera.
- **Dos tests cazan colores literales y valores arbitrarios** en las pantallas ya vestidas, y el
  acceso salió de la lista de deuda en `redesign-access`.

## Goals / Non-Goals

**Goals:**

- Que el panel de marca tenga cuerpo en vez de ser un color plano.
- Que el texto y las sombras sobre la marca pertenezcan a esa superficie.
- Que la acción principal no vibre contra el fondo.
- Que nada de esto se filtre al resto de la aplicación.

**Non-Goals:**

- Cambiar la identidad. `--color-brand` mantiene su valor.
- Tocar el índigo donde el fondo es claro.
- Vestir más pantallas.

## Decisions

### 1. El color: índigo profundo, y el ámbar como acento

**La corrección grande de este change, y llegó a mitad.** Empezó como un arreglo de acabado sobre un
panel ámbar y acabó cambiando el color, porque el acabado no era el problema.

El argumento es de producto: **el acceso es la única pantalla que mira un adulto**. La calidez es
correcta para el niño y en la puerta se lee como juguete justo donde alguien decide si esto es serio.

El ámbar no desaparece, cambia de papel:

```
   antes                          después
   ─────                          ───────
   ámbar = el fondo               índigo = el fondo
   ámbar = la moneda              ámbar = el acento: el botón y la moneda
   → el color no dice nada        → un punto ámbar ES dinero
```

La rampa índigo se completa con los pasos oscuros —para pintar— y los claros —para lo que va encima—.
En la capa 1, que no genera utilidades, así que solo se llega a ellos por los semánticos.

Los semánticos **cambian de valor y no de nombre**: `--color-brand`, `--color-brand-deep`,
`--color-brand-line` y `--color-brand-soft` siguen significando lo mismo. Que un cambio de color de
esta envergadura no tocara un solo punto de uso es la prueba de que la capa semántica estaba bien
puesta.

### 2. Los neutros se reasignan por SUPERFICIE, igual que la escala por audiencia

```
   La escala                      La superficie
   ─────────                      ─────────────
   [data-scale="child"]           [data-surface="brand"]
   --text-hero: 4rem              --color-ink: claro
   --radius-card: 1.5rem          --color-surface-raised: oscuro
   --tap-min: 3rem                --color-border: índigo

   el token no cambia de significado, cambia de valor según dónde está
```

**Sobre OSCURO no basta con invertir la tinta**, y esa fue la trampa. Con solo `--color-ink` en
claro, la etiqueta de un campo quedaba bien y el texto DENTRO del campo salía claro sobre un campo
blanco. La salida es que la superficie reasigne también las superficies: `--color-surface-raised`
pasa a índigo, el campo deja de ser una píldora blanca y pasa a ser un campo oscuro con texto claro
—que es la traducción correcta de la maqueta a un fondo oscuro, no una concesión— y `Input` y `Field`
componen solos.

Es exactamente el mismo mecanismo, y esa es la razón de elegirlo: el proyecto ya lo entiende, ya lo
documenta y ya tiene una pantalla que lo enseña. Una pieza sigue pidiendo `text-ink` sin saber sobre
qué está apoyada.

**Descartado — una prop `onBrand` en cada pieza**: obligaría a que `Input`, `Field`, `Alert` y
`Button` supieran dónde están, que es justo lo que la capa semántica existe para evitar. Y habría que
acordarse en cada uso.

**Lo que hay que comprobar y no suponer**: que fuera de `[data-surface="brand"]` no cambia ni un
píxel. Es el riesgo real de tocar tokens, y no lo cubre ningún test: se mira.

### 3. La variante del botón se llama por su papel

`onBrand` o `inverse` describen el color. El nombre tiene que decir **qué acción es**, como los
cuatro que ya hay —`primary`, `secondary`, `ghost`, `danger`—, porque quien usa la pieza no decide un
color.

Se llama **`contrast`**: la acción principal cuando el fondo ya es del color de la marca. El
significado es «destaca contra su superficie».

**Y la promesa se cobró dentro del mismo change.** Nació de tinta oscura, que era lo correcto sobre
el ámbar claro, y al pasar la superficie a índigo profundo cambió a ámbar **sin tocar su nombre ni un
solo punto de uso**. Eso es exactamente lo que se gana nombrando por el papel y no por el color, y no
suele poder demostrarse tan pronto.

### 3 bis. Una superficie clara anidada tiene que declararse

**Encontrado mirando el registro, no con un test.**

`Alert` trae su propio fondo suave y pinta el cuerpo con `text-ink`. Dentro de la superficie oscura,
ese `text-ink` vale claro, así que el aviso salía **blanco sobre azul claro**. Cada pieza por
separado era correcta; fallaba la combinación.

Se resuelve con el mecanismo simétrico: `[data-surface="default"]` devuelve los valores claros, y lo
declara **el componente que pinta el fondo**, no la pantalla que lo coloca. Un aviso es una
superficie clara esté donde esté; la pantalla no tiene por qué saber sobre qué está apoyada.

Es la contrapartida de permitir que una superficie reasigne neutros: en cuanto una anida dentro de
otra, hace falta el camino de vuelta.

### 4. El radio de un panel no es el de una tarjeta

`--radius-card` son 0.75 rem y están bien para una tarjeta de una lista. Un panel de media pantalla
con ese radio parece una caja. `--radius-sheet` ya existe con 2 rem para la lámina inferior, y es
exactamente lo que un panel pide.

No se añade un token nuevo: se usa el que ya describe «una superficie grande».

### 5. Corrección escrita al implementar: el anillo interior se movió al revés

El plan decía «separar el anillo interior de la moneda, que quedó apretado». **La moneda no estaba
apretada**: sobre un disco de 16 rem le sobraban 16 px. Lo que hice fue mover el anillo hacia fuera
y meterlo DENTRO del de fuera, que empieza en 80:

```
   antes (inset-16)        el «arreglo» (inset-14)
   ───────────────         ───────────────────────
   moneda   0 ..  32       moneda   0 ..  32
   dentro  48 ..  80       dentro  56 ..  88   ← se cruza con el de fuera
   fuera   80 .. 128       fuera   80 .. 128
```

Se veía como dos piezas pegadas. Volvió a `inset-16`, y la lección es la que ya está escrita en el
comentario del archivo: **estos radios se calculan, no se tantean**. Bastaba restar.

### 6. La órbita se rehizo entera, con el lenguaje de la puerta pública

El disco de dos anillos no convencía, y al comparar con `Orbits` se vio por qué: no era cuestión de
cantidad, era **otro lenguaje**.

```
   lo que había                     la puerta pública
   ────────────                     ─────────────────
   fichas CIRCULARES                cuadrados redondeados
   con aro grueso de color          sin borde, solo sombra
   anillos de 2px saturados         trazas de 1px que se insinúan
   disco relleno                    sin relleno
   2 anillos                        3 anillos, radios 64/100/136
```

Ahora es la misma, con **dos piezas por anillo en vez de tres**: seis iconos donde la puerta pública
pone nueve. Los radios son los suyos, sobre el mismo escenario de 20 rem.

Sigue sin pedir estilos en línea, y ahí está la única diferencia de implementación: `Orbits` calcula
`rotate(a) translate(r) rotate(-a)` para nueve ángulos arbitrarios, y aquí cada anillo pone sus dos
piezas arriba y abajo y **se gira el anillo entero** —0°, 45°, 90°— para repartirlas. A la vista es
lo mismo.

**El defecto que costó encontrar**: las seis piezas quedaban 20 px por dentro de su órbita, media
ficha, porque `top-0` alinea el **borde** de la ficha con el del anillo y no su centro. Medido: 115
donde tocaba 136. Se arregla sacándola media ficha —`-top-5`—, que es lo mismo que la puerta pública
consigue con `-ml-5 -mt-5`.

**Y una lección sobre medir**: el primer intento de comprobarlo dio radios que no cuadraban, y no era
el código. El recuadro de un cuadrado que gira crece hasta √2 veces, así que medir un anillo animado
con `getBoundingClientRect` no da su radio. Lo que sí sirve es medir la **distancia de cada pieza al
centro**, que es lo que importa.

### 7. El degradado al 75 % no sobrevivió al cambio de color

La maqueta desvanece su color hacia el blanco, y con el ámbar claro eso funcionaba. **De índigo
profundo a blanco, el mismo recorrido pasa por grises y ensucia.**

Se sustituye por lo que la maqueta dibuja de verdad: una **lámina blanca con la esquina superior
redondeada**. Sobre oscuro es además lo único que se lee limpio.

Y hubo que mover la superficie: el panel entero llevaba `data-surface="brand"`, pero dentro de ese
selector `--color-surface-raised` es índigo, así que el pie blanco se volvió oscuro y el enlace
desapareció. **La superficie es el BLOQUE, no el panel**: base blanca, bloque oscuro encima, lámina
blanca debajo.

### 8. Una utilidad resuelve la variable DONDE se aplica

Con la superficie ya bien puesta, el saludo seguía saliendo casi invisible sobre el índigo. `text-ink`
estaba en el panel de fuera, así que resolvía la tinta **oscura** y el color ya resuelto bajaba
heredado al bloque. Las etiquetas se veían bien porque `Field` aplica su propio `text-ink` ya dentro
del selector.

La regla, que no es evidente: **una utilidad de color resuelve el token donde se escribe, no donde
acaba el píxel**. Si un bloque cambia de superficie, tiene que declarar su tinta él mismo.

## Risks / Trade-offs

- **Tocar `tokens.css` puede filtrarse a toda la aplicación** → Por eso todo entra en primitivos o
  dentro del selector de superficie. Se comprueba abriendo una pantalla del padre y una del niño.
- **Tres primitivos más en la paleta** → Es más paleta que mantener, y es lo que hacía falta para
  poder modelar. Un solo valor no es una paleta, es un color.
- **Una variante más de `Button`** → Cada variante es una decisión más en cada uso. Se acepta porque
  la alternativa —clases sueltas desde la pantalla— no funciona de forma fiable con `cx`.
- **El degradado del panel puede quedar sucio si el pie es demasiado oscuro** → Se mira, no se
  calcula.

## Migration Plan

1. Los primitivos y los dos semánticos nuevos. No se ve nada todavía.
2. El bloque de superficie de marca: tinta, bordes y sombras.
3. La variante `contrast` de `Button`, y el acceso la pide.
4. El degradado del panel, el radio y los ajustes de la órbita.
5. Mirar el resto de la aplicación para confirmar que no se enteró.

**Vuelta atrás**: quitar el bloque de superficie devuelve el acceso a lo de hoy sin tocar nada más.

## Open Questions

Ninguna. Las tres —el botón, la rampa y los neutros— se cerraron antes de escribir esto.

## Decisiones que este change NO toma

- **Si la superficie de marca vale para otras pantallas.** Existe para el acceso; llevarla a otro
  sitio es una decisión de ese sitio.
- **Si el índigo sigue siendo el primario.** Sí, donde el fondo es claro. Esta variante no lo
  sustituye.
- **La identidad visual definitiva**: `polish-brand-and-a11y`.

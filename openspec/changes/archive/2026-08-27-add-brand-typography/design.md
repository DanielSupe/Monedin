## Context

Ver `proposal.md` — Why.

Lo que condiciona el cómo:

- **El front no hace hoy ni una petición a terceros.** Cero fuentes remotas, cero CDN. Eso es un
  estado que cuesta conseguir y es fácil perder con una línea.
- **`tokens.css` lo importan los dos puntos de entrada**, `main.tsx` y `ui-catalog.tsx`. Cualquier cosa
  que deba llegar a los dos va ahí y no se repite.
- **La doble escala ya diferencia a las dos audiencias** por tamaño, peso y radio. La tipografía no
  tiene que volver a hacerlo.
- **El elemento más importante del producto es un número**: el saldo del niño a 4rem, un PIN de cuatro
  dígitos, y columnas de saldos en las listas del padre.
- **La verificación del front la hace un test que lee `tokens.css`** y falla ante colores literales.
  Ese archivo es el sitio donde el proyecto ya espera encontrar los valores.

## Goals / Non-Goals

**Goals:**

- Que la marca se vea igual en el iPhone del padre y en la tablet Android de los niños.
- Que eso no cueste ni una petición a un tercero.
- Que si la fuente falla, la aplicación siga siendo legible.
- Que los números —que es lo que este producto enseña— se lean y se comparen bien.

**Non-Goals:**

- Rediseñar nada. Ni un peso, ni un tamaño, ni un color.
- Traer el resto de la identidad visual: eso sigue en `polish-brand-and-a11y`.

## Decisions

### 1. Nunito, y por qué no las otras

**Elegido**: Nunito variable.

**Por qué**: es **continuidad, no rediseño**. El sistema ya había decidido «redondeada» al escribir
`ui-rounded` primero en la pila; lo que faltaba era cumplirlo fuera de Apple. Nunito es lo que
`ui-rounded` intentaba ser.

**Descartado — Lexend**: es la alternativa con el mejor argumento, porque está diseñada con
investigación sobre fluidez lectora en niños, y el público tiene entre 6 y 11 años. Se descarta porque
es geométrica y neutra: cambiaría el carácter del producto además de arreglarlo, y este change quiere
arreglar sin cambiar. **Queda anotada como la primera candidata** si algún día la legibilidad pesa más
que la calidez.

**Descartado — Atkinson Hyperlegible**: distingue los caracteres mejor que ninguna —el `0` y la `O`,
el `1` y la `l`—, y eso importa en un PIN. Pero se ve institucional, y la puerta de una app para niños
no debería parecer un formulario oficial.

**Descartado — Inter y Urbanist**, que pedía la maqueta de referencia de la landing: ninguna es
redondeada, y las dos contradicen una decisión que el sistema ya había tomado.

### 2. Autoalojada con Fontsource, no con un CDN ni a mano

```
   CDN de Google              Descargar el .woff2         Fontsource
   ─────────────              ───────────────────         ──────────
   2 líneas y listo           control total               dependencia npm normal
   +1 tercero que ve          binario commiteado          se actualiza con pnpm
    la IP de cada familia     a mano                      licencia incluida
   +1 dominio en el           actualizar = repetir        Vite lo sirve desde
    camino crítico             el proceso a mano           NUESTRO origen
```

**Elegido**: `@fontsource-variable/nunito`.

**Por qué no el CDN**: cada carga le diría a Google la IP de una familia que usa un producto para
niños. Y añade un dominio al camino crítico de la primera pantalla, que es justo donde no conviene
depender de nadie.

**Por qué no a mano**: funciona, pero deja un binario en el repositorio sin procedencia clara ni forma
de actualizarlo salvo repetir el proceso. Como dependencia npm, la versión está declarada y la
licencia viaja dentro.

**Lo que hay que verificar y no dar por hecho**: que en el navegador el `.woff2` sale de `localhost` y
**no** de `fonts.gstatic.com`. Fontsource es autoalojado por diseño, pero un import equivocado podría
no serlo, y la diferencia no se ve leyendo el código. Verificado: una sola petición de fuente, a
`localhost`, y cero a Google.

**CORRECCIÓN, escrita al implementar.** Este documento decía importar
`@fontsource-variable/nunito/latin-ext.css`, y **ese archivo no existe**. El paquete sirve
`wght.css`, que declara los cinco subconjuntos, cada uno con su `unicode-range`. Es mejor que lo
planeado, no un apaño: el navegador de un usuario en español descarga **solo `latin`** —38 KB, donde
ya viven la `ñ` y los acentos— y no pide los otros cuatro nunca. Un subconjunto suelto habría traído
`latin-ext` entero siempre, para todo el mundo. Comprobado en la pestaña de red: una petición, un
archivo.

### 3. El import va en `tokens.css`

**Elegido**: `@import` de la hoja de la fuente al principio de `tokens.css`, junto al de Tailwind.

**Por qué ahí**: los dos puntos de entrada ya importan ese archivo, así que es una línea en vez de
dos, y en el sitio que el proyecto ya reconoce como la fuente única de lo visual. Importarla en
`main.tsx` dejaría el catálogo vivo con otra tipografía que la aplicación, y el catálogo existe
precisamente para enseñar cómo se ven las piezas de verdad.

### 4. El respaldo se queda, y no es decorativo

```css
--font-sans: "Nunito Variable", ui-rounded, "SF Pro Rounded", system-ui, sans-serif;
                                └──────────── el respaldo de hoy ────────────┘
```

Sin él, un fallo de carga da la serif por defecto del navegador: Times New Roman en una aplicación
para niños. Con él, lo peor que pasa es que se vea como se veía ayer.

Y con `font-display: swap` —lo que trae Fontsource— el texto es visible desde el primer fotograma con
el respaldo, en lugar de quedarse invisible esperando. A cambio hay un salto visual al cargar, que es
el intercambio correcto: leer tarde es peor que leer y que cambie la forma.

### 5. Las cifras tabulares van en `Coins`, no en el token

**Elegido**: `font-variant-numeric: tabular-nums` en la pieza `Coins`.

**Por qué en la pieza y no en `body`**: alinear cifras es lo correcto en una **columna de números**, y
lo incorrecto en un texto corrido, donde las cifras tabulares dejan huecos raros. `Coins` es
exactamente la pieza que dibuja cantidades, y es donde el proyecto ya concentró todo lo que sabe sobre
cómo se muestra una cantidad.

**CORRECCIÓN, escrita al implementar.** Este documento anunciaba un «beneficio que no se buscaba»: que
la cuenta animada del saldo de la landing dejaría de desplazar el texto. **No era cierto, porque ya no
se desplazaba.** Medido: Nunito trae cifras de ancho fijo por defecto, y Segoe UI —el respaldo en
Windows— también. Muestreando la animación fotograma a fotograma salen 158 muestras con **un solo
ancho y un solo borde izquierdo**, y salían igual antes.

Eso no invalida la decisión, le cambia el argumento. Declararlo no arregla nada hoy: lo que hace es
**dejar de depender de qué familia gane**. SF Pro Rounded, que es el respaldo en Apple, tiene cifras
proporcionales; y una familia futura puede tenerlas igual. La alineación pasa de ser una propiedad
afortunada de la fuente elegida a ser algo que el sistema pide.

## Risks / Trade-offs

- **La aplicación cambia de aspecto en Windows y Android** → Es el objetivo. Lo que hay que comprobar
  es que no rompe ninguna disposición: Nunito es algo más ancha que Roboto, así que un texto que hoy
  cabe justo podría envolver. Se revisa en las pantallas con menos sitio.
- **~40 KB más en la primera carga** → Es una fuente variable con todos los pesos en un archivo, así
  que sustituye a las cuatro que habría que cargar por separado. Se comprueba el peso real tras
  compilar, y si pasa de ~60 KB es que el subconjunto está mal.
- **Un salto visual al cargar la fuente** → `swap` lo provoca a propósito. La alternativa, `block`,
  deja el texto invisible hasta 3 segundos, que es peor.
- **Fontsource podría no ser autoalojado si se importa mal** → Por eso la verificación es mirar la
  pestaña de red, no leer el código.

## Migration Plan

1. La dependencia y el import. Todavía sin cambiar el token: la aplicación se ve igual y se comprueba
   que el `.woff2` llega desde nuestro origen.
2. El token. Aquí cambia el aspecto, y se mira en las tres superficies.
3. Las cifras tabulares en `Coins`.
4. Los tests que impiden la vuelta atrás.

**Vuelta atrás**: revertir la línea del token deja la aplicación exactamente como está hoy, con la
dependencia instalada y sin usar.

## Open Questions

Ninguna.

## Decisiones que este change NO toma

- **Si algún día conviene Lexend** por su investigación sobre lectura infantil. Queda anotada arriba
  como primera candidata, con el argumento entero, para no tener que reconstruirlo.
- **El resto de la identidad visual**: `polish-brand-and-a11y`.
- **Una familia de display para el saldo**: descartada aquí, no para siempre.

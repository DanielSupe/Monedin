# El mapa de piezas

Las maquetas son HTML plano: **2 489 estilos en línea, 0 componentes**. El lint
del proyecto prohíbe el prop `style` en todo `src`, así que traducirlas
literalmente no compila. Este documento es el puente.

> **El orden importa.** Primero los tokens, después las piezas, y solo entonces
> las pantallas. Al revés —traducir pantalla por pantalla— es exactamente lo que
> produce esos 2 489 estilos en línea, y además cada pantalla resuelve la misma
> pieza de una manera distinta.

---

## La regla: lo máximo de shadcn, lo mínimo a mano

1. **Si shadcn tiene la pieza, se trae con `npx shadcn@latest add <pieza>`** y se
   edita todo lo que haga falta. Son archivos propios en cuanto entran: no hay
   que respetar su forma.
2. **Si shadcn la tiene a medias, se trae igual** y se usa como esqueleto —el
   cableado de Radix, el foco, el teclado, los roles ARIA—, y se le cambia el
   aspecto entero.
3. **A mano solo lo que es MARCA**, que es justo lo que ninguna librería puede
   darte: la moneda, la mascota, el anillo, el panel de degradado.
4. **Y si en algún punto shadcn estorba, se descarta sin discutirlo.** Lo que
   manda es que se vea como el diseño.

**Lo que shadcn NO trae consigo: su paleta.** Sus componentes leen variables
(`bg-background`, `text-foreground`, `border-border`), y esas variables las
declara `tokens.css` apuntando a los tokens de Monedín. Es una capa de alias de
quince líneas y está en `tokens.md`. Traer su paleta sería tener dos fuentes de
verdad del color, que es la regla que este proyecto protege con más celo.

Tres detalles que hay que saber antes de traer el primer componente:

- **Radix ya está instalado** (`dialog`, `accordion`, `tabs`, `toast`), así que
  varios shadcn no añaden dependencia: sustituyen envoltorios que ya existen.
- **`cn()` de shadcn es `clsx` + `tailwind-merge`; el `cx` de aquí no lo es, a
  propósito.** Un componente traído que dependa de fusionar clases se adapta: las
  variantes se declaran como props, no se imponen desde fuera con `className`. Si
  alguno lo necesita de verdad, se añade `tailwind-merge` y se dice por qué.
- **Iconos**: `lucide-react` (el de shadcn) para lo genérico —cerrar, chevron,
  lápiz, reloj, cámara—. Dibujados a mano solo la moneda, los doce animales y
  Monedín. Un icono de marca no se delega.

---

## Lo que YA existe y las maquetas usan sin saberlo

Veintiuna piezas en `apps/web/src/ui/`. Casi todo lo que dibujé es una de ellas
con otro color. **Ninguna se reescribe: se repintan solas al cambiar los tokens.**

| Bloque de la maqueta | Pieza | Qué cambia |
| --- | --- | --- |
| Tarjeta blanca con borde y sombra | `Card` | radio y sombra, vía token |
| Botón naranja / de contorno | `Button` | `primary` pasa a naranja; nada más |
| Píldora de estado | `Badge` | los tonos se renombran (decisión 2) |
| Cifra con su moneda | `Coins` | nada |
| Barra de «te faltan N» | `ProgressBar` | nada |
| Tabla de canjes del niño | `DataTable` | nada |
| Anterior / Siguiente | `Pagination` | nada |
| Aviso de color | `Alert` | los cuatro tonos, reasignados |
| Campo con etiqueta y ayuda | `Field` + `Input` | radio y borde |
| Diálogo de confirmación | `Dialog` | radio y sombra |
| Acordeón de preguntas | `Accordion` | nada |
| Cara de un perfil | `Avatar` | el mapa de emoji a SVG (decisión 3) |
| Velo con agujero del recorrido | `Spotlight` | nada |
| Listado vacío | `EmptyState` | nada |
| Cargando | `Skeleton` | nada |
| Marca | `Logo` | nada |
| Filtros por estado | `tabLinkClasses` | **no son pestañas**: ya está resuelto |

Sobre la última fila: `Tabs` existe y **no encaja**, y eso ya está argumentado en
`CLAUDE.md`. Un filtro que vive en la dirección es una lista de enlaces, no cuatro
paneles. La salida fue exportar el aspecto (`tabLinkClasses`) y dejar que el
control siga siendo un `<Link>`. Las maquetas lo respetan.

---

## Lo que hay que traer de shadcn

| Necesidad | shadcn | Qué se edita | Por qué merece la pena |
| --- | --- | --- | --- |
| El lateral con colapsar y cajón | `sidebar` | los colores y los destinos | trae el colapsable, el cajón por debajo de `lg` y el estado, que hoy están escritos a mano en `app/Sidebar.tsx` |
| El cajón lateral estrecho | `sheet` | colores | sustituye a `Drawer` |
| Menú del perfil, si aparece | `dropdown-menu` | colores | teclado y foco resueltos |
| Elegir «para quién» | `checkbox` + `label` | aspecto entero | hoy es un `<span>` con un check dibujado |
| «Mismo valor / uno para cada uno» | `radio-group` | aspecto entero | hoy es un `<span>` con un punto |
| Acercar en el recorte | `slider` | aspecto entero | hoy es una barra falsa |
| Fecha límite | `calendar` + `popover` | aspecto entero | el nativo no se puede vestir, y en oscuro se queda claro |
| Formularios | `form` (+ `react-hook-form`) | — | **opcional**: los formularios de aquí son de 3-5 campos |

Los cuatro últimos son los que más trabajo ahorran, porque son controles que hoy
en las maquetas están **dibujados, no funcionando**.

---

## Lo que hay que hacer a mano: cinco piezas

Son las de marca. Ninguna librería las tiene, y son las que hacen que se parezca
al diseño.

### 1. `HeroPanel` — la más repetida: sale en 13 pantallas

El panel de degradado con dos círculos translúcidos detrás y un hueco para la
mascota. Toma `tone` (`action` naranja | `saving` morado), la pose de Monedín y
su contenido.

Es la pieza con más riesgo de divergir: si cada pantalla la escribe, en dos meses
hay trece degradados distintos. **Que exista una sola es la mitad de que el
rediseño aguante.**

### 2. `IconTile` — la tesela de icono

Cuadrado redondeado con un icono de línea dentro, en tres tintes (naranja, morado,
arena) y dos medidas (36 en el padre, 46-52 en el niño). Sale en cada fila de
tarea, cada destino y cada aviso.

### 3. `ProgressRing` — el anillo «2 de 5 hechas»

Dos círculos SVG y un `stroke-dasharray`. Lo que **no** puede hacer es calcular su
propio dato: recibe hechas y total. De dónde salen esas dos cifras está en
`datos-derivados.md`, y no es tan obvio como parece.

### 4. `Mascota` + `Globo` — Monedín y lo que dice

Una pose de `assets/tutorial/` y, opcionalmente, un bocadillo. Hoy cada pantalla
elige su pose a mano; el widget ya tiene ese mapa en `app/widget-lines.ts`, así
que la pieza debería leerlo de ahí y no de un segundo sitio.

### 5. `CoinPill` — el saldo en la cabecera

**Solo si se resuelve la decisión 5 a favor de que se quede.** Si se quita, esta
pieza no existe y el inicio del niño recupera el saldo grande con `--text-hero`.

---

## Lo que ninguna pieza resuelve, y hay que dibujar en la pantalla

- **El estrecho.** Las maquetas son 1440 fijos. El cajón, el apilado de las dos
  columnas y la tabla de canjes a 390 px no están dibujados, y la tablet es el
  escenario más probable.
- **Los otros cuatro estados.** Dibujé uno por pantalla; faltan vacío, cargando,
  error y foco. `EmptyState` y `Skeleton` ya existen: es cuestión de decidir qué
  dicen, no de construirlos.

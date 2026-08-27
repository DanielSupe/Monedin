## Context

Ver `proposal.md` — Why.

Lo que condiciona el cómo:

- **La raíz ya elige marco por el actor**, y es el único sitio que no se desmonta al navegar. Los dos
  marcos existentes cuelgan de ahí.
- **`fullBleed` ya existe** como dato estático de ruta, y lo declara solo `/welcome`. Se eligió así
  para no escribir direcciones a mano en la raíz: una dirección escrita ahí se desincroniza el día
  que alguien renombre la ruta y el typecheck no lo ve.
- **Todas las rutas de la aplicación exigen actor.** Las que no lo exigen son exactamente las cinco de
  entrada más la puerta pública.
- **`Logo` ya es una pieza** con tres tallas, usada por la puerta pública y por los dos marcos.
- **`Avatar` tiene tres tallas** y las declara en un `Record`. `large` son 6 rem.
- **Hay un test que exige que toda pieza exportada aparezca en el catálogo vivo.**

## Goals / Non-Goals

**Goals:**

- Que la marca no desaparezca en medio del camino de entrada.
- Que el contenido de esas pantallas esté centrado, no pegado arriba.
- Que qué pantallas son se deduzca del estado y no de una lista.
- Que la rejilla se toque con el dedo de un niño.

**Non-Goals:**

- Vestir por dentro las pantallas que el marco enmarca.
- Tocar la puerta pública ni los marcos del padre y del niño.
- Resolver la foto al crear un perfil. Ver el «No incluye» de la proposal.

## Decisions

### 1. Un tercer marco, no un contenedor con excepciones

**Elegido**: `app/EntryShell.tsx`, hermano de `ChildShell` y `ParentShell`.

```
   antes                              después
   ─────                              ───────
   actor CHILD   → ChildShell         actor CHILD   → ChildShell
   actor PARENT  → ParentShell        actor PARENT  → ParentShell
   fullBleed     → <Outlet/>          fullBleed     → <Outlet/>
   resto         → <main> de lectura  resto         → EntryShell
                   sin marca, arriba              logo + centrado
```

**Por qué un marco y no un `if` con estilos en la raíz**: el proyecto ya decidió que un marco es una
pieza de `app/`, que sabe de rol y de destinos pero no de negocio. Un tercero encaja sin inventar
nada; unos estilos sueltos en la raíz serían el cuarto sitio donde se decide cómo se ve algo.

### 2. Quiénes lo reciben se DEDUCE, no se lista

**Elegido**: lo recibe todo lo que llega a la rama final de la raíz — sin actor y sin `fullBleed`.

**Por qué**: es exactamente el conjunto que se quiere, y sale gratis. Todas las rutas de la
aplicación exigen actor, así que si una llega ahí es porque nadie ha entrado todavía. Una lista de
direcciones habría que mantenerla, y el día que `redesign-access` añada una pantalla al camino de
entrada, nadie se acordaría.

**Efecto colateral, y es bueno**: la pantalla de «no encontrado» sin sesión también recibe el marco.
Antes era un texto suelto en medio de la nada.

### 3. El centrado vertical no puede recortar

Un formulario más alto que la pantalla **no se puede centrar y ya está**: si el contenedor fija la
altura, lo que sobra se corta en silencio y no hay forma de llegar al botón.

```
   h-dvh + centrado          min-h-dvh + centrado
   ────────────────          ────────────────────
   corto → centrado           corto → centrado
   largo → RECORTADO          largo → crece y la página se desplaza
```

Se usa `min-h-dvh` con el contenido creciendo. Comprobado en una ventana de 390×500 con el alta de
perfil: el documento crece a 735 px, la página se desplaza y se llega al botón.

**CORRECCIÓN, escrita al implementar.** Este documento decía además que «el ancho de lectura se
conserva dentro: centrar no es ensanchar». **Estaba mal**, y se vio al abrirlo: con 40 rem, las
cuatro teselas de la rejilla no caben en una fila y se parten en 3 + 1 en una pantalla de 1100 px.

El error fue tratar el ancho como cosa del marco. No lo es: solo cada pantalla sabe si es un
formulario o una fila de caras, y **cuatro de las cinco ya declaraban el suyo** —22 rem el acceso, 22
rem el restablecimiento, 28 rem el teclado de PIN, 24 rem el alta—. La única que no lo hacía era
justo la que quería ser ancha.

El marco centra y **no impone ancho**. La rejilla declara el suyo, ancho y acotado, para no
desparramarse en un monitor grande.

### 4. Los 8 rem son una talla de `Avatar`, no una medida en la rejilla

**Elegido**: `xlarge` en `Avatar`, y la rejilla la pide por su nombre.

Es la respuesta que el design de `redesign-profile-grid` dejó escrita para este caso exacto: «si a
`large` la tesela queda pequeña, la talla se añade a la pieza y no se escribe una medida arbitraria
en la rejilla». Aquí se cobra.

La tesela crece con ella —el círculo tiene que caber— y el «+» de agregar perfil también, porque son
la misma fila y una tesela más baja que las demás se lee como un error.

La talla nueva entra en el catálogo vivo. Hay un test que lo exige, y ese test existe para que el
catálogo no envejezca.

## Risks / Trade-offs

- **Centrar verticalmente sube el contenido a la mitad de una pantalla alta** → Es lo pedido, y es lo
  correcto para una pantalla de una sola decisión. Para los formularios largos, el punto 3.
- **Círculos más grandes = filas más anchas** → A 390 px hoy caben dos por fila; con 8 rem tienen que
  seguir cabiendo dos. Es lo que hay que mirar, no deducir.
- **Un marco más que mantener** → A cambio de que las cinco pantallas dejen de no tener ninguno.

## Migration Plan

1. `EntryShell` y el cambio de una línea en la raíz.
2. La talla `xlarge` en `Avatar` y en el catálogo.
3. La rejilla la pide, y la tesela crece con ella.

**Vuelta atrás**: devolver la última rama de la raíz al `<main>` de lectura.

## Open Questions

Ninguna. Las tres decisiones abiertas —alcance del marco, tamaño de los círculos y qué hacer con la
foto al crear— se cerraron antes de escribir esto, y la tercera se cerró **dejándola fuera**.

## Decisiones que este change NO toma

- **Cómo se sube una foto al crear un perfil.** Sigue sin decidirse, con los dos caminos y sus
  precios escritos en el «No incluye» de la proposal para no reconstruir el análisis.
- **El aspecto interior de las pantallas enmarcadas**: `redesign-access`.

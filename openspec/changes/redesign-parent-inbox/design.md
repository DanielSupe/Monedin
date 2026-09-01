## Context

El panel del padre señala dos bandejas. Este change viste el sitio al que apuntan.

`TaskBatchList` y `RedemptionInbox` son el mismo andamio duplicado: el mismo nav de filtros, la misma
paginación, el mismo `#b00020`, el mismo borde `1px solid #ccc`. El comentario que explica por qué
cambiar de filtro vuelve a la página 1 está escrito palabra por palabra en los dos archivos.

Pero lo que decide el peso de este change no es la duplicación. Es que **estas dos pantallas son las
únicas del producto que producen un 409 de verdad**, y lo tratan como un error cualquiera. La API se
construyó entera alrededor de esa distinción —transiciones condicionales, comprobación de filas
afectadas, tests de doble tap— y la pantalla que la recibe la tira.

## Goals / Non-Goals

**Goals**

- Vestir las dos bandejas, juntas y con el mismo aspecto.
- Que un conflicto se lea como «alguien se adelantó» y no como «te equivocaste».
- Sacar `Pagination` de las cuatro copias, con dos consumidores reales.
- Resolver qué pasa con `Tabs`, que promete un estreno que no le corresponde.
- Bajar la lista de deuda de 10 a 8.

**Non-Goals**

- **Crear tareas y premios.** `TaskForm`, `RewardForm` y `RewardCatalog` son lo que el padre
  ESCRIBE, no lo que resuelve. Van juntas en el change siguiente.
- **Los perfiles de hijo.** Son `redesign-parent-children`.
- **`ResetPinScreen`.** Se decidió que va con la puerta de entrada, en su propio change: se abre sin
  sesión, lleva `EntryShell` y es hermana de `/sign-in`, no de nada de aquí.
- **Tocar la API.** Ni un endpoint.
- **Resolver desde el panel.** Sigue siendo trabajo de la bandeja, como decidió
  `redesign-parent-home`.

## Decisions

### 1. Las dos bandejas, un solo change

Se consideró el corte por área —`redesign-parent-tasks` con la lista y el formulario— por simetría
con los changes del niño. Se descarta por dos razones, y la segunda es la que decide:

- **Hacen el mismo trabajo.** Mirar lo que espera y resolverlo. Crear un reparto es otra cosa: es
  escribir, no revisar. El panel ya las presenta juntas, bajo un mismo «Te esperan».
- **Una pieza extraída contra DOS puntos de uso está diseñada; contra uno está adivinada.** Con solo
  la lista de tareas, `Pagination` nacería con un único consumidor y con la forma exacta de ese
  consumidor. Con las dos, la forma tiene que servir a un listado que agrupa y a uno plano, que es
  justo la variación que importa.

Y vestirlas con semanas de diferencia es como acaban distintas dos pantallas que deberían ser
iguales.

### 2. `Pagination` recibe sus enlaces, no los construye

Una pieza no puede importar el router: se monta en `ui.html` sin proveedores y en los tests sin
aplicación, y hay un test que prohíbe que importe de `features/` o de `api/`. Una paginación que
construyera sus propios `<Link>` necesitaría saber a qué ruta pertenece y con qué parámetros de
búsqueda, que es exactamente lo que la pieza no puede saber.

Así que los pasos entran como contenido:

```tsx
<Pagination
  page={data.page}
  totalPages={data.totalPages}
  previous={<Link to="/tasks" search={{ page: page - 1, status }}>…</Link>}
  next={<Link to="/tasks" search={{ page: page + 1, status }}>…</Link>}
/>
```

La pieza decide **cuándo no dibujarse** —una sola página— y cómo se lee la posición; quien la usa
decide a dónde va. No hay paso a la anterior en la primera página ni a la siguiente en la última, y
eso se expresa no pasando el hueco.

Se descartó una prop `renderLink: (page, hijos) => ReactNode`: es más flexible y más difícil de leer
en el punto de uso, y la flexibilidad de más no la pide nadie hoy.

### 3. El filtro NO son `Tabs`, y la cabecera de `Tabs` estaba equivocada

`Tabs` dice desde `add-design-system`: «las estrenarán los filtros por estado del padre». Al ir a
usarla, no encaja, y no por un detalle:

```
lo que Tabs es                        lo que el filtro es
──────────────                        ───────────────────
posee su contenido: un panel          una sola lista, que se vuelve a pedir
  por pestaña                           con otro parámetro
cambia por onValueChange              cambia por navegación: el filtro vive
  (estado)                              en la DIRECCIÓN
sus disparadores son <button>         cada opción ES una dirección
```

Usarla obligaría a cuatro paneles para una sola lista, y convertiría cuatro enlaces en cuatro
botones: se perdería abrirlos en otra pestaña y copiar el enlace de lo que se está mirando, sin ganar
nada. Y chocaría con la regla de que navegar es trabajo de un enlace.

La salida es la que el proyecto ya tiene inventada para este caso exacto: **`buttonClasses`**. Un
enlace que se ve como un botón no puede ser un botón dentro de un enlace, así que la pieza exporta su
aspecto. `Tabs.tsx` exporta ahora `tabLinkClasses(active)` y el filtro es un `<nav>` de `<Link>` con
`aria-current="page"` en el vigente.

`Tabs` **se queda** —está probada, catalogada y es legítima para pestañas de verdad— pero su cabecera
deja de prometer un estreno que ya se descartó. Una afirmación falsa dentro de una pieza es peor que
ninguna: manda al siguiente que la lea a usarla donde no encaja, que es justo lo que estuvo a punto
de pasar aquí.

### 4. El conflicto en ámbar: la distinción que la interfaz estaba tirando

`Alert` tiene cuatro tonos y su cabecera explica, desde que se escribió, que el 409 va en advertencia
y no en peligro. Las dos únicas pantallas que producen 409 lo pintan de rojo.

Nace `alertToneFor(error)` en `lib/`, no en `ui/`: mira el código del error de la API, y una pieza no
sabe de códigos de error.

```ts
CONFLICT            → "warning"   alguien se adelantó
cualquier otro      → "danger"    algo falló
```

Va en `lib/` y no duplicado en cada `describe*Error` porque los dos módulos lo necesitan igual y el
mapeo es del contrato de errores, que es uno solo.

**El test tiene que comparar los dos tonos entre sí**, no comprobar que cada aviso aparece: con los
dos en rojo, un test que solo busca los textos sigue en verde. Es la lección de `redesign-child-shop`
y de `redesign-parent-home`, y aquí el caso ya está elegido para que las dos respuestas den valores
distintos.

### 5. El reparto entero se explica en pantalla

Filtrar por «Por aprobar» y ver tareas pendientes parece un filtro roto. No lo es: el reparto se
enseña completo a propósito. Hoy eso solo está dicho en un comentario del código y en el design de
`add-tasks`.

Se dice en la pantalla, y solo cuando hay filtro: sin filtro no hay nada que explicar y la frase
sería ruido.

Se descartó lo contrario —recortar el reparto a las filas que casan— porque cambiaría el
comportamiento de la API para tapar un problema de redacción, y porque el padre quiere ver el grupo
completo, que es la razón por la que se devuelve entero.

### 6. Los textos de paginación se unifican

`previousPage` y `nextPage` están declarados **cuatro veces** en el catálogo, uno por módulo, con el
mismo valor. La pieza es una, así que el texto es uno: pasan a `messages.ui`, donde ya viven los
textos de las piezas.

### 7. Lo que NO se toca de estas pantallas

El enlace a crear un reparto se queda en la lista de tareas, vestido como enlace con aspecto de
botón. Mudarlo sería decidir dónde vive la creación, y eso es del change siguiente.

## Risks / Trade-offs

- **`RewardCatalog` y `ChildrenList` siguen con su paginación copiada** hasta que se vistan. Se
  aceptó: convertirlas ahora tocaría dos pantallas sin vestir sin cerrarlas, y su change está a la
  vuelta. Queda anotado en sus tareas.
- **`Tabs` sigue sin usarse en producto.** Ya no es una promesa pendiente sino una decisión: si
  cuando la lista de deuda quede vacía sigue sin consumidor, se borra. No se borra hoy porque este
  change no ha mirado las pantallas que faltan.
- **`alertToneFor` crece si aparecen más tonos por código.** Hoy son dos ramas y el resto es
  `danger`; convertirlo en una tabla completa de códigos sería inventar tratamiento para errores que
  ninguna pantalla distingue.

## Migration Plan

Sin migración: mismas direcciones, mismos parámetros de búsqueda, mismas guardas.

## Open Questions

Ninguna que bloquee.

## Decisiones que este change NO toma

- **Si el padre lista en tabla o en tarjetas.** El design de `add-design-system` dejó la pregunta
  para aquí y la respuesta es tarjetas, pero **solo para estas dos**: un reparto es un grupo con
  filas dentro y una tabla no anida. Si el catálogo de premios pide tabla, lo decide su change.
- **Dónde vive crear un reparto o un premio.** Change siguiente.
- **Si `Tabs` se queda en el sistema.** Se decide cuando se sepa si alguna pantalla la necesita.

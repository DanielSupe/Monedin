## Context

Cada rol aprendió a moverse de una forma distinta —barra arriba el padre, barra abajo el niño— y en
los dos casos hay un destino que no está en la barra y cuelga del avatar de la cabecera. Son dos
navegaciones y ninguna completa.

Este change las sustituye por una: un cajón lateral izquierdo con **todos** los destinos del rol
activo, con el icono de cada uno a la derecha de su texto.

Llega **entre dos changes de rediseño y no al final** a propósito: quedan tres pantallas por vestir, y
cada una que se vista contra la navegación vieja es una que habrá que volver a mirar.

## Goals / Non-Goals

**Goals**

- Una sola navegación dentro de un perfil, con todos los destinos.
- Que se abra y se cierre bien **con el teclado**, que es donde esto se hace mal.
- Que se cierre al llegar, incluido el botón atrás.
- Dejar el aspecto en un solo sitio, como ya se hizo dos veces.

**Non-Goals**

- **Fijar el lateral abierto en pantallas anchas.** Se eligió cajón en todos los tamaños.
- **Unificar el sistema de iconos**, que es de `polish-brand-and-a11y`.
- **Vestir nada de la lista de deuda**, que sigue en ocho.
- **`EntryShell`.** El cajón existe solo con perfil activo.
- **Tocar la API.** Ni un endpoint.

## Decisions

### 1. Sobre Radix Dialog, y NO sobre `ui/Dialog`

Un cajón correcto atrapa el foco, cierra con Escape, deja inerte el resto del documento y devuelve el
foco al botón que lo abrió. `@radix-ui/react-dialog` ya es dependencia y lo da hecho, que es
exactamente el argumento con el que se eligió para el diálogo modal.

Lo que **no** se hace es reutilizar `ui/Dialog` colocándolo a la izquierda con clases. `cx` no es
`twMerge`: dos posiciones en la misma cadena las resuelve el orden del CSS generado y no el del
código. Es la razón por la que la forma de `Avatar` es una prop y no un `rounded-*` desde fuera.

Y las dos formas difieren de verdad:

```
ui/Dialog                          ui/Drawer
─────────                          ─────────
centrado, ancho de lectura         anclado a un lado, alto completo
título + descripción + pie         una superficie y ya
se abre SIN Trigger, así que       TIENE Trigger, así que Radix
lleva un baile de useRef para      devuelve el foco solo
devolver el foco
```

Esa última línea es la que decide: meter el cajón dentro de `Dialog` heredaría una complicación que
el cajón no necesita.

`Drawer` recibe `open`, `onOpenChange`, `label`, `trigger` y `children`. Sin dominio y sin router —los
enlaces los pone quien la usa, igual que `Pagination`—, y con entrada en el catálogo vivo.

**Controlado Y con `Trigger`**: hace falta `open` controlado para poder cerrarlo al navegar, y hace
falta el `Trigger` para que Radix devuelva el foco. Las dos cosas a la vez.

Radix exige un `Title` para anunciarse; el del cajón va oculto a la vista con `sr-only`, porque lo
que se ve es la lista.

### 2. La apertura es `useState`, y por qué eso NO contradice la regla

«La navegación es del router, no del estado» habla de **qué pantalla se enseña**. Abrir un cajón es
una revelación, no un destino.

La prueba está en compararlo con el caso que sí fue a la dirección:

```
?manage=true (redesign-profile-grid)       el cajón
────────────────────────────────────       ─────────
tiene que SOBREVIVIR a una navegación      tiene que MORIR con ella
cruza hasta el teclado de PIN              no cruza a ningún sitio
recargar lo conserva                       recargar lo abriría sin que nadie lo pida
atrás sale del modo                        atrás debe VOLVER, no cerrar un panel
```

Se cierra **al cambiar la dirección**, con `useRouterState`, y no en el `onClick` de cada enlace: el
botón atrás también cambia la dirección, y un panel abierto tapando la pantalla a la que se acaba de
volver es peor que no tenerlo.

`tests/app/no-state-router.test.ts` solo mira `src/features`, así que no hay ni roce con él. Queda
escrito de todas formas, porque el parecido es lo bastante grande como para que alguien lo confunda.

### 3. Se van las dos barras y el enlace del avatar

| | Antes | Después |
| --- | --- | --- |
| padre | `<nav>` de 4 en la cabecera | el cajón |
| niño | `<nav>` inferior de 4 | el cajón |
| los dos | avatar → `/account` · `/me/settings` | pie del cajón |

Dejar cualquiera de las barras daría los mismos destinos dos veces, que es el defecto que
`redesign-parent-home` acaba de quitar del inicio del padre.

El perfil va al **pie** y no entre los destinos: no es un sitio de la aplicación al mismo nivel que
tareas o premios, y ponerlo con ellos lo hace competir con lo que se usa a diario.

**Consecuencia declarada:** en escritorio la navegación queda detrás de un botón. Es lo que se
decidió; fijar el lateral abierto a partir de cierto ancho es un cambio pequeño si más adelante se
quiere.

**Lo que se pierde y se acepta:** la barra inferior del niño estaba abajo porque «el pulgar está
abajo». Con el cajón, un niño da un toque más para cambiar de sección. A cambio gana su perfil en la
lista —hoy escondido tras el avatar— y las mismas cuatro secciones con icono y nombre en lugar de
cuatro palabras pequeñas.

### 4. Texto a la izquierda, icono a la derecha

Como se pidió. `justify-between` en cada fila. El icono es **decorativo** y va con `aria-hidden`: lo
que nombra al destino es su texto, así que el icono no aporta nombre y no debe duplicarlo.

El aspecto se exporta como `sidebarItemClasses(active)`. Es la tercera vez que el proyecto usa este
patrón —`buttonClasses`, `tabLinkClasses`— y por la misma razón: el control es un enlace porque el
destino es una dirección.

### 5. Colores: tokens, y no el índigo profundo

`bg-surface-raised` para el panel, `border-border` para separarlo, y el destino vigente con
`bg-primary-soft` + `text-primary`, que es el mismo índigo con el que las barras de hoy ya marcan lo
activo.

**No** se usa `data-surface="brand"`. Ese índigo oscuro es la superficie decidida para el acceso, y la
razón escrita es que la calidez le corresponde al niño. Un cajón oscuro dentro de su aplicación
reabriría esa decisión de pasada, que es justo como se pierden.

### 6. Los iconos, y una duplicación declarada

`app/nav-icons.tsx`, con la convención de `features/auth/access-icons.tsx`: `viewBox 0 0 24 24`,
`stroke="currentColor"`, trazo simple, decorativos.

No se importan los de `access-icons` porque `app/` no conoce `features/` —es la frontera que
`redesign-child-home` dejó escrita—. El ayudante `Trazo` queda duplicado, seis líneas, **declarado y
con dueño**: `polish-brand-and-a11y`, que es el change que la propia cabecera de `access-icons` ya
nombra para tirar ese archivo.

### 7. Dos tests de `shells.test.tsx` cambian de sondeo, y se dice

Hoy comprueban que existe el `<nav>` de cada rol y que **es el mismo nodo tras navegar** —lo que
protege es que el marco no se remonte en cada toque—. El `<nav>` se muda dentro del cajón, que ya no
está en el DOM cuando está cerrado, así que ese sondeo deja de servir.

Se reancla a la **cabecera**, que es lo que ahora persiste y lo que de verdad no debe remontarse. La
intención se conserva entera; lo que cambia es dónde se mide. No se ablanda ningún test.

## Risks / Trade-offs

- **Un toque más para el niño.** Declarado en la decisión 3.
- **La navegación queda oculta en escritorio.** Declarado en la decisión 3.
- **Radix avisa por consola si falta el `Title`.** Va oculto, no ausente.
- **Un cajón que no cierre al navegar dejaría al usuario tapado.** Es el fallo más probable de esta
  pieza, así que tiene test propio y se comprueba inyectando la violación.

## Migration Plan

Sin migración: no cambia ninguna dirección, ninguna guarda ni ningún dato.

## Open Questions

Ninguna que bloquee.

## Decisiones que este change NO toma

- **Si el lateral debería quedarse fijo en pantallas anchas.** Se mira cuando se haya usado.
- **Si el niño necesita además un acceso rápido abajo.** Se mira con la tablet delante, no aquí.
- **El sistema de iconos definitivo.** `polish-brand-and-a11y`.

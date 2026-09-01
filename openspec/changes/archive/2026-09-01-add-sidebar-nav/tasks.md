## 1. La pieza

- [x] 1.1 Crear `apps/web/src/ui/Drawer.tsx` sobre `@radix-ui/react-dialog`: `open`, `onOpenChange`,
      `label`, `trigger` y `children`. Anclado a la izquierda, alto completo, con superposición.
      Controlado **y** con `Trigger`: lo primero para poder cerrarlo al navegar, lo segundo para que
      Radix devuelva el foco solo.
- [x] 1.2 `Title` de Radix oculto a la vista con `sr-only` —Radix avisa si falta— y superposición que
      cierra al pulsarla.
- [x] 1.3 Exportarla en `ui/index.ts` y darle sección en `src/ui-catalog.tsx`, que es lo que exige el
      test del catálogo. Con su disparador y una lista de ejemplo, sin router.

## 2. Los iconos y los textos

- [x] 2.1 Crear `apps/web/src/app/nav-icons.tsx` con siete trazos —inicio, tareas, premios, canjes,
      hijos, cuenta y perfil—, misma convención que `access-icons.tsx`, y anotar por qué el ayudante
      queda duplicado y quién lo recoge.
- [x] 2.2 Añadir a `messages.ts` la etiqueta del botón de menú y la del cajón. Reutilizar los textos
      de destino que ya existen en `nav`.

## 3. El lateral

- [x] 3.1 Crear `apps/web/src/app/Sidebar.tsx`: la superficie del contenido del cajón, el pie de
      perfil —avatar y nombre— y `sidebarItemClasses(active)` exportado.
- [x] 3.2 Cada destino es un enlace con el texto a la izquierda y el icono a la derecha
      (`justify-between`), el icono con `aria-hidden`, y `aria-current="page"` en el vigente.
- [x] 3.3 Colores solo de tokens: `bg-surface-raised`, `border-border`, y el vigente con
      `bg-primary-soft` + `text-primary`. Nada de `data-surface="brand"`.

## 4. Los dos marcos

- [x] 4.1 `ParentShell.tsx`: cabecera con botón de menú y logo; fuera su `<nav>` y el enlace del
      avatar; dentro el cajón con sus cinco destinos y el pie a `/account`.
- [x] 4.2 `ChildShell.tsx`: lo mismo con sus cinco destinos y el pie a `/me/settings`; fuera la barra
      inferior.
- [x] 4.3 El estado de apertura vive en cada marco y se cierra **al cambiar la dirección**, con
      `useRouterState`, no en el `onClick` de cada enlace: el botón atrás también cambia la
      dirección.
- [x] 4.4 Comprobar que `EntryShell` no recibe nada de esto.

## 5. Hacer cumplir

- [x] 5.1 Test de `Drawer` montada sola: abre con su disparador, cierra con Escape y el foco vuelve
      al disparador.
- [x] 5.2 Test de que el cajón se cierra al navegar, **por las dos vías**: pulsando un destino y con
      `history.back()`.
- [x] 5.3 Test de que están TODOS los destinos de cada rol dentro del cajón, y de que **ninguno
      aparece dos veces** en el marco.
- [x] 5.4 Test de que el destino vigente se anuncia con `aria-current="page"` y los demás no.
- [x] 5.5 Test de que la rejilla de perfiles no tiene control de navegación.
- [x] 5.6 Reanclar los dos tests de `shells.test.tsx` a la cabecera, explicando en el propio archivo
      que el sondeo cambia porque el `<nav>` se mudó dentro del cajón, y que la intención —que el
      marco no se remonte— se conserva.
- [x] 5.7 **Inyectar las violaciones**. La primera —que el cajón no cierre al navegar— cayó como se
      esperaba. La segunda **NO**: al quitar el `aria-current` escrito a mano el test siguió en verde,
      porque quien lo pone de verdad es el `Link` del router. Eso destapó que el código tenía DOS
      fuentes para «cuál está activo» —el enlace y un cálculo propio— y se corrigió dejando solo la
      del router, con `data-[status=active]:` como ya hacían las dos barras sustituidas. La violación
      que el test sí caza es sustituir el `Link` por un `<a>` a mano: comprobado, cae.
- [x] 5.8 `pnpm turbo run lint typecheck test build --concurrency=1`: **13/13**, con las cuatro
      tareas del web ejecutadas y no servidas de caché (325 tests, 35 archivos). **Queda pendiente de
      TI** la comprobación a ojo: abrir padre y niño a 390 px y en escritorio, y recorrer el cajón
      solo con teclado. El comportamiento de foco y Escape sí está cubierto por test, pero cómo se ve
      no lo cubre ninguno.

## 1. Las piezas

- [x] 1.1 Crear `apps/web/src/ui/Pagination.tsx`: recibe `page`, `totalPages` y los huecos
      `previous`/`next`; no se dibuja con una sola página; el texto de posición sale del catálogo.
      Sin importar el router ni nada de `features/`.
- [x] 1.2 Exportarla en `ui/index.ts` y darle entrada en el catálogo vivo (`ui-catalog.tsx`), que es
      lo que exige el test de piezas catalogadas. Con los dos casos: primera página y página del
      medio.
- [x] 1.3 Añadir `tabLinkClasses(active)` a `ui/Tabs.tsx`, con el mismo aspecto que ya tienen sus
      disparadores, y exportarlo desde `ui/index.ts`.
- [x] 1.4 Corregir la cabecera de `Tabs`: retirar la promesa de que la estrenarán los filtros del
      padre y decir en su lugar para qué sirve y por qué el filtro no es su caso.

## 2. El tono de un conflicto

- [x] 2.1 Crear `alertToneFor(error)` en `apps/web/src/lib/`: `CONFLICT` es `warning`, el resto
      `danger`. Con el porqué al lado, que es el mismo que ya está en la cabecera de `Alert`.
- [x] 2.2 Unificar `previousPage` y `nextPage` en `messages.ui` y borrar los cuatro pares por módulo,
      actualizando sus puntos de uso.
- [x] 2.3 Añadir al catálogo el texto que explica que un reparto filtrado se enseña entero.

## 3. La bandeja de tareas

- [x] 3.1 Reescribir `TaskBatchList.tsx` con `Card`, `Badge`, `Coins`, `Avatar`, `Button`, `Alert`,
      `EmptyState`, `Skeleton` y `Pagination`. Cero estilos en línea, cero colores literales.
- [x] 3.2 El filtro pasa a `<nav>` de `<Link>` con `tabLinkClasses` y `aria-current="page"` en el
      vigente, conservando que cambiar de filtro vuelve a la página 1.
- [x] 3.3 Cada reparto es una tarjeta con su cabecera —título, descripción, fecha— y sus filas
      dentro; cada fila con el hijo, sus monedas y su estado como `Badge`.
- [x] 3.4 La evidencia va ANTES de los botones, con medida del sistema, y sigue abriéndose en grande.
- [x] 3.5 Aprobar y rechazar solo en `COMPLETED`; borrar solo en `PENDING`. El fallo de cada fila con
      `Alert` y el tono que decida `alertToneFor`.
- [x] 3.6 Con filtro por estado, la pantalla explica que el reparto se enseña entero. Sin filtro, no.
- [x] 3.7 El enlace a crear un reparto, con `buttonClasses`.

## 4. La bandeja de canjes

- [x] 4.1 Reescribir `RedemptionInbox.tsx` con las mismas piezas y la misma disposición de filtro y
      paginación, para que las dos bandejas se parezcan de verdad.
- [x] 4.2 Cada canje es una fila con el hijo, el premio, su precio y su estado como `Badge`,
      reutilizando los tonos que ya decidió `redesign-child-shop` —rechazado en advertencia, no en
      peligro—.
- [x] 4.3 Aprobar y rechazar solo en `PENDING`, con `Alert` y `alertToneFor` para el fallo.

## 5. Hacer cumplir

- [x] 5.1 Retirar `TaskBatchList.tsx` y `RedemptionInbox.tsx` de las dos listas de deuda y actualizar
      el recuento: de 10 a 8.
- [x] 5.2 Test de `Pagination` montada sola: no aparece con una página; en la primera no hay paso
      atrás; en la última no hay paso adelante; enseña la posición.
- [x] 5.3 Test de que un `CONFLICT` sale en advertencia y otro error en peligro, **comparando los dos
      tonos entre sí**: con los dos iguales el test tiene que fallar.
- [x] 5.4 Test de que cada fila ofrece solo lo que su estado permite, en las dos bandejas.
- [x] 5.5 Test de que el filtro son enlaces, que el vigente se anuncia como actual y que cambiarlo
      vuelve a la página 1.
- [x] 5.6 Test de que con filtro aparece la explicación del reparto entero y sin filtro no.
- [x] 5.7 **Inyectar las violaciones** de 5.3 y 5.5 —los dos tonos iguales, y el filtro como
      botones— y comprobar que los tests caen. Un caso donde lo correcto y lo incorrecto coinciden no
      prueba nada.
- [x] 5.8 `pnpm turbo run lint typecheck test build --concurrency=1`: **13/13**, con las cuatro
      tareas del web ejecutadas y no servidas de caché (312 tests). Dos fallos propios del test —no
      del código— se corrigieron por el camino, y los dos eran el MISMO error: esperar a un texto que
      se pinta antes de que llegue la respuesta —el título de la pantalla— y comprobar la fila sobre
      un esqueleto. Se espera a la LISTA.

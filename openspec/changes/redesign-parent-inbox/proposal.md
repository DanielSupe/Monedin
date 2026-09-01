## Why

`redesign-parent-home` dejó el panel del padre señalando dos bandejas: tareas por aprobar y canjes
esperando respuesta. Este change viste **el sitio al que esas dos flechas apuntan**.

Son el mismo trabajo —mirar lo que espera, aprobar o rechazar— y son, literalmente, el mismo andamio
copiado:

```
                        TaskBatchList   RedemptionInbox   RewardCatalog   ChildrenList
nav de filtros               ✓                ✓                ✓
paginación page/totalPages   ✓                ✓                ✓               ✓
<p style color #b00020>      ✓                ✓                ✓               ✓
border: 1px solid #ccc       ✓                ✓                ✓               ✓
```

El comentario que explica por qué cambiar de filtro vuelve a la página 1 está escrito **dos veces,
palabra por palabra**, en dos archivos distintos.

Y hay dos piezas implicadas, cada una con su historia:

- **`Pagination` no existe.** El design de `add-design-system` dijo que saldría de este change, y
  mientras tanto cuatro pantallas la reescriben.
- **`Tabs` existe y no la usa nadie** salvo el catálogo. Su cabecera dice: «las estrenarán los
  filtros por estado del padre». Este change es donde esa frase se comprueba, y **resulta ser
  equivocada**: el filtro vive en la dirección, así que cada opción es un enlace, no un botón que
  cambia de estado.

Lo más caro, sin embargo, no es la duplicación:

**Estas dos pantallas son las únicas del producto que producen un 409 de verdad**, y lo pintan del
mismo rojo que un error. `Alert` distingue el conflicto desde `add-design-system` y lo dice en su
propia cabecera —«el CONFLICTO es `warning`, no `danger`: nadie hizo nada mal; el padre aprobó dos
veces, o el hermano llegó antes»—. La API se construyó entera alrededor de esa distinción:
transiciones condicionales, comprobación de filas afectadas, tests de doble tap. Y la interfaz que la
recibe la aplana en un párrafo rojo que le echa la culpa al padre.

## What Changes

- **Las dos bandejas se visten**: `TaskBatchList` y `RedemptionInbox`, con las piezas del sistema.
- **Nace `ui/Pagination`**, con hueco para los enlaces en vez de enlaces dentro, porque una pieza no
  puede depender del router. La estrenan las dos bandejas, y las otras dos pantallas paginadas la
  adoptarán al vestirse.
- **Los filtros pasan a ser un nav de enlaces con aspecto de pestañas**, con `tabLinkClasses`
  exportado desde `Tabs.tsx` igual que `buttonClasses` desde `Button.tsx`. Se corrige la cabecera de
  `Tabs`, que promete un estreno que no le corresponde.
- **Un 409 se cuenta como advertencia y no como error.** Nace `alertToneFor(error)`.
- **Un reparto filtrado dice por qué enseña tareas que no casan con el filtro.** Hoy no lo dice y
  parece un filtro roto.
- **Los cuatro `previousPage`/`nextPage` del catálogo se unifican** en uno.
- **La lista de deuda baja de 10 a 8.**

## Capabilities

### Modified Capabilities

- `parent-console`: cómo se ve y se resuelve lo que espera al padre, y qué pasa cuando dos toques
  compiten.
- `design-system`: la pieza de paginación, y qué se hace cuando el aspecto de una pieza tiene que
  servir a un enlace.

## Impact

- **Front, y solo front.** Cero cambios en la API, en los contratos o en la base de datos.
- Nace `apps/web/src/ui/Pagination.tsx` y su entrada en el catálogo vivo.
- `apps/web/src/ui/Tabs.tsx` gana `tabLinkClasses` y pierde una afirmación falsa.
- `apps/web/src/lib/` gana `alertToneFor`.
- `TaskBatchList.tsx` y `RedemptionInbox.tsx` se reescriben.
- `messages.ts` pierde tres pares de textos duplicados.
- Dos listas de deuda pierden dos entradas.

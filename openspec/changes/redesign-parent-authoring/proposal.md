## Why

Quedan las tres pantallas donde el padre **escribe**: repartir una tarea, publicar un premio y
mantener el catálogo. Son las últimas de su área, y no están solo sin vestir.

**Las tres hacen el mismo trabajo y lo resuelven tres veces.** «A quién y por cuánto» —elegir hijos y
ponerle monedas a cada uno— está escrito íntegro en `TaskForm` y en `RewardForm`, casi línea por
línea, y una tercera vez dentro de `RewardCatalog`:

```
                          TaskForm   RewardForm   RewardCatalog
alternar(childId)            ✓           ✓             ✓
elegidos / precios           ✓           ✓             ✓
«el mismo valor» / «uno      ✓           ✓             —
  por hijo»
```

**Dos de las tres no son un `<form>`.** `TaskForm` y `RewardForm` son un `<section>` con un
`type="button"` que llama a `enviar()`. Escribir el título y pulsar Enter no hace nada. `ChildForm`
sí lo es, así que dentro del mismo producto la misma acción responde distinto según la pantalla.

**Y hay un agujero en una regla que creíamos cerrada.** `add-app-shell` prohibió que una pantalla
reciba una función para cerrarse —«la navegación es del router, no de quien la abrió»— y dejó un test
que lo persigue. El test busca `onDone`. Hay **cinco archivos** con `onCancel`, que es exactamente lo
mismo con otro nombre, y pasaron por delante del test sin que saltara.

Es el caso puro de lo que este proyecto da por resuelto: la convención tenía test, pero el test
perseguía un nombre en vez de una forma.

## What Changes

- **Nace una pieza compartida para «a quién y por cuánto»**, con sus dos modos —el mismo valor para
  todos, o uno por hijo—, y la usan las tres pantallas.
- **Las tres pasan a ser un `<form>` de verdad**, con envío por Enter y botón `type="submit"`.
- **Los tres sinónimos desaparecen**, y el test se da la vuelta: en vez de perseguir nombres
  prohibidos, **solo admite los permitidos**. Una prop callback sin argumentos en `features/` solo
  puede llamarse `onSaved`; cualquier otra falla, exista hoy o se invente mañana. Se corrigen los seis
  archivos, incluidos los tres de `children/` que todavía no están vestidos: traducir no es vestir.
- **`TaskForm`, `RewardForm` y `RewardCatalog` se visten** con las piezas del sistema.
- **Editar un premio se queda EN LÍNEA**, decidido: es un retoque pequeño y frecuente, y sacarlo a
  otra pantalla obliga a ir y volver por cada cambio.
- **La lista de deuda baja de 8 a 5.**

## Capabilities

### Modified Capabilities

- `parent-console`: cómo el padre reparte una tarea, publica un premio y mantiene su catálogo.
- `app-navigation`: que una pantalla no reciba una función para cerrarse, dicho por su forma y no por
  el nombre que le toque.

## Impact

- **Front, y solo front.** Cero cambios en la API, en los contratos o en la base de datos.
- Nace `apps/web/src/features/children/ChildrenPicker.tsx` —a quién y por cuánto— con su test.
- `TaskForm.tsx`, `RewardForm.tsx` y `RewardCatalog.tsx` se reescriben.
- `ChildForm.tsx`, `CreateProfileScreen.tsx` y `EditChildScreen.tsx` pierden `onCancel` **sin
  vestirse**: siguen en la lista de deuda hasta `redesign-parent-children`.
- `tests/app/no-state-router.test.ts` deja de perseguir un nombre.
- Dos listas de deuda pierden tres entradas.

## 1. La pieza que faltaba

- [x] 1.1 Crear `apps/web/src/features/children/ChildrenPicker.tsx`: casillas por hijo, selector de
      modo por prop —«el mismo valor» / «uno por hijo», o sin selector— y la cantidad según el modo.
      Con `Field`, `Input`, `Avatar` y `Alert`.
- [x] 1.2 Devuelve lo que el contrato espera —`{ childIds, coins }` o `{ assignments }`— para que
      quien la usa no lo reconstruya.
- [x] 1.3 Exige al menos un hijo y lo dice ANTES de rechazar, no después.
- [x] 1.4 Textos nuevos al catálogo de mensajes; reutilizar los que ya existen en `tasks` y
      `rewards`.

## 2. Las dos altas

- [x] 2.1 `TaskForm.tsx`: `<form>` con `onSubmit` y botón `type="submit"`, vestido con las piezas del
      sistema, usando `ChildrenPicker`. Conservar la validación con el esquema compartido ANTES de
      enviar, y el porqué de la fecha como final del día.
- [x] 2.2 `RewardForm.tsx`: lo mismo, con su foto en vez de la fecha.
- [x] 2.3 Los dos pierden `onCancel`: cancelar navega, como cualquier otra navegación.
- [x] 2.4 El caso «no hay hijos todavía» con `EmptyState` y salida a crear uno.

## 3. El catálogo

- [x] 3.1 `RewardCatalog.tsx` vestido: tarjetas, filtro con `tabLinkClasses` y paginación con
      `Pagination`, igual que las dos bandejas.
- [x] 3.2 La edición en línea del título, la descripción y la foto pasa a ser un `<form>` de verdad.
- [x] 3.3 Reasignar precios usa `ChildrenPicker` sin selector de modo: siempre uno por hijo.
- [x] 3.4 La baja sigue confirmándose con `Dialog`, y el fallo con `Alert` y `alertToneFor`.

## 4. Cerrar el agujero de `onCancel`

- [x] 4.1 Quitar `onCancel` de `ChildForm.tsx`, `CreateProfileScreen.tsx` y `EditChildScreen.tsx`:
      cada pantalla navega ella misma. **Sin vestirlas** — siguen en la lista de deuda.
- [x] 4.2 Reescribir el test de `no-state-router` para que persiga la FORMA y no dos nombres:
      cualquier prop que signifique «ciérrame» declarada como función sin argumentos. `onSaved` sigue
      pasando.

## 5. Hacer cumplir

- [x] 5.1 Retirar `TaskForm.tsx`, `RewardForm.tsx` y `RewardCatalog.tsx` de las dos listas de deuda:
      de 8 a 5.
- [x] 5.2 Test de `ChildrenPicker` montada sola: elegir hijos, cambiar de modo, y que sin ningún hijo
      elegido explique qué falta y no llame al servidor.
- [x] 5.3 Test de que las tres pantallas se envían **con Enter**.
- [x] 5.4 Test de que las dos altas construyen la forma correcta del contrato en cada modo.
- [x] 5.5 Test de que editar un premio ocurre sin cambiar de dirección.
- [x] 5.6 **Inyectar las violaciones**. Volver el envío a `type="button"`: cae. Y el sinónimo
      inventado —`onDismiss`, que NUNCA existió en el proyecto— también cae, que era lo que había que
      demostrar. **La primera pasada del sinónimo pasó en verde**, y no por el test: el reemplazo que
      lo reescribía nunca se había aplicado y el script imprimió «ok» igualmente. Corregido con una
      herramienta que falla si no encaja; de ahí en adelante, toda sustitución lleva `assert`.
- [x] 5.7 `pnpm turbo run lint typecheck test build --concurrency=1`: **13/13** (340 tests). La
      PRIMERA pasada dio 12/13: cayó el lint del web con un import sin usar en el test nuevo, y dos
      avisos de `react-refresh`. Los avisos también se atendieron en vez de tolerarse — son el mismo
      patrón que `ui/` ya tiene exceptuado, y se nombran uno a uno—, porque un aviso que nunca hay que
      atender le quita credibilidad a los que sí. **Queda pendiente de TI** abrir las tres pantallas
      en escritorio y a 390 px: cómo se ven no lo cubre ningún test.

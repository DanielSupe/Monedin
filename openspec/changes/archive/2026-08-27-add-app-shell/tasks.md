> Orden no negociable: la aplicación tiene que seguir **usable** después de cada grupo. Nada de
> retirar `AuthGate` antes de que todas las rutas tengan su guarda. Ver el plan de migración.

## 1. Cimientos del router

- [x] 1.1 Pasar `queryClient` en el contexto del router desde `main.tsx`, y declarar su tipo para que
      `beforeLoad` lo reciba tipado.
- [x] 1.2 Escribir el ayudante de guarda: resuelve la sesión con `ensureQueryData` y devuelve lo que
      ya decide `screenFor()`. **No se reescribe `screenFor()`**: se conserva tal cual y solo cambia
      qué se hace con su resultado.
- [x] 1.3 Ruta 404 con su texto en el catálogo de mensajes y una salida a un destino válido.
- [x] 1.4 Test del 404 y de que el contexto llega. La app sigue viéndose y funcionando igual.

## 2. Las pantallas previas a ser alguien

- [x] 2.1 Rutas `/sign-in` y `/profiles`, con la guarda que manda a cada una según el estado de la
      sesión: sin sesión a la primera, con cuenta y sin perfil a la segunda.
- [x] 2.2 Rutas `/profiles/:profileId/pin`, `/profiles/new` y `/profiles/reset-pin`. Con esto
      **desaparece la unión `View` de `ProfileGrid`** y sus tres `onDone`.
- [x] 2.3 Que el teclado de PIN obtenga el perfil de la dirección y no de una propiedad. Un
      identificador que no existe lleva de vuelta a la rejilla, no a una pantalla en blanco.
- [x] 2.4 Tests de guarda: sin sesión, cualquier destino acaba en el acceso; con cuenta y sin perfil,
      en la rejilla.

## 3. Los dos marcos

- [x] 3.1 `app/ParentShell.tsx`: cabecera con navegación y avatar, con `data-scale="parent"`.
- [x] 3.2 `app/ChildShell.tsx`: barra inferior de cuatro destinos, con `data-scale="child"`.
- [x] 3.3 Rutas de disposición que eligen el marco por el rol del actor, de modo que **el marco no se
      desmonte** al navegar entre destinos del mismo rol.
- [x] 3.4 Si hace falta una pieza de navegación que no existe, se añade a `ui/` **con su test y su
      entrada en el catálogo**, como exige la spec `design-system`. Si no hace falta, no se inventa.
- [x] 3.5 Tests: cada rol recibe su marco, el `data-scale` correcto llega al DOM, y los objetivos de
      toque del marco del niño cumplen los 44px de su escala.

## 4. Los destinos del niño

- [x] 4.1 Rutas `/me/tasks`, `/me/rewards`, `/me/redemptions` y `/me/settings`.
- [x] 4.2 Quitar los **seis booleanos** de `routes/index.tsx` y dejar `/` consciente del rol: panel
      del padre o inicio del niño. El saldo sigue donde está hoy.
- [x] 4.3 Quitar `onDone` de `MyTasks`, `MyRewards`, `MyRedemptions` y `ChildSettings`, que pasan a
      navegar con el router. **Su marcado y su lógica no se tocan.**
- [x] 4.4 Test del recorrido del niño: entrar a un destino, volver atrás y comprobar que **no sale de
      la aplicación**. Es el defecto que este change existe para arreglar.

## 5. Los destinos del padre

- [x] 5.1 Rutas `/tasks/new`, `/rewards/new`, `/children/new` y `/children/:childId/edit`. Con esto
      desaparecen las tres uniones `Vista`/`View`.
- [x] 5.2 Que el formulario de edición de un hijo obtenga la entidad por su identificador, no por una
      propiedad. Un identificador ajeno o inexistente lleva de vuelta al listado.
- [x] 5.3 Ruta `/account` para el avatar del padre, su PIN y cerrar sesión, hoy detrás de dos
      booleanos.
- [x] 5.4 Quitar `onDone` de los componentes de `features/` que quedan.
- [x] 5.5 Tests de rol equivocado: un niño en un destino del padre acaba en `/` **sin mensaje de
      error**, y un padre en un destino del niño, también.

## 6. Filtros y paginación en la dirección

- [x] 6.1 Declarar los parámetros de búsqueda tipados de `/tasks`, `/rewards`, `/children` y
      `/redemptions`, con sus valores por defecto.
- [x] 6.2 Que un valor inválido **caiga al valor por defecto** en vez de romper la pantalla. Es lo
      contrario del criterio de la API, y a propósito: aquí quien «llama» es una persona que pegó una
      dirección.
- [x] 6.3 Sustituir los `useState` de `page` y `filtro` por los parámetros de la ruta. `confirming`,
      `editingTitle` y `editingOffers` **se quedan** donde están: son estado de un momento, no
      destinos.
- [x] 6.4 Test: un filtro sobrevive a abrir el formulario y volver atrás, y una dirección con filtro
      abre el listado ya filtrado.

## 7. Retirada y reglas

- [x] 7.1 Comprobar que ninguna ruta usa ya `AuthGate`, `ParentOnly` ni `ChildOnly`, y **entonces**
      borrarlos. Antes no.
- [x] 7.2 Test que recorre `src/features/` y falla si aparece un prop `onDone`.
- [x] 7.3 Test que falla si aparece una unión de vistas decidiendo qué pantalla pintar.
- [x] 7.4 Comprobar que los dos tests fallan de verdad inyectando una violación, y no pasan por
      vacíos.

## 8. Cierre

- [x] 8.1 Verificación completa. `pnpm verify` no cabe en esta máquina: usar
      `pnpm turbo run lint typecheck test build --force --concurrency=1`, y **comprobar antes que
      Docker está arriba** (`monedin-postgres` y `monedin-minio` healthy) o la batería de la API falla
      con `ECONNREFUSED :5432` sin tener que ver con el código.
- [x] 8.2 Repaso manual con la semilla: recorrer los cuatro destinos del niño pulsando atrás en cada
      uno, recargar en `/me/rewards`, filtrar tareas como padre y volver, teclear `/rewards` con
      perfil de niño, y teclear una dirección inventada.
- [x] 8.3 Comprobar en móvil o emulador que la barra inferior no tapa contenido.
- [x] 8.4 Comprobar que **ninguna pantalla cambió de aspecto**. Si alguna lo hizo, se ha colado
      alcance: este change no viste nada.
- [x] 8.5 Actualizar `README.md`, la sección de front de `openspec/config.yaml` y `CLAUDE.md` con la
      capa `app/` y la regla nueva.
- [x] 8.6 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.

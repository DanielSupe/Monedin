## 1. Contratos compartidos

- [x] 1.1 Añadir `MAX_CHILDREN_PER_FAMILY = 10` en `packages/contracts/src/constants/domain.ts`, con
      un comentario de por qué es generoso: acota abuso, no opina sobre el tamaño de una familia.
- [x] 1.2 Crear `packages/contracts/src/schemas/avatar.ts` con `avatarKeySchema = z.enum(AVATAR_KEYS)`,
      la deuda que `add-profile-selection` dejó abierta. Archivo propio porque la imagen del padre y
      la de un premio lo usarán después.
- [x] 1.3 Crear `packages/contracts/src/schemas/pagination.ts` con `paginationQuerySchema`
      (`page`/`pageSize` con `z.coerce` y `.default()`), el helper `pageOf<T>()` y la interfaz
      `Page<T>`. Un `pageSize` por encima del máximo falla; no se recorta.
- [x] 1.4 Crear `packages/contracts/src/schemas/children.ts`: `createChildSchema`, `updateChildSchema`
      (todos opcionales pero al menos uno), `updateOwnChildSchema` (solo `avatar`),
      `childParamsSchema`, `listChildrenQuerySchema`, `childSchema`, `ownChildSchema` y
      `childrenPageSchema`, con sus tipos. Todos los de entrada `.strict()`.
- [x] 1.5 Comentar en `createChildSchema` que **no acepta `coins` a propósito**: el día que alguien lo
      añada, el alta sin PIN se convierte en una impresora de monedas.
- [x] 1.6 Alinear `childActorSchema` en `schemas/auth.ts` para que `avatar` deje de ser nullable, como
      ya lo es en `selectableProfileSchema`, y exportar los tres archivos nuevos desde `src/index.ts`.
- [x] 1.7 Tests en `packages/contracts/tests/contracts.test.ts`: la paginación aplica defaults,
      coacciona cadenas y rechaza `pageSize` excesivo, cero, negativo y decimal; `avatarKeySchema`
      acepta todas las claves del catálogo y rechaza una inventada; los schemas de entrada rechazan
      campos desconocidos y la edición vacía.

## 2. Paginación en la API

- [x] 2.1 Crear `apps/api/src/shared/pagination.ts` con `toSkipTake()` y `toPage()`, para que la
      aritmética ocurra en un solo sitio y ningún repositorio haga cuentas con entrada de usuario.
      `totalPages` nunca es cero.
- [x] 2.2 Test unitario de `toPage()`: los bordes (lista vacía, última página incompleta, página más
      allá del final) y que `totalPages` es 1 con cero resultados.

## 3. Andamio de tests

- [x] 3.1 Añadir `asChild(app, opts)` a `apps/api/tests/support/auth.ts`, que componga
      `createChildProfile` + `enterProfile` y devuelva las cookies de perfil de niño. Hoy cada test lo
      hace a mano y casi todos los nuevos lo necesitan.
- [x] 3.2 Añadir un helper que cree una familia con varios hijos, para los tests de listado,
      paginación y aislamiento entre hermanos.

## 4. Módulo `children`: datos y reglas

- [x] 4.1 Crear `apps/api/src/modules/children/children.errors.ts` con `ChildNotFoundError`,
      `ParentRoleRequiredError`, `ChildRoleRequiredError` y `MaxChildrenReachedError`, y añadir la
      sección `children` al catálogo de mensajes de la API. El mensaje del tope interpola la constante.
- [x] 4.2 Crear `children.repository.ts` con las lecturas y escrituras del módulo, todas envueltas en
      `withTranslatedErrors()` y con `select` explícito que **nunca** incluya `pinHash`.
- [x] 4.3 Implementar `findChildrenPage()` contando y leyendo **en la misma transacción** y con
      `orderBy: [{ createdAt: "asc" }, { id: "asc" }]`. El desempate por `id` no es opcional: sin él
      dos filas del mismo milisegundo pueden salir en dos páginas o en ninguna.
- [x] 4.4 Implementar la baja como `updateMany` condicional sobre `deletedAt: null`, para que dos
      bajas simultáneas no se pisen la fecha.
- [x] 4.5 Crear `children.service.ts` con `createChild(accountUserId, actingAs, input)` —la desviación
      documentada en la decisión 2 del design— incluyendo el rechazo del actor de niño y la
      comprobación del tope sobre hijos **activos**.
- [x] 4.6 Implementar `listChildren`, `getChild`, `updateChild` y `deactivateChild` con el patrón de
      autorización de `auth.service.ts`: rol primero, pertenencia después, y **404 y no 403** para un
      hijo ajeno o dado de baja.
- [x] 4.7 Implementar `getOwnChild` y `updateOwnAvatar` tomando el perfil **de `actor.childProfileId`**,
      nunca de la petición: es lo que hace cierto por construcción que un niño no vea a sus hermanos.
- [x] 4.8 Hacer que la baja revoque las sesiones del perfil reutilizando
      `authRepository.revokeSessionsOfChildProfile()`, sin que `children` toque la tabla de sesiones.

## 5. Módulo `children`: HTTP

- [x] 5.1 Crear `children.controller.ts`: lee con `accountOf`/`actorOf` y `validatedPart`, serializa,
      201 en el alta y 204 en la baja. Cero autorización.
- [x] 5.2 Crear `children.routes.ts` con las siete rutas, usando `validate({ params })` en vez de leer
      los parámetros a mano, y **`/children/me` registrada antes que `/children/:childId`**, con el
      comentario que explica el fallo silencioso que evita.
- [x] 5.3 Registrar `childrenRouter` en `apps/api/src/app.ts`.

## 6. Tests del módulo `children`

- [x] 6.1 Alta: camino feliz desde la rejilla sin PIN de adulto, el hijo aparece en `/auth/profiles`,
      nace con cero monedas, y su PIN sirve para entrar acto seguido.
- [x] 6.2 Alta, autorización: un niño con perfil activo recibe 403 y no queda fila; sin sesión de
      cuenta es 401; `parentId` o `coins` en el cuerpo son 422.
- [x] 6.3 Alta, tope: alcanzarlo da 409, dar de baja libera hueco, los dados de baja no cuentan, y el
      tope de una familia no afecta a otra.
- [x] 6.4 Listado: campos devueltos, defaults de paginación, `total` sin paginar, y que no aparezcan
      hijos de otra familia ni dados de baja.
- [x] 6.5 Paginación: `pageSize` excesivo da 422 con el campo prefijado `query.`; página cero,
      negativa, no numérica y decimal dan 422; una página más allá del final da lista vacía y no 404.
- [x] 6.6 Paginación, orden estable: varios hijos con el mismo `createdAt` forzado, recorrer todas las
      páginas y comprobar que el conjunto reunido es exacto, sin repetidos ni ausentes.
- [x] 6.7 Detalle y edición: camino feliz, editar un campo no borra los otros, y 422 con nombre, edad,
      avatar y campos desconocidos **reportados todos a la vez**.
- [x] 6.8 Autorización cruzada: un padre sobre un hijo ajeno recibe **404 con cuerpo idéntico** al de
      un identificador inventado, en detalle, edición y baja.
- [x] 6.9 Baja: saca al hijo de ambos listados, conserva su historial de monedas, y revoca la sesión
      de ese perfil.
- [x] 6.10 Baja concurrente: dos peticiones simultáneas dan un 204 y un 404, y la fecha de baja no se
      pisa.
- [x] 6.11 Vista del niño: ve lo suyo con su saldo, cambia su avatar, no puede cambiar nombre ni edad
      (422), y pedir el perfil de un hermano da 403 indistinguible de un id inexistente.
- [x] 6.12 Roles cruzados: un niño listando hijos da 403; un padre sobre `/children/me` da 403; y
      `/children/me` **no cae en `:childId`**, es decir el niño recibe 200.
- [x] 6.13 Fugas: el cuerpo serializado de cada respuesta no contiene `pinHash`, `parentId`,
      `deletedAt` ni los contadores de intentos.
- [x] 6.14 Alta concurrente en el último hueco: aseverar que no se supera el tope más uno, con la
      carrera aceptada comentada en el test (decisión 7 del design).

## 7. `auth`: el niño cambia su propio PIN

- [x] 7.1 Añadir `changeOwnChildPinSchema` a los contratos de `auth` y la ruta
      `POST /auth/child-profiles/me/pin` con `requireChild`.
- [x] 7.2 Implementar `changeOwnChildPin` en `auth.service.ts` reutilizando el mismo bloqueo por
      intentos que `enterChildProfile`, sobre el perfil de la sesión y nunca sobre uno de la petición.
- [x] 7.3 Tests: cambia con el actual correcto y su sesión sigue viva; con el actual equivocado se
      rechaza; insistir bloquea el perfil; el PIN de los hermanos no cambia; y un padre por esta vía
      recibe 403.

## 8. La lista de rutas de solo cuenta deja de ser un documento

- [x] 8.1 Crear `apps/api/tests/http/account-only-routes.test.ts` que enumere las rutas de solo cuenta
      y falle si aparece una sexta sin declararla. Convierte en herramienta la frase de `CLAUDE.md` §5,
      que hoy dice tres cuando ya son cuatro.

## 9. Front: cliente y datos

- [x] 9.1 Crear `apps/web/src/api/children.ts` con las llamadas vía `apiFetch(path, schema)` y sus
      claves de consulta propias, siguiendo el patrón de `api/auth.ts`.
- [x] 9.2 Añadir `changeOwnChildPin` a `api/auth.ts` y su hook en `features/auth/use-session.ts`.
- [x] 9.3 Crear `features/children/use-children.ts` con los hooks y las invalidaciones: toda mutación
      invalida hijos **y** perfiles; el avatar propio invalida además la sesión.
- [x] 9.4 Escribir `describeChildrenError`, que traduce el 409 como tope alcanzado y **no** como
      correo registrado, con el test que impide reutilizar `describeAuthError`.
- [x] 9.5 Añadir el bloque `children` a `lib/messages.ts` y retirar `createProfileSoon`.

## 10. Front: pantallas

- [x] 10.1 Crear `features/children/AvatarPicker.tsx` reutilizando `AVATAR_OPTIONS`, que ya existe
      para esto.
- [x] 10.2 Crear `features/children/ChildForm.tsx` para alta y edición, validando en cliente con el
      mismo schema del contrato antes de enviar, como hace `ChangePinScreen`.
- [x] 10.3 Crear `features/children/CreateProfileScreen.tsx` y cablearla en `ProfileGrid.tsx` en lugar
      del marcador de posición actual. Es el alta sin actor.
- [x] 10.4 Dar a `ParentOnly` un `fallback` opcional: hoy devuelve `null` y `/children` visitada por un
      niño se quedaría en blanco.
- [x] 10.5 Crear `features/children/ChildrenList.tsx` y la ruta `routes/children.tsx`, con enlace desde
      la home del padre. La baja pide confirmación, porque es definitiva.
- [x] 10.6 Añadir a la lista las acciones de reponer PIN y desbloquear, **llamando a los endpoints de
      `auth` que ya existen**: no se crea API nueva para eso.
- [x] 10.7 Crear `features/children/ChildSettings.tsx` para el niño —su avatar y su PIN— y darle
      entrada desde la home.
- [x] 10.8 Tests en `apps/web/tests/children-client.test.ts`: las rutas salen del contrato, el query
      string de paginación es el esperado, el alta no envía `parentId`, y una página sin `items` falla
      como forma inesperada en vez de pasar en silencio.

## 11. Documentación y cierre

- [x] 11.1 Actualizar `CLAUDE.md` §5: son **cinco** rutas de solo cuenta, no tres —hoy ya se olvidaba
      `/auth/profiles/leave`—, y añadir que solo cuenta no significa sin autorización.
- [x] 11.2 Documentar en `CLAUDE.md` §7 el patrón de paginación que estrena este change, con
      `GET /auth/profiles` como excepción declarada.
- [x] 11.3 Añadir a `CLAUDE.md` §6 la distinción entre invariante de integridad (va al motor) y límite
      de política que cuenta filas (va al servicio), o el tope parece un olvido.
- [x] 11.4 Actualizar la superficie de `/children` en `openspec/config.yaml` y añadir a las decisiones
      cerradas que `MANUAL_ADJUSTMENT` existe en el enum pero ningún endpoint lo produce.
- [x] 11.5 Pasar `pnpm db:generate`, `lint`, `typecheck` y `test` en verde, y recorrer a mano el
      camino completo con `pnpm dev`: registrar, crear un hijo desde la rejilla sin PIN, verlo listado
      con su saldo, editarlo, dar de baja a otro, y entrar a su perfil a cambiar avatar y PIN.
- [x] 11.6 Sincronizar las specs y archivar el change.

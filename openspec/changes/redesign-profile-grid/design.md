## Context

Ver `proposal.md` — Why.

Lo que condiciona el cómo, y sale del código:

- **Al acertar el PIN, hoy no navega nadie.** `useEnterProfile` invalida la sesión y el router, la
  guarda se reevalúa, y `requireProfileChoice` manda a `/`. El componente que llamó a `mutate` ya no
  existe para entonces: al cambiar la sesión, la raíz cambia de marco y lo desmonta. Está en
  `CLAUDE.md` y se aprendió pagándolo en `add-app-shell`.
- **Dos tests impiden que la navegación vuelva a cablearse a mano**: uno falla ante un prop `onDone`
  y otro ante una unión de vistas en `useState`.
- **`Avatar` es `rounded-full` fijo** y lo usan cuatro pantallas más.
- **Las rutas de perfiles son de SOLO CUENTA**: la cookie certifica la familia y todavía no hay
  actor. Entrar es lo que lo crea.
- **`/account` y `/me/settings` ya existen** y son exactamente las pantallas de edición de cada rol.
- **La convención de los parámetros de búsqueda del front**: un valor inválido **cae al de por
  defecto**, al revés que el 422 de la API, porque aquí quien «llama» es una persona con un enlace
  viejo.

## Goals / Non-Goals

**Goals:**

- Que la primera pantalla del producto parezca un producto.
- Que editar un perfil se pueda pedir **desde fuera**, sin haber entrado y sin saberse la aplicación.
- Que la llave para editar un perfil siga siendo la de ese perfil.
- Que un error de dedo en el PIN no cueste un intento.

**Non-Goals:**

- Vestir el resto de `features/auth/`.
- Traer una paleta oscura.
- Tocar la API.

## Decisions

### 1. El modo de administración vive en la DIRECCIÓN

**Elegido**: un parámetro de búsqueda, `?manage=true`, en `/profiles` y en
`/profiles/$profileId/pin`.

```
   Con useState                          Con la dirección
   ────────────                          ────────────────
   const [manage, setManage] = …         /profiles?manage=true
   atrás sale de la APLICACIÓN           atrás sale del MODO
   recargar lo pierde                    recargar lo conserva
   muere al navegar al PIN               sobrevive al PIN
   lo caza no-state-router.test          es la convención de la casa
```

La tercera línea es la que decide, y no es una preferencia: **el modo tiene que sobrevivir a la
navegación al teclado de PIN**, porque es allí donde hace falta saber a dónde ir después. Un estado
local no cruza esa frontera.

Esquema nuevo en `app/search.ts`, junto a `pageSearch`. `?manage=platano` deja el modo apagado en vez
de romper la pantalla.

**CORRECCIÓN, escrita al implementar.** Este documento decía `.catch(false)`, y así se escribió
primero. Dos cosas salieron mal y las dos se vieron al abrir la aplicación, no al leer el código:

1. **`z.coerce.boolean()` convierte en `true` cualquier cadena no vacía**, incluida `"false"`. Con
   `.coerce`, `?manage=false` habría encendido el modo. Se sustituye por una comprobación explícita:
   solo encienden el booleano y la palabra exacta.
2. **Apagado sale como `undefined`, no como `false`.** Con `false` el router lo escribía en la barra
   y la rejilla normal quedaba en `/profiles?manage=false`. Un parámetro que solo dice «lo de
   siempre» es ruido en la dirección y hace más fea la que se comparte. Ahora el modo normal es
   `/profiles` a secas.

Partir de `z.unknown()` tiene además un efecto que no se buscaba y conviene: deja el parámetro
**opcional en los tipos**, así que los cinco enlaces a `/profiles` que no saben nada del modo siguen
siendo `<Link to="/profiles">` a secas.

### 2. Quien decide el destino tras el PIN es la GUARDA, no el componente

Esta es la decisión de arquitectura del change, y es forzada:

```
/profiles/p31ek…/pin?manage=true
   │
   │  PIN correcto → useEnterProfile → invalida sesión y router
   ▼
requireProfileChoice se reevalúa sobre la MISMA dirección
   │
   ├── screenFor === "app" y NO hay manage  →  redirect /        ← lo de hoy
   └── screenFor === "app" y SÍ hay manage  →  redirect al destino del rol
                                                 PARENT → /account
                                                 CHILD  → /me/settings
```

**Descartado — navegar desde el `onSuccess` de la mutación**: no funciona, y no es una teoría. Al
cambiar la sesión, la raíz cambia de marco y desmonta el componente que llamó a `mutate`. Ya se
intentó en `add-app-shell` y por eso existe `useRefreshSession()`.

**Descartado — una ruta aparte `/profiles/$profileId/manage`**: duplicaría el teclado de PIN entero
o le añadiría un envoltorio, cuando lo único que cambia entre los dos casos es a dónde se sale.

`requireProfileChoice` recibe un segundo argumento opcional con la intención. La guarda ya tiene la
sesión en la mano, así que **conoce el rol del actor recién creado** sin una petición más: el destino
sale de ahí y no de lo que el cliente pida, que es lo correcto — nadie debería poder pedir aterrizar
en la pantalla de otro rol.

### 2 bis. La rejilla tenía la guarda equivocada, y este change lo destapó

**Encontrado tocando la aplicación, no leyendo el código ni pasando los tests.**

`/profiles` se guardaba con `requireAccount`, que admite un perfil **ya activo**; el teclado se
guarda con `requireProfileChoice`, que no. Las dos rutas de perfiles no decían lo mismo, y el hueco
se veía así:

```
   con el perfil de MATEO activo
   ─────────────────────────────
   abrir /profiles?manage=true   →  la rejilla se pinta (requireAccount la deja)
   tocar el lápiz sobre LUCÍA    →  /profiles/parent/pin?manage=true
                                    requireProfileChoice ve «app» y redirige
                                 →  /me/settings  ← los ajustes de MATEO
```

Sin este change el rebote iba a `/`, y se leía como «no ha pasado nada». Con el modo administrar
aterriza en una pantalla de edición, así que **parece que funcionó** — editando el perfil
equivocado, sin haber tecleado el PIN de nadie.

`/profiles` pasa a `requireProfileChoice`. No es una regla nueva: el comentario de esa misma ruta ya
decía que la rejilla es para «cuenta acreditada y **sin** actor todavía», y la guarda no lo
cumplía. Volver a la rejilla se hace **saliendo del perfil**, que es lo que hace «Cambiar de perfil»
en los dos marcos; ningún marco enlaza a `/profiles` de otra forma, así que no se cierra ningún
camino.

Queda cubierto por un escenario de la spec y por un test, para que no vuelva.

### 3. El lápiz no es un control aparte

**Elegido**: la tesela sigue siendo **un solo elemento interactivo**. El lápiz es un adorno dentro
del enlace, y lo que cambia es el nombre accesible: «Editar Mateo» en vez de «Mateo».

**Por qué**: un lápiz como botón encima de un enlace son dos objetivos de toque solapados en el sitio
donde el dedo de un niño ya falla, y quien navega con teclado tendría que pasar por dos paradas para
una sola cosa. Además, el destino es el mismo en los dos casos —el teclado de PIN—; lo único distinto
es a dónde se sale después.

Es la misma clase de error que ya cometimos anidando un `<Button>` dentro de un `<Link>` en la
landing, y por eso existe `buttonClasses()`.

### 4. Un perfil bloqueado no lleva lápiz

Sin PIN no se entra, y sin entrar no se edita. Ofrecer editarlo sería ofrecer algo que el sistema va
a rechazar. Se queda como está hoy: atenuado, con su etiqueta, y sin ser un enlace — porque un enlace
deshabilitado no existe en HTML y un botón muerto confunde menos.

### 5. La tecla de borrar, que es un arreglo de producto colado en un change de aspecto

Se cuela **a conciencia y se declara**: el teclado se está reescribiendo entero, el arreglo son cinco
líneas, y el defecto castiga con un bloqueo a quien menos lo entiende.

Lo que NO hace: no toca la mutación, ni el conteo de intentos, ni el bloqueo. Solo permite quitar un
dígito antes de llegar a cuatro, que es antes de que exista ningún intento.

### 6. La deuda declarada se ESTRECHA en vez de borrarse

La convención dice que cada change de rediseño borra su entrada de las dos listas. Aquí no se puede:
este change viste **dos** de los seis archivos de `features/auth/`, y los otros cuatro son de
`redesign-access`.

```
   antes                          después
   ─────                          ───────
   src/features/auth/**           src/features/auth/SignInScreen.tsx
                                  src/features/auth/ResetPinScreen.tsx
                                  src/features/auth/ChangePinScreen.tsx
                                  src/features/auth/ParentAvatarScreen.tsx
```

La lista sigue **solo encogiendo**, que es lo que la regla protege, y ahora dice la verdad sobre lo
que falta en vez de tapar dos archivos ya vestidos bajo un glob. `redesign-access` la vaciará.

Hay que ajustar el `expect(SIN_VESTIR).toHaveLength(7)`. Ese test existe precisamente para obligar a
venir aquí a explicarse, y esto es la explicación.

## Risks / Trade-offs

- **El modo en la dirección se puede teclear a mano** → No pasa nada: `?manage=true` sin sesión de
  cuenta choca contra la guarda igual que la rejilla, y con actor ya creado redirige. El destino lo
  decide el rol, no el parámetro.
- **Aterrizar en `/account` o `/me/settings` es una redirección más en el camino** → Es una
  redirección de cliente sin petición adicional: la guarda ya tiene la sesión.
- **Cuatro teselas en 390 px** → Es el caso a mirar, con la tipografía nueva encima. Si no caben,
  envuelven; lo que no puede pasar es que se salgan de lado.
- **La tecla de borrar es alcance colado** → Declarado arriba, con su motivo y sus límites.

## Migration Plan

1. El parámetro de búsqueda y la guarda, con sus tests. Es el corazón y no se ve.
2. La rejilla vestida, con el modo y la tesela de «Agregar perfil».
3. El teclado de PIN vestido, con el borrado.
4. Estrechar las dos listas de deuda.

**Vuelta atrás**: sin el parámetro, la guarda se comporta exactamente como hoy.

## Open Questions

Ninguna. Las cuatro bifurcaciones —qué PIN, fondo, forma de las teselas y alcance— se cerraron antes
de escribir esto.

## Decisiones que este change NO toma

- **Si la rejilla debería tener paleta propia.** Se decidió que no ahora; una capa de tokens oscuros
  es un change en sí misma.
- **Si `Avatar` necesita una talla más.** Se resuelve mirándolo: si a `large` la tesela queda
  pequeña, la talla se añade a la pieza y no se escribe una medida arbitraria en la rejilla.
- **Dar de baja desde la rejilla.** Ver el «No incluye» de la proposal.

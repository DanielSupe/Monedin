## Context

Ver `proposal.md` — Why.

Lo que hace falta saber del código actual, y que no está en la proposal:

- **El router ya existe y funciona.** Enrutado por archivos con el plugin de Vite, `routeTree.gen.ts`
  generado y fuera del lint, y cinco rutas reales. No hay que instalar nada ni cambiar de estrategia.
- **`screenFor(session)`** en `features/auth/use-session.ts` ya devuelve los tres estados correctos:
  `signIn`, `profiles`, `app`. Es lógica buena y no se toca.
- **La sesión llega por una consulta de TanStack Query**, no por un valor síncrono. Cualquier guarda
  que quiera decidir *antes* de pintar necesita poder esperar esa consulta.
- **Los tres `Vista`/`View` union del padre no son iguales**: `RewardCatalog` y `TaskBatchList` son
  `list | new`; `ChildrenList` es `list | new | edit` y el `edit` **lleva la entidad dentro**, no su
  identificador.
- **`page` y `filtro` ya se pierden hoy** al abrir un formulario, porque la lista se desmonta. Lo que
  este change hace no es conservarlos: es que empiecen a conservarse.
- **`add-design-system` dejó `data-scale` sin enchufar.** El contenedor por rol nunca existió.

## Goals / Non-Goals

**Goals:**

- Que el botón atrás y la recarga se comporten como en cualquier aplicación, en las dos audiencias.
- Que exista una capa donde colgar navegación y escala, y que sobreviva a la navegación.
- Que el estado-como-router no pueda volver, y que eso lo impida una herramienta.
- Que la lógica de sesión que ya es correcta **se conserve**, no se reescriba.

**Non-Goals:**

- Cambiar el aspecto de ninguna pantalla.
- Cambiar cómo cada pantalla obtiene sus datos.
- Decidir dónde vive el saldo del niño: es de `redesign-child-home`.

## Decisions

### 1. Guardas en `beforeLoad`, con el cliente de consultas en el contexto del router

**Elegido**: el router recibe `queryClient` en su contexto, y cada rama del árbol declara un
`beforeLoad` que resuelve la sesión con `ensureQueryData` y lanza `redirect()` si no corresponde.

```
   HOY                                  DESPUÉS
   ───                                  ───────
   ruta → AuthGate → ¿qué pinto?        ruta → beforeLoad → ¿dónde va?
                                                    │
   niño en /rewards                          niño en /rewards
     ve un mensaje                             acaba en /
     EN /rewards                               la dirección se corrige
```

**Por qué**: un componente solo puede elegir qué pintar; una guarda de ruta puede cambiar la
dirección. La diferencia se nota en el caso que importa —alguien parado en una dirección que no es
suya— y es lo que la spec exige.

**Por qué el `queryClient` en el contexto y no una lectura del almacén**: la sesión llega por una
consulta, y `beforeLoad` corre antes de que exista ningún componente que pueda usar el hook.
`ensureQueryData` es la forma idiomática de esperarla, y además reutiliza la caché en lugar de
disparar una petición por navegación.

**Descartado — dejar `AuthGate` y añadir redirecciones dentro**: un efecto que navega tras pintar
produce un parpadeo de la pantalla equivocada, y deja la dirección mal durante un instante.

**Descartado — guardar la sesión en un contexto de React aparte**: sería una segunda fuente de verdad
de algo que ya tiene una.

### 1b. El ayudante de guarda y los destinos que nombra son una sola unidad

**Descubierto al implementar.** El plan de migración ponía el ayudante de guarda en el paso 1 y las
rutas en el 2, como si fueran cosas separadas. No lo son: las direcciones del router están **tipadas**,
y `redirect({ to: "/sign-in" })` no compila mientras esa ruta no exista.

```
   error TS2322: Type '"/sign-in"' is not assignable to type
     '"." | ".." | "/" | "/children" | "/redemptions" | "/rewards" | "/tasks"'
```

No es un estorbo, es la herramienta haciendo su trabajo: una redirección a un destino inventado sería
un 404 en producción y aquí no llega a compilar. Los dos pasos se hacen juntos, y el árbol de rutas
hay que **regenerarlo** —lo produce el plugin de Vite al ejecutarse— antes de que el typecheck vea las
rutas nuevas.

**Consecuencia asumida**: al escribir el test de «sin sesión, cualquier destino acaba en el acceso»
hizo falta que `/tasks` ya tuviera guarda, que era trabajo del paso 5. Se adelantaron las cuatro
líneas de `beforeLoad` de las rutas del padre que ya existían, en lugar de escribir un test que
fallara a propósito. Esas rutas ya eran de solo padre por `ParentOnly`, así que el adelanto no cambia
quién puede entrar: cambia que ahora se le redirige en vez de enseñarle un mensaje.

### 2. `app/` es una capa nueva, entre `ui/` y `features/`

```
   ui/          piezas         no sabe de dominio, ni de rutas, ni de sesión
                                 ↑ test que lo comprueba desde add-design-system
   app/         marcos         sabe de ROL y de DESTINOS. No sabe de negocio.
   features/    pantallas      sabe de negocio. Ya no sabe de navegación.
   routes/      montaje        junta las tres
```

**Elegido**: los dos marcos viven en `apps/web/src/app/`.

**Por qué no en `ui/`**: un marco necesita saber el rol del actor y qué destinos existen. Ponerlo en
`ui/` rompería la frontera que `add-design-system` dejó comprobada por un test, y el catálogo vivo
—que no monta proveedores— dejaría de poder montarlo.

**Por qué no en `features/`**: no es una pantalla de un módulo de negocio; es lo que las rodea a
todas.

**Consecuencia buena**: al nacer en `app/`, los marcos quedan **fuera** de la lista de deuda de
estilos en línea y bajo la regla general desde el primer día.

### 3. El rol equivocado redirige en silencio, y no explica nada

**Elegido**: un niño en una dirección del padre acaba en `/`; un padre en una del niño, también. Sin
mensaje.

**Por qué**: `/` es consciente del rol, así que cada uno aterriza donde le toca. Y el destinatario
importa: **un niño de siete años que lee «no tienes permiso» cree que hizo algo mal**, cuando lo más
probable es que haya tocado un enlace viejo o que un hermano dejara la dirección abierta.

**Descartado — el mensaje que hay hoy** (`ParentOnly fallback`): coherente, pero acusa a quien no
tiene culpa y deja la dirección equivocada en la barra.

**Descartado — 404**: sería lo más parecido a lo que hace la API con un recurso ajeno —404 y no 403,
para no confirmar que existe—, pero aquí no hay nada que ocultar: los dos roles saben perfectamente
que el otro tiene sus pantallas. Sería confusión sin beneficio.

**Nota de alcance**: esto es interfaz, no seguridad. La guarda de verdad sigue en el servidor, que
responde 401 o 403 pase lo que pase. Ninguna redirección de este change protege ningún dato.

### 4. Los filtros son parámetros tipados, y un valor inválido no rompe nada

**Elegido**: `page` y `filtro` se declaran como parámetros de búsqueda validados en la ruta. Un valor
que no cuadra **cae al valor por defecto** en lugar de fallar.

**Por qué caer al valor por defecto y no rechazar**: aquí no hay nada que proteger —el servidor
valida su propia entrada y responde 422 si hace falta— y una dirección escrita a mano o un enlace
viejo no deberían dejar una pantalla en blanco. Es lo contrario del criterio de la API, y a propósito:
allí, un `pageSize` fuera de rango es 422 porque esconder el error engaña a quien llama; aquí, quien
«llama» es una persona que pegó una URL.

**Qué NO sube a la dirección**: `confirming`, `editingTitle` y `editingOffers`. Son estado de un
momento, no destinos. Que el botón atrás cerrara un diálogo de confirmación sería una sorpresa, no
una mejora.

### 5. `ChildrenList` guarda la entidad en su vista; la ruta guarda el identificador

Su unión actual es `{ name: "edit"; child: Child }`, con el objeto entero dentro. Una dirección solo
puede llevar el identificador.

**Elegido**: `/children/:childId/edit` obtiene el hijo de la consulta que ya existe.

**Consecuencia asumida**: abrir esa dirección en frío hace una petición que antes no ocurría, porque
el objeto venía ya cargado de la lista. Es el precio de que la dirección se pueda compartir y
recargar, y la caché de la consulta lo absorbe cuando se llega desde la lista.

### 6. `screenFor()` se conserva; `AuthGate` se retira

`screenFor()` ya distingue los tres estados —sin cuenta, con cuenta y sin perfil, con perfil— y esa
distinción es el corazón de las guardas. Se queda **tal cual**.

Lo que se retira son `AuthGate`, `ParentOnly` y `ChildOnly`, y solo cuando ninguna ruta los use.
Borrarlos antes dejaría pantallas sin guarda entre medias.

### 7. La regla que impide que el estado-como-router vuelva

Dos comprobaciones, en la línea de lo que el proyecto ya hace cuando el lint no llega:

- Un test recorre `src/features/` y falla si aparece un prop `onDone`.
- El mismo test falla si aparece una unión de vistas con la forma `{ name: "..." }` decidiendo qué
  pintar.

**Por qué un test y no lint**: ambas son formas, no símbolos, y un selector de ESLint que las
distinga de un uso legítimo sería más frágil que un test que se lee. Es el mismo criterio que el test
de colores literales de `add-design-system` y el de rutas de solo cuenta de la API.

### 8. Una guarda no se reevalúa sola, y por eso la sesión invalida el router

**Descubierto en el repaso manual, y es la corrección más importante del change.**

El primer intento navegaba desde cada mutación: `login.mutate(..., { onSuccess: aLaRejilla })`,
`enter.mutate(..., { onSuccess: alInicio })`, y así con cuatro. **No funciona**, y falla de una forma
que un test de unidad no ve: al cambiar la sesión, la raíz cambia de marco y **desmonta** el
componente que llamó a `mutate`, así que su `onSuccess` no llega a ejecutarse. El PIN se aceptaba, la
cabecera del padre aparecía, y la dirección seguía siendo `/profiles/:id/pin`.

La causa de fondo es lo mismo que hace buenas a las guardas: `beforeLoad` decide **antes** de pintar,
lo que evita el parpadeo de la pantalla equivocada, pero por eso mismo corre al **entrar** en una
ruta. Cuando la sesión cambia sin que cambie la dirección, no vuelve a correr.

**Elegido**: `useRefreshSession()` —que ya invalidaba la sesión y la rejilla— invalida además el
router. Las guardas se reevalúan y cada una manda a quien sea donde le toca.

```
   ANTES, en cada mutación            DESPUÉS, en un solo sitio
   ───────────────────────            ─────────────────────────
   login    -> navigate("/profiles")  invalidateQueries(session)
   enter    -> navigate("/")          router.invalidate()
   leave    -> navigate("/profiles")        │
   logout   -> navigate("/sign-in")         └─> las guardas deciden
                                                 (y ya sabían hacerlo)
   4 sitios, y 3 no se ejecutaban     1 sitio, declarativo
```

**Por qué es mejor y no solo más corto**: la respuesta a «¿dónde pertenece este estado de sesión?» ya
estaba escrita en las guardas. Repetirla en cuatro `onSuccess` era una segunda fuente de verdad que
además podía desincronizarse. Y la versión declarativa no depende del orden de desmontaje, que es
justo lo que rompió la primera.

**Lo que esto enseña del método**: los tests de guarda pasaban con la versión rota, porque montaban
en una dirección y comprobaban a dónde iban. Ninguno cambiaba la sesión **estando dentro**. Lo cazó
abrir la aplicación y teclear un PIN.

## Risks / Trade-offs

- **`beforeLoad` puede añadir un parpadeo si la sesión no está en caché** → `ensureQueryData` la
  reutiliza; solo la primera navegación de la sesión espera de verdad, y para eso está el estado de
  carga del marco.
- **Quitar `onDone` de quince componentes toca mucho archivo a la vez** → Se hace por módulo y con la
  verificación en verde entre uno y otro, no todos de golpe. Su marcado no se toca, así que el diff
  es de imports y de un prop.
- **Los tests de navegación necesitan montar el router**, que es más pesado que montar una pieza →
  Se monta un router de memoria en el test. La infraestructura de `jsdom` ya existe desde
  `add-design-system`.
- **`routeTree.gen.ts` se regenera y crece mucho** → Ya está fuera del lint. Conviene no revisarlo a
  mano y confiar en que el plugin lo produce.

## Migration Plan

El orden importa por una razón: **la aplicación tiene que seguir usable en cada paso**.

1. Contexto del router y ruta 404. Nada cambia todavía para nadie.
2. Las rutas previas a ser alguien —acceso, rejilla, PIN, alta, restablecer— con su guarda. Aquí
   `ProfileGrid` pierde su unión de vistas.
3. Los dos marcos, con el `data-scale` enchufado, envolviendo lo que ya hay.
4. Los cuatro destinos del niño. Es el momento en que el botón atrás empieza a funcionar para él.
5. Los destinos del padre y los tres formularios que salen de una vista interna.
6. Los parámetros de búsqueda de los listados.
7. Retirar `AuthGate`, `ParentOnly` y `ChildOnly`, y los tests que impiden la vuelta atrás.

**Vuelta atrás**: revertir el change deja la navegación como está hoy. No hay estado persistido ni
contrato con el servidor que cambie.

## Open Questions

Ninguna. Las tres que quedaban abiertas al planificar —idioma de las direcciones, comportamiento ante
el rol equivocado y si los filtros suben a la dirección— están decididas arriba.

## Decisiones que este change NO toma

- **Dónde vive el saldo del niño**: `redesign-child-home`.
- **El aspecto de las pantallas**: los nueve changes de rediseño.
- **Si las rutas precargan sus datos**: merece su propio change, porque cambia cómo cada pantalla
  obtiene lo que muestra.

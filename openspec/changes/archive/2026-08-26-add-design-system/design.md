## Context

Ver `proposal.md` — Why. Lo que este documento asume ya sabido: por qué hay que construir el sistema
ahora y por qué no toca ninguna pantalla.

Lo que condiciona el cómo, y que no está en la proposal:

- **El front no tiene nada de CSS que respetar.** No hay hoja de estilos, ni convención de clases, ni
  reset. No hay que convivir con nada: hay que elegir bien de una vez.
- **`vitest` del front corre en `environment: "node"`** e incluye solo `tests/**/*.test.ts`. Los
  siete tests que existen son de cliente de API y no montan nada.
- **La regla del entorno es estricta y está contada.** `import.meta.env` está prohibido en todo el
  repositorio salvo excepciones declaradas con `allowEnvAccess([...])`. Hoy hay una, se prevé una
  segunda, y CLAUDE.md dice que **una tercera es señal de que algo se está haciendo mal**. Cualquier
  diseño que necesite saber en tiempo de ejecución si estamos en desarrollo choca contra esto.
- **`no-restricted-syntax` ya está ocupada.** La usa la regla del entorno con tres selectores, y en
  configuración plana de ESLint la última declaración de una regla **reemplaza** la anterior en vez
  de sumarse. Añadir ahí la prohibición de estilos en línea rompería la del entorno.
- **`turbo.json` solo mira `src/**` y `tests/**`** en los `inputs` de `lint`, `typecheck` y `test`.
  Un archivo de configuración en la raíz de la app queda fuera del hash de caché.
- **El shell por rol todavía no existe.** Llega en `add-app-shell`. Este change tiene que dejar la
  escala lista sin tener dónde enchufarla.

## Goals / Non-Goals

**Goals:**

- Que exista un vocabulario que las once pantallas siguientes **copien**, no que reinterpreten.
- Que saltárselo cueste: que falle el lint o falle un test, no que lo pille una revisión.
- Que la diferencia niño/padre sea **un valor**, no una bifurcación en el código.
- Que el modo oscuro sea después un cambio de un archivo, sin tocar ninguna pieza.
- Que una pieza se pueda probar montándola, sin servidor, sin sesión y sin datos.

**Non-Goals:**

- Elegir la paleta definitiva de marca. Este change instala la **estructura**; los valores concretos
  se afinan cuando existan pantallas donde juzgarlos.
- Cubrir toda pieza imaginable. Se construye lo que las once pantallas ya conocidas necesitan.
- Resolver el enchufe de la escala. Este change la define y la demuestra; conectarla al rol del actor
  es `add-app-shell`.

## Decisions

### 1. Tailwind v4, y la configuración en CSS

**Elegido**: `@import "tailwindcss"` más un único bloque `@theme` en `apps/web/src/styles/tokens.css`,
con el plugin oficial de Vite. Sin `tailwind.config.js`, sin PostCSS a mano, sin plugins de Tailwind.

**Por qué frente a CSS Modules con custom properties**: el requisito de la spec es que exista *un
solo origen* para todo valor visual. En Tailwind v4 el bloque `@theme` **es** ese origen por
construcción: lo que no está declarado ahí no existe como utilidad. Con CSS Modules el origen único
es una convención que hay que vigilar archivo a archivo, porque nada impide escribir `padding: 13px`
dentro de un `.module.css`.

**Por qué frente a vanilla-extract**: tipa los tokens, que es real, pero paga con un ecosistema más
pequeño y un paso de build propio. La seguridad que aporta la cubre aquí un test.

**Por qué la configuración en CSS y no en JS**: además de ser lo idiomático en v4, un
`tailwind.config.js` en la raíz de `apps/web` quedaría **fuera** de los `inputs` de `lint`,
`typecheck` y `test` de `turbo.json`, que solo miran `src/**` y `tests/**`. Editarlo no invalidaría
la caché y la verificación pasaría con resultados rancios. Dentro de `src/styles/` el problema no
existe, sin tocar `turbo.json`.

### 1b. El reinicio de estilos entra ahora, y se paga lo que cuesta

**Descubierto al implementar, no previsto al diseñar.** `@import "tailwindcss"` no trae solo el tema
y las utilidades: trae la capa base inline, que pone `margin: 0; padding: 0; border: 0` en todo,
iguala los `h1`–`h6` al texto normal, quita los marcadores de lista y deja los botones sin relieve.

Eso contradecía una frase que la proposal daba por buena —«las pantallas siguen exactamente como
están»—, porque el reinicio actúa **sin que ninguna pantalla use una sola utilidad**.

**Elegido**: encenderlo ahora, y corregir la proposal para que lo diga.

**Por qué frente a diferirlo** —importar solo `theme.css` y `utilities.css` y encender la base en
`add-app-shell`—: las quince piezas de este change se construirían midiendo contra una línea base
que iba a moverse debajo de ellas un change después, obligando a revisarlas todas. Un cimiento que
cambia después de construir encima es peor que un intermedio feo.

**Por qué frente a una capa de compatibilidad** que devolviera los defaults del navegador a
`features/` y se fuera vaciando: exige escribir y mantener un remedo de la hoja de estilos del
navegador —tamaños de los seis títulos, marcadores de lista, cromo de los controles— para tirarlo a
los pocos changes.

**Coste asumido y declarado**: las pantallas que este change no viste se ven más crudas hasta que su
change las vista. Lo que se comprueba en la tarea 1.2 no es que sigan bonitas, sino que ninguna quede
**inutilizable**.

**Y esa comprobación falló a la primera.** Con el reinicio puesto y nada en su lugar, la pantalla de
acceso deja los campos de correo y contraseña **invisibles**: `border: 0 solid` sobre `*` los borra,
y no queda ninguna pista de dónde escribir. No es fealdad, es una pantalla que no se puede usar
mirándola.

Lo que faltaba es una **capa base propia**: el reinicio quita los estilos del navegador y alguien
tiene que ocupar ese hueco. Definir cómo se ve un `<input>`, un `<button>` o un `<h2>` desnudos es
parte del sistema de diseño, no un parche de transición: se escribe una vez con tokens y se queda.

Esto **no** es la «capa de compatibilidad» descartada arriba. Aquella intentaba imitar la hoja de
estilos del navegador para tirarla a los pocos changes; esta declara nuestros propios valores por
defecto y es permanente. La diferencia práctica: cuando `redesign-access` vista la pantalla de
acceso, la capa base no se borra, se deja de notar.

### 2. Tres capas de token, y solo la de en medio se usa

```
   CAPA 1  primitivos          CAPA 2  semánticos         CAPA 3  escala
   ────────────────────        ───────────────────        ──────────────
   --color-amber-400           --color-coin               [data-scale="child"]
   --color-slate-900     ──▶   --color-surface      ──▶     --text-balance: 4rem
   --color-rose-600            --color-danger               --radius-card: 1.5rem
   --size-11                   --color-text-muted           --tap-min: 2.75rem

   nunca se usan               LO ÚNICO que usa           [data-scale="parent"]
   en un componente            un componente                --text-balance: 1.5rem
                                                            --radius-card: 0.5rem
                                                            --tap-min: 2rem
```

**Elegido**: un componente referencia **solo** tokens semánticos. Nunca `--color-amber-400`, siempre
`--color-coin`.

**Por qué**: es lo que hace que el modo oscuro sea después un archivo y no una auditoría. Un tema
oscuro reasigna `--color-surface` y nada más; si los componentes apuntaran a la paleta, habría que
visitarlos todos. Es la misma razón por la que la API guarda la **clave** de una imagen y no su URL:
se guarda el significado, no el valor de hoy.

**Descartado**: usar las utilidades de paleta de Tailwind directamente (`bg-slate-900`). Es lo más
rápido de escribir y lo que hace imposible cualquier tema posterior.

**Corregido al implementar**: la capa 1 acabó viviendo en un `:root` normal con el prefijo `--mnd-`,
**fuera** de `@theme`, y no dentro como daba a entender el diagrama de arriba. La razón es que
Tailwind genera una utilidad por cada token de `@theme`: dejar los primitivos ahí haría que
`bg-mnd-amber-400` existiera de verdad, y la regla «solo la capa 2» pasaría a depender de que nadie
se despiste. Fuera de `@theme` no se genera nada y saltársela es imposible, no solo desaconsejado.
Un test lo comprueba (`scale.test.tsx`), porque la tentación de mover un primitivo ahí para «poder
usarlo un momento» es exactamente como esto se degradaría.

### 3. La doble escala es un atributo en el contenedor, no una prop en cada pieza

**Elegido**: `data-scale="child" | "parent"` en el elemento raíz del shell. Los tokens de la capa 3 se
redefinen bajo ese selector. Una pieza no recibe nada y no sabe a quién sirve.

**Por qué frente a una prop `size` en cada componente**: con una prop, cada pantalla decide, cada
pantalla puede equivocarse, y una pantalla del niño con un botón `size="parent"` compila y se ve mal.
Con el atributo en el contenedor la audiencia se declara **una vez** por sesión, en el sitio donde ya
se sabe quién es el actor. Es el mismo criterio que el patrón de actor de la API: el rol no viaja como
un parámetro opcional que alguien puede olvidar.

**Por qué frente a dos juegos de componentes**: duplicar es la forma por defecto en que este proyecto
se degrada, y la spec lo declara defecto explícitamente.

**Consecuencia asumida**: hasta `add-app-shell` nadie pone ese atributo. Este change lo demuestra en
el catálogo vivo, que lo declara a mano en dos paneles enfrentados. El shell solo tendrá que ponerlo.

**Corregido al implementar, dos cosas.**

La primera: el token se llama `--text-hero`, no `--text-balance`. `text-balance` **ya existe** en
Tailwind y significa otra cosa —`text-wrap: balance`—, así que la utilidad generada habría chocado
con una nativa. Se detectó al escribir el archivo, no al usarlo, que es donde habría dolido.

La segunda: los tokens de la capa 3 **no** van en `@theme`, y sus utilidades —`text-hero`,
`rounded-card`, `tap-target`, `duration-*`— se declaran a mano con `@utility`. Así cada valor tiene
un solo origen y no hay que repetirlo en `@theme` y en el bloque de la escala. Lo que sí se repite, a
propósito y con su comentario, es el bloque del padre: una escala puede anidarse dentro de la otra, y
sin repetirlo un panel del padre dentro de uno del niño heredaría la escala equivocada.

**Y lo que no se pudo probar como se pensaba**: la diferencia visual entre escalas no se puede
verificar montando, porque jsdom no procesa Tailwind ni resuelve `var()`. Se comprueba en dos partes:
un test afirma que la misma pieza rinde **el mismo marcado** bajo las dos escalas —si algún día
difieren, alguien metió una prop de audiencia en la pieza—, y otro lee `tokens.css` y afirma que los
mismos tokens tienen valores distintos, incluido que el toque del niño no baja de 44px. Ver el que la
spec pedía y lo que de verdad es verificable.

### 4. Radix solo donde la accesibilidad no se improvisa

**Elegido**: Radix para `Dialog`, `Popover`, `DropdownMenu` y `Tabs`. El resto —botón, entrada,
tarjeta, insignia, aviso, esqueleto, barra de progreso— son elementos nativos vestidos con tokens.

**Por qué**: un diálogo correcto atrapa el foco, lo devuelve al cerrar, cierra con Escape, marca el
resto como inerte y se anuncia. Eso no se escribe bien a mano y no se descubre roto hasta que alguien
lo necesita. Un botón, en cambio, es un `<button>`: envolverlo en una abstracción de terceros añade
peso y quita control sobre los estados que la spec exige.

**Descartado — shadcn/ui completo**: trae decisiones de aspecto ya tomadas y una capa de variantes
que habría que desmontar para que los tokens manden. Copiar sus soluciones puntuales cuando encajen
es distinto de adoptar el kit.

**Descartado — React Aria**: más completo y más pesado, y su modelo de estilado encaja peor con
utilidades.

**Y adoptarlo no exime de comprobarlo.** El `Dialog` salió con el foco roto a la primera: Radix hace
`preventDefault()` sobre el retorno de foco del navegador y se lo entrega a su `Trigger`. Como aquí el
diálogo se abre con `open` controlado —lo dispara la fila de una lista o el resultado de una
mutación, no un único botón—, no hay `Trigger`, y **el foco se perdía en el `body` en cada cierre**.
Quien navega con teclado se quedaba en la nada tras cada confirmación.

Se resuelve capturando el elemento activo **durante el render**, en la transición de cerrado a
abierto, y devolviéndoselo en `onCloseAutoFocus`. Un efecto llega tarde: los efectos de los hijos
corren antes que los del padre, y para entonces Radix ya movió el foco dentro del diálogo.

Lo cazó un test, que es la única razón por la que se sabe. La lección no es que Radix esté mal —hace
lo correcto para su API idiomática—, sino que «lo trae la librería» no es lo mismo que «está
comprobado».

### 5. El catálogo vivo es un punto de entrada aparte, no una ruta del router

```
   índice de la app                   catálogo vivo
   ───────────────                    ─────────────
   index.html                         ui.html          ← solo en desarrollo
     └─ main.tsx                        └─ ui.tsx
         └─ QueryClient                     └─ (ningún proveedor)
             └─ Router                          └─ las piezas, a pelo
                 └─ pantallas
```

**Elegido**: un segundo HTML de entrada, añadido a `rollupOptions.input` **solo** cuando el `mode` de
Vite no es producción. `vite.config.ts` ya recibe `mode` como parámetro de `defineConfig`.

**Por qué**: la spec exige que el catálogo no viaje en el paquete del usuario. Las alternativas
fallan cada una por su lado:

- **Una ruta `/ui` protegida con `import.meta.env.DEV`** obligaría a una **tercera** excepción de
  `allowEnvAccess`, que CLAUDE.md marca como señal de alarma. Y aun así el código viajaría en el
  paquete, solo que sin renderizarse.
- **Excluir el archivo de ruta del escaneo del router en producción** depende de `routeTree.gen.ts`,
  que es un artefacto generado del que no queremos que dependa una garantía.

Y hay un beneficio que no buscábamos: sin `QueryClientProvider` y sin router, el catálogo **demuestra**
la frontera que la spec exige. Si una pieza necesitara un proveedor para montarse, el catálogo se
rompería, y ese es exactamente el aviso que queremos.

**Descartado — Storybook**: un segundo pipeline de build, un segundo lugar donde configurar los
tokens y una dependencia grande, para mostrar catorce piezas.

### 6. La prohibición de estilos en línea usa una regla propia, no `no-restricted-syntax`

**Elegido**: registrar `eslint-plugin-react` y activar **únicamente** `react/forbid-dom-props` y
`react/forbid-component-props` con `forbid: ["style"]`. Se exponen desde `packages/config` como
`forbidInlineStyles` y `allowInlineStyles(files)`, copiando literalmente el par
`forbidDatabaseImports` / `allowDatabaseImports` que ya existe.

**Por qué no un selector en `no-restricted-syntax`**: esa regla ya está ocupada por los tres
selectores de la regla del entorno, y en configuración plana la última declaración **reemplaza** el
array entero. Peor todavía: la función de excepción tendría que apagar `no-restricted-syntax`
completa, y con ella la prohibición de leer el entorno. Una excepción de estilo que desactiva en
silencio una regla de seguridad es exactamente el tipo de trampa que este proyecto evita.

**Coste asumido**: una dependencia de desarrollo más. Se registra el plugin y **no** se activa
ninguna de sus otras reglas, para no importar ruido que nadie pidió.

### 7. Los valores arbitrarios y los colores literales los caza un test, no un plugin

**Elegido**: un test que recorre `apps/web/src` y falla si encuentra un color literal (`#rrggbb`,
`rgb(`, `oklch(`) o una utilidad con valor arbitrario (`algo-[…]`) fuera de `tokens.css`.

**Por qué**: el proyecto ya usa este mecanismo cuando la herramienta no llega —`limits-sync.test.ts`
compara constantes contra SQL, y un test enumera las rutas de solo cuenta—. Un test es explícito,
no depende del nombre que un plugin de terceros le dé hoy a su regla, y su mensaje de fallo puede
explicar dónde vive el estilo. La spec pide que falle la verificación; no pide con qué.

**Descartado**: un plugin de lint específico de Tailwind. Cuando el ecosistema de v4 se asiente, este
test se puede sustituir sin tocar ninguna otra cosa.

### 8. Qué piezas entran, y cuáles se difieren a propósito

Entran las catorce que las once pantallas conocidas ya necesitan: `Button`, `Card`, `Input`, `Field`,
`Select`, `Badge`, `Coins`, `Dialog`, `Toast`, `Skeleton`, `EmptyState`, `Alert`, `ProgressBar`,
`Tabs`, más `Avatar` que se muda.

**Se difieren, y esto es una decisión y no un olvido**: `Table` —el padre lista, pero todavía no
sabemos si en tabla o en tarjetas, y eso se decide mirando `TaskBatchList` en `redesign-parent-tasks`—,
`Tooltip` —en una app que se usa con el dedo, un tooltip suele ser una etiqueta que faltaba—,
`DatePicker` —lo pide el vencimiento de una tarea, en `redesign-parent-tasks`— y `Pagination` —lo
pide la primera lista paginada que se vista—. Construir una pieza antes de la pantalla que la usa es
inventarse sus requisitos.

`Coins` entra desde el principio porque la moneda aparece en las cuatro áreas y hoy se escribe a mano
como `🪙 {n}` en cada sitio; y `Alert` porque el 409 del doble tap necesita un tono propio y hoy es un
párrafo rojo.

### 9. Los tests de pieza viven en `tests/`, como los que ya hay

**Elegido**: `apps/web/tests/ui/<pieza>.test.tsx`, con `environment: "jsdom"`, un `setupFiles` que
carga las aserciones de DOM, y el `include` ampliado a `.test.tsx`.

**Por qué frente a colocarlos junto al componente**: los siete tests que existen están en `tests/`, y
`turbo.json` ya declara `tests/**` como input. Mantener un solo sitio evita tener que explicar cuál
de los dos es el bueno.

**Riesgo controlado**: cambiar el entorno a `jsdom` afecta también a los tests de cliente de API. Se
comprueba que los siete siguen pasando, y es un escenario de la spec precisamente por eso.

### 10. `Avatar` se muda a `ui/` y conserva su lógica

Su lógica de dos formas —clave del catálogo o URL firmada— es correcta y **no se toca**. Lo que cambia
es de dónde salen su tamaño y su radio. La distinción sigue siendo `startsWith("http")`, y
`avatars.ts` sigue siendo el único archivo que sabe cómo se pinta un avatar.

**Corregido al implementar, dos cosas que la decisión no había previsto.**

`avatars.ts` **también se muda**. No es opcional: `Avatar` lo importa, así que dejarlo en
`features/auth/` haría que una pieza de `ui/` importara de `features/` — exactamente lo que el test
de frontera prohíbe. La decisión hablaba de mover un archivo y en realidad eran dos, y el segundo
solo aparece cuando la regla ya existe. Encaja igual de bien: «cómo se pinta un avatar» es
presentación, y `features/children/AvatarPicker.tsx` sigue pudiendo importar `AVATAR_OPTIONS` porque
una pantalla sí puede depender de una pieza.

Y su `size` **cambia de contrato**: de un número de píxeles a tres medidas con nombre
—`small`, `medium`, `large`—. Las once llamadas existentes pasaban siete valores distintos entre 20 y
96 píxeles, que es justo la clase de decisión que un sistema de diseño existe para quitar de las
pantallas. Es el único cambio de API pública del change, y toca archivos de `features/`: la
alternativa —conservar el número— habría metido una medida arbitraria en cada punto de uso desde el
primer día.

## Risks / Trade-offs

- **Tailwind v4 es reciente y buena parte del ecosistema todavía asume v3** → No se instala ningún
  plugin de Tailwind. Solo `@theme`, que es la superficie estable.
- **Cambiar el entorno de test a `jsdom` puede romper los siete tests existentes** → Comprobado: los
  siete archivos y sus 112 tests pasan sin tocar ninguno. Ninguno dependía del entorno `node`.
- **jsdom no implementa todo lo que Radix usa** → Descubierto al cerrar: el gesto de deslizar del
  `Toast` llama a `hasPointerCapture`, que jsdom no tiene, y la excepción salta **después** de que el
  test haya terminado. Los 159 asserts pasaban y aun así `vitest` devolvía un código distinto de
  cero: la peor forma de fallar, porque parece un test frágil y no lo es. Se rellena el hueco en
  `tests/setup.ts` —captura de puntero y `scrollIntoView`— y **no es un doble de nada que estemos
  probando**, sino acercar el navegador simulado al de verdad. Lección de método: mirar solo las
  líneas `Test Files` y `Tests` de la salida de vitest **no basta**; la línea `Errors` cuenta, y
  omitirla hace pasar por verde una ejecución que no lo está.
- **Arranque en frío de `jsdom` en Windows** → La primera ejecución tras instalar tardó 97 segundos
  solo en levantar el entorno y un worker murió con `Worker exited unexpectedly`, dando 6 archivos de
  7 sin que ningún test fallara. Las ejecuciones siguientes bajan a 13 segundos y pasan los siete. Es
  coste de caché fría, no un test frágil, pero conviene saberlo antes de creerse un fallo en la
  primera pasada de un CI limpio.
- **El catálogo vivo envejece y deja de reflejar las piezas** → Un test enumera lo exportado por
  `ui/index.ts` y falla si algo no aparece en el catálogo. Es la misma medicina que el test de rutas
  de solo cuenta: la lista vive donde se comprueba.
- **La escala se queda sin enchufar hasta el change siguiente** → Asumido y declarado. El catálogo la
  demuestra en los dos valores; `add-app-shell` solo tiene que poner el atributo.
- **`eslint-plugin-react` trae muchas reglas** → Se registra el plugin y se activan exactamente dos.
- **Los valores de color elegidos ahora pueden no aguantar cuando existan pantallas** → Por eso son
  tokens semánticos: reafinarlos es editar un archivo, y ese es todo el punto de la capa 2.
- **`pnpm verify` no cabe en memoria en esta máquina** → Descubierto al cerrar el change, y **no es
  culpa de nada que este change traiga**: `verify` lanza trece tareas en paralelo con `--force`, y con
  Docker, el editor y un navegador abiertos quedan menos de 2 GB libres de 14. V8 muere con
  `allocation failure` y turbo devuelve 127, con **una tarea distinta cada pasada**, que es lo que lo
  hace parecer un test frágil y no lo es. La verificación se hace con
  `pnpm turbo run lint typecheck test build --force --concurrency=1`. No se toca el script
  compartido: fijarle una concurrencia baja penalizaría a todo el mundo para siempre por una
  condición local y pasajera.

## Migration Plan

No hay datos que migrar y no hay contrato que romper: ninguna pantalla cambia de aspecto salvo el
avatar, que queda equivalente.

El orden importa por una razón: **la verificación tiene que seguir verde en cada paso**.

1. Dependencias y plugin de Vite, con una hoja de estilos vacía importada desde `main.tsx`. La app
   sigue viéndose exactamente igual, porque nada usa todavía una utilidad.
2. Tokens en sus tres capas. Sigue sin verse ningún cambio.
3. Infraestructura de test, y comprobar que los siete tests existentes pasan **antes** de escribir
   ninguna pieza.
4. Las piezas, cada una con su test.
5. El segundo punto de entrada con el catálogo, y comprobar que la compilación de producción no lo
   incluye.
6. Las reglas de lint y los tests de estilo **al final**. Antes fallarían por los estilos en línea de
   las pantallas que este change no toca — y ese es justo el punto siguiente.

**Vuelta atrás**: revertir el change deja el front exactamente como está hoy. No hay estado
persistido, ni migración, ni nada desplegado que dependa de esto.

## Open Questions

- **Los valores concretos de la paleta.** La estructura no depende de ellos y ninguna tarea cambia
  según cuáles sean. Se eligen al escribir `tokens.css` con dos restricciones fijas: contraste AA
  sobre las superficies donde se usen, y la moneda como color de marca reservado —si el color de la
  moneda también pinta botones genéricos, deja de significar «monedas»—. Si al vestir las primeras
  pantallas no aguantan, se reafinan editando la capa 2.
- **Cómo se declara la excepción de estilos en línea para el recorte de foto.**
  `react-easy-crop` puede exigir estilos calculados en tiempo de ejecución. Se resolverá al integrarlo
  en `redesign-access`, y `allowInlineStyles()` existe precisamente para que esa respuesta quede
  escrita en un archivo de configuración en vez de en la cabeza de alguien.

## Decisiones que este change NO toma

- **El aspecto de ninguna pantalla.** Ver el «No incluye» de la proposal.
- **Cómo se enchufa la escala al rol del actor**: `add-app-shell`.
- **Si el padre lista en tabla o en tarjetas**: `redesign-parent-tasks`, y de ahí saldrá si hace falta
  `Table`.
- **Qué se anima al aprobar una tarea**: `redesign-child-tasks`. Aquí solo se declaran las duraciones
  y el respeto a `prefers-reduced-motion`.
- **El tema oscuro**: la estructura lo admite; el tema no se escribe.

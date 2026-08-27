> Orden no negociable: las reglas de lint y los tests de estilo van al **final** (grupo 7). Antes
> fallarían por los estilos en línea de las pantallas que este change no toca. Ver el plan de
> migración del design.

## 1. Cimientos

- [x] 1.1 Añadir `tailwindcss` 4 y `@tailwindcss/vite` a `apps/web`, y registrar el plugin en
      `vite.config.ts` sin tocar el proxy ni el plugin del router.
- [x] 1.2 Crear `apps/web/src/styles/tokens.css` con solo `@import "tailwindcss"` e importarlo desde
      `main.tsx`. **Ojo**: eso trae también el reinicio de estilos, así que las pantallas de producto
      sí cambian de aspecto —títulos al tamaño del texto, listas sin viñetas, botones sin relieve—
      aunque ninguna use todavía una utilidad. Es el coste aceptado en la decisión 1b del design.
      Comprobar que ninguna queda **inutilizable**, que es distinto de que quede fea.
- [x] 1.3 Verificar que `pnpm --filter @monedin/web build` sigue pasando y que no hace falta tocar
      `turbo.json` porque el CSS vive bajo `src/**`.

## 2. Tokens en tres capas

- [x] 2.1 Capa 1 en `@theme`: paleta primitiva, escala de espaciado y de tamaños. Sin usarla todavía
      en ningún sitio.
- [x] 2.2 Capa 2, los tokens semánticos: superficie, texto, texto atenuado, borde, moneda, y los
      cuatro tonos de aviso (información, éxito, advertencia, error). Contraste AA sobre la superficie
      donde se usan.
- [x] 2.3 Capa 3, la escala: definir `[data-scale="child"]` y `[data-scale="parent"]` reasignando
      tipografía, radios y `--tap-min`. En la escala del niño, `--tap-min` no baja de 44px.
- [x] 2.4 Declarar las duraciones de transición y el bloque `prefers-reduced-motion` que las anula,
      en el propio archivo de tokens y no en cada pieza.
- [x] 2.5 **Capa base del sistema**: con el reinicio puesto y nada en su lugar, un `<input>` queda
      invisible y la pantalla de acceso no se puede usar. Declarar en `@layer base`, con tokens, el
      aspecto de los elementos desnudos —documento, `h1`–`h6`, enlaces, `input`, `select`, `textarea`,
      `button`— para que un marcado sin vestir sea legible y operable. Es permanente, no de
      transición: cuando `redesign-access` vista esa pantalla, esta capa deja de notarse.
- [x] 2.6 Volver a abrir la pantalla de acceso y comprobar que los campos se ven y el botón se
      distingue. Es el cierre de la comprobación que la tarea 1.2 dejó fallando.
- [x] 2.7 Comentar en cabecera del archivo qué capa puede usar un componente —solo la 2— y por qué,
      con el mismo tono que la cabecera de `constants/domain.ts`.

## 3. Infraestructura de test de componentes

- [x] 3.1 Añadir `jsdom`, `@testing-library/react`, `@testing-library/user-event` y
      `@testing-library/jest-dom` como dependencias de desarrollo de `apps/web`.
- [x] 3.2 Crear `apps/web/tests/setup.ts` con las aserciones de DOM y la limpieza entre tests.
- [x] 3.3 Cambiar `vitest.config.ts` a `environment: "jsdom"`, añadir `setupFiles` y ampliar el
      `include` a `.test.tsx`.
- [x] 3.4 **Ejecutar los siete tests de cliente de API y comprobar que siguen pasando** bajo `jsdom`.
      Si alguno depende del entorno `node`, aislarlo con la anotación de entorno por archivo en vez de
      revertir el cambio global. Es un escenario de la spec.

## 4. Las piezas de interacción

Cada tarea deja la pieza, sus estados y su test. Ninguna pieza importa nada de `features/` ni de
`api/`.

- [x] 4.1 `Button`: variantes de tono, los cinco estados —reposo, puntero, foco, deshabilitado, en
      curso— y objetivo de toque tomado de `--tap-min`. Test: en curso no admite un segundo clic.
- [x] 4.2 `Input` y `Field`: etiqueta, texto de ayuda, estado de error y su asociación accesible.
      Test: el mensaje de error queda asociado al control.
- [x] 4.3 `Select` sobre elemento nativo, con los mismos estados que `Input`. Test de teclado.
- [x] 4.4 `Card` y `Badge`, con sus radios tomados de la escala. Test: la misma tarjeta rinde distinto
      bajo las dos escalas.
- [x] 4.5 `Coins`: la moneda con su cifra, en tamaño normal y en tamaño destacado para el saldo.
      Recibe un número, nunca un texto ya formateado. Test de formato y de accesibilidad de la cifra.
- [x] 4.6 `ProgressBar`: valor, máximo y texto accesible. Es lo que usará el «te faltan N monedas» del
      escaparate. Test de los extremos: 0, completo y valor mayor que el máximo.

## 5. Las piezas de estado y de aviso

- [x] 5.1 `Alert` con los cuatro tonos y un texto explicativo. Test: un error se anuncia a las
      tecnologías de asistencia sin que la pantalla tenga que recordarlo.
- [x] 5.2 `Toast` sobre Radix, con su región anunciada y su cierre. Test de aparición y descarte.
- [x] 5.3 `Skeleton` y `EmptyState`. Test: `EmptyState` rinde su texto desde el catálogo de mensajes.
- [x] 5.4 `Dialog` sobre Radix. Test: atrapa el foco, cierra con Escape y lo devuelve al abridor.
- [x] 5.5 `Tabs` sobre Radix. Test de navegación con flechas.
- [x] 5.6 Mover `features/auth/Avatar.tsx` a `ui/Avatar.tsx`, sustituir sus estilos en línea por
      tokens y actualizar los imports de las pantallas que lo usan. **Su lógica de dos formas no se
      toca.** Test: clave de catálogo y URL firmada siguen distinguiéndose igual.
- [x] 5.7 Crear `ui/index.ts` exportando las quince piezas. Es la lista que el test del catálogo
      comparará.

## 6. Catálogo vivo

- [x] 6.1 Crear `apps/web/ui.html` y `apps/web/src/ui-catalog.tsx`, sin `QueryClientProvider` y sin
      router: si una pieza necesitara un proveedor, el catálogo se rompe, y ese es el aviso.
- [x] 6.2 Añadir el segundo punto de entrada a `rollupOptions.input` **solo** cuando el `mode` de Vite
      no es producción, usando el `mode` que `defineConfig` ya recibe. Sin `import.meta.env`, sin una
      tercera `allowEnvAccess`.
- [x] 6.3 Montar el catálogo: cada pieza en todos sus estados, en dos paneles enfrentados que declaran
      `data-scale="child"` y `data-scale="parent"` a mano.
- [x] 6.4 Añadir al catálogo de mensajes los textos del catálogo vivo. Ni un texto incrustado.
- [x] 6.5 Test que enumera lo exportado por `ui/index.ts` y falla si una pieza no aparece en el
      catálogo. Es lo que impide que envejezca.
- [x] 6.6 Compilar en producción y comprobar que **no** se genera `ui.html` y que el código del
      catálogo no está en el paquete. Escenario de la spec.

## 7. Las reglas que lo hacen cumplible

- [x] 7.1 Añadir `eslint-plugin-react` a `packages/config` y exportar `forbidInlineStyles` con
      `react/forbid-dom-props` y `react/forbid-component-props` sobre `style`, activando **solo** esas
      dos reglas del plugin.
- [x] 7.2 Exportar `allowInlineStyles(files)` copiando la forma de `allowDatabaseImports`, con un
      comentario que explique que cada llamada nueva debilita la regla.
- [x] 7.3 Aplicar ambas en `apps/web/eslint.config.js` y **arreglar los estilos en línea que aparezcan
      en `ui/`**. Los de `features/` quedan cubiertos por una excepción declarada y con fecha de
      caducidad: los nueve changes siguientes la van vaciando.
- [x] 7.4 Test que recorre `apps/web/src` y falla si encuentra un color literal fuera de `tokens.css`,
      con un mensaje que nombre el archivo de tokens como el sitio correcto.
- [x] 7.5 Test que falla ante una utilidad con valor arbitrario (`algo-[…]`) en `apps/web/src`.
- [x] 7.6 Test que falla si un archivo de `ui/` importa algo de `features/` o de `api/`. Es la
      frontera que la spec exige.

## 8. Cierre

- [x] 8.1 Verificación completa: lint, typecheck, test y build de todo el monorepo.

      **Se hizo, y hay que contar cómo, porque `pnpm verify` tal cual NO pasa en esta máquina.**
      Lanza trece tareas en paralelo con `--force`; con Docker, el editor y un navegador abiertos
      quedan 0,66 GB libres de 14, V8 muere con `allocation failure` y turbo devuelve 127 **con una
      tarea distinta en cada pasada**. Eso es lo que lo hacía parecer un problema del change.

      Con `--concurrency=1` la pasada llega hasta el final en 1h30m y deja **un solo** fallo:
      `tasks-create.test.ts > un valor fuera de rango se rechaza ANTES de tocar la base`, con
      `Hook timed out in 60000ms` y una duración registrada de **4.654.167 ms —77 minutos— para un
      único test**. No es un camino de código: es un hook de preparación que no consiguió CPU
      mientras Windows comprimía memoria.

      Lo verificado de verdad, paquete a paquete y con la máquina despejada:

      | Tarea | Resultado |
      | --- | --- |
      | `@monedin/api` test | 42/42 archivos ✓ (batería completa, 11 min) |
      | `tasks-create.test.ts` en aislamiento | 16/16 ✓ (el que expiró arriba) |
      | `@monedin/web` test | 15 archivos, 159 tests, exit 0, sin línea `Errors` ✓ |
      | `@monedin/contracts` test | 92 tests ✓ |
      | lint · typecheck · build | los tres en verde ✓ |

      **No se toca el script compartido.** Fijarle una concurrencia baja penalizaría a todo el mundo
      para siempre por una condición local y pasajera.
- [x] 8.2 Repaso manual con `pnpm dev`: recorrer las pantallas de producto y comprobar que **ninguna
      queda inutilizable** con la capa base puesta —campos visibles, botones distinguibles, jerarquía
      legible—. Se ven más planas y eso está previsto; lo que no puede pasar es que una acción deje de
      poder ejecutarse mirando la pantalla. Su marcado no se toca: si alguna cambió de estructura, se
      ha colado alcance.
- [x] 8.3 Comprobar el catálogo con la preferencia de movimiento reducido activada en el sistema.
- [x] 8.4 Actualizar el estado del proyecto en `README.md` y la sección de front de
      `openspec/config.yaml`, que vuelve a parsear desde este change.
- [x] 8.5 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**. No implementar a escondidas algo distinto de lo que el documento dice.

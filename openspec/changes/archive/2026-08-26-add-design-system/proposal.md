## Why

Cinco changes seguidos cerraron su proposal con la misma frase, palabra por palabra: «Sin sistema de
diseño. El front sigue siendo el andamio con estilos en línea.» No fue un descuido repetido cinco
veces: fue una deuda declarada a conciencia para que el dominio se construyera primero. Esta etapa la
cobra, y este change es su cimiento.

Lo que hay hoy funciona y no se toca: seis clientes de API validados con Zod, doce hooks de TanStack
Query y veinticuatro componentes que hacen lo correcto. Lo que no hay es **nada** con lo que
vestirlos: cero archivos `.css` en todo el repositorio, cero tokens, cero primitivas, y un único
layout que es `<main style={{ padding: "2rem", maxWidth: "40rem" }}>`.

El coste de eso no es estético. El producto enseña que el esfuerzo se convierte en monedas y las
monedas en decisiones, y hoy el saldo de un niño de siete años es `<strong>{coins}</strong>` en la
tipografía por defecto del navegador. Ninguna de las once pantallas que vienen después se puede
construir sin que exista antes un vocabulario común, y construirlas sin él significa inventarlo doce
veces y quedarse con doce dialectos.

Este change **no toca ni una pantalla de producto**. Si toca una, se ha colado alcance.

## What Changes

- **Tailwind v4 con configuración en CSS**, no en JavaScript: `@import "tailwindcss"` y un único
  bloque `@theme` en `apps/web/src/styles/tokens.css`. Ese archivo es la **única** fuente de color,
  espaciado, radio, sombra, tipografía y duración de todo el front, igual que
  `constants/domain.ts` lo es de los límites de negocio.
- **Doble escala en el mismo sistema.** Un atributo `data-scale="child" | "parent"` reasigna
  tipografía, radios y tamaño mínimo de toque sin duplicar un solo componente. Es la traducción
  técnica de que Monedín son dos productos en una app: para el niño, cifras grandes y pocos
  destinos; para el padre, densidad y escaneo rápido.
- **Primitivas** en `apps/web/src/ui/`: `Button`, `Card`, `Input`, `Field`, `Select`, `Badge`,
  `Coins`, `Dialog`, `Toast`, `Skeleton`, `EmptyState`, `Alert`, `ProgressBar` y `Tabs`. Radix
  únicamente donde la accesibilidad no se improvisa —diálogo, popover, menú, pestañas—; el resto son
  elementos nativos vestidos.
- **`Coins` y `Alert` no son adorno.** La moneda aparece en las cuatro áreas del producto y hoy se
  escribe a mano como `🪙 {n}` en cada sitio. `Alert` es lo que hace que el 409 del doble tap deje de
  ser un `<p style={{ color: "#b00020" }}>` y pase a contar lo que pasó, que es un contrato que la
  API ya cumple y la interfaz todavía no.
- **Infraestructura de test de componentes.** El `vitest` del front corre hoy en
  `environment: "node"` e `include: ["tests/**/*.test.ts"]`: no hay forma de montar un componente.
  Entran `jsdom`, `@testing-library/react`, `@testing-library/user-event` y
  `@testing-library/jest-dom`, y el `include` se amplía a `.test.tsx`. Sin esto, ningún change
  posterior de esta etapa puede cumplir la regla 9 de CLAUDE.md.
- **Tres reglas que se hacen cumplir con herramientas**, siguiendo el patrón que ya existe para el
  entorno y para el cliente de base de datos —`forbidDatabaseImports` más `allowDatabaseImports()`—:
  1. ESLint prohíbe el prop `style=` en `apps/web/src`, con una función de excepción declarada.
  2. ESLint prohíbe los valores arbitrarios de Tailwind (`bg-[#f0a]`, `p-[13px]`).
  3. Un test falla si aparece un color literal fuera de `tokens.css`.
- **Catálogo vivo** en la ruta `/ui`, con cada primitiva en todos sus estados y en las dos escalas.
  Es lo que hace que los once changes siguientes copien en vez de inventar, igual que el módulo
  `health` es la plantilla ejecutable de la anatomía de la API.
- **`Avatar` se muda** de `features/auth/` a `ui/`. Es la única primitiva que ya existía y estaba en
  el sitio equivocado: la usan cuatro áreas y ninguna tiene que ver con `auth`.

## Capabilities

### New Capabilities

- `design-system`: el vocabulario visual del front —de dónde sale cada color y cada medida, qué
  primitivas existen y en qué estados, cómo una misma primitiva sirve a un niño y a un padre sin
  duplicarse, y qué herramienta impide que alguien se lo salte en el change siguiente—.

### Modified Capabilities

Ninguna. Las quince specs vigentes describen comportamiento de la API y este change no toca una sola
ruta, un solo servicio ni una sola tabla. Tampoco modifica ninguna pantalla de producto, así que no
hay comportamiento observable por un usuario que cambie: lo que este change entrega es el material
con el que los siguientes lo cambiarán.

## Impact

**Dependencias nuevas** (todas en `apps/web`): `tailwindcss` 4 y `@tailwindcss/vite`; las primitivas
de Radix que se usen; y como dependencias de desarrollo `jsdom`, `@testing-library/react`,
`@testing-library/user-event` y `@testing-library/jest-dom`.

**Código nuevo**: `apps/web/src/styles/tokens.css`, `apps/web/src/ui/` con sus primitivas y sus
tests, `apps/web/src/routes/ui.tsx` con el catálogo, y `apps/web/tests/setup.ts`.

**Código modificado**: `apps/web/vite.config.ts` (el plugin de Tailwind), `apps/web/vitest.config.ts`
(entorno `jsdom`, `setupFiles` e `include` ampliado), `apps/web/src/main.tsx` (importar la hoja de
estilos), `apps/web/index.html`, `packages/config/eslint.config.js` (las dos reglas nuevas y su
función de excepción), `apps/web/eslint.config.js` (aplicarlas) y `apps/web/src/lib/messages.ts`
(los textos del catálogo vivo).

**Movimiento de archivo**: `features/auth/Avatar.tsx` pasa a `ui/Avatar.tsx`, lo que actualiza los
imports de las pantallas que lo usan. Mover un archivo y reescribir sus estilos en línea con tokens
no es rediseñar una pantalla —su aspecto es equivalente y su lógica de dos formas queda intacta—,
pero es la única vez que este change edita un archivo de `features/`, y por eso se dice aquí.

**API, base de datos y contratos**: sin tocar. Ni una migración, ni una ruta, ni una constante de
`@monedin/contracts`.

**Arquitectura**: estrena la carpeta `ui/` como capa aparte de `features/`. La frontera es literal y
comprobable: una primitiva de `ui/` no importa nada de `features/` ni de `api/`, y por eso se puede
probar sin servidor.

## No incluye

- **Cualquier pantalla de producto.** El acceso, la rejilla, las tareas, el escaparate, las bandejas
  del padre y los formularios conservan su marcado y sus estilos en línea intactos. Vestirlos es lo
  que hacen los nueve changes siguientes, y mezclarlo aquí haría irrevisable este.

  **Con una consecuencia que hay que decir**: la capa base del sistema —el reinicio de estilos—
  entra en este change, y eso sí cambia cómo se ven esas pantallas. Sus títulos pasan a tener el
  tamaño del texto normal, sus listas pierden las viñetas y sus botones pierden el relieve nativo.
  Se ven **más crudas** hasta que su change las vista. La alternativa era instalar el reinicio más
  tarde y construir las quince piezas sobre una línea base destinada a moverse debajo de ellas, que
  es el error más caro de los dos.
- **El esqueleto de navegación.** Las seis pantallas que hoy viven en `useState` booleanos dentro de
  la home siguen ahí. Convertirlas en rutas es `add-app-shell`, y es arquitectura, no diseño.
- **Modo oscuro.** Los tokens se declaran desde el primer día en una forma que lo admite —un juego de
  variables, no colores esparcidos—, pero no se envía ningún tema oscuro ni ningún interruptor.
- **Ilustraciones, logo, moneda dibujada, favicon y manifest PWA.** Los doce avatares siguen siendo
  emojis. Todo eso es `polish-brand-and-a11y`, el último change de la etapa.
- **Animaciones de celebración.** Los tokens declaran sus duraciones y las primitivas respetan
  `prefers-reduced-motion`, pero las monedas no suben con animación hasta que exista la pantalla que
  las sube, en `redesign-child-tasks`.
- **Un paquete `packages/ui`.** No hay un segundo consumidor, y un paquete compartido con un solo
  consumidor es ceremonia. Vive en `apps/web/src/ui/` hasta que exista una razón.
- **Storybook.** El catálogo vivo es una ruta de la propia aplicación: una dependencia menos, el
  mismo router, los mismos tokens y ningún segundo pipeline de build que mantener.
- **Auditoría de accesibilidad.** Las primitivas nacen accesibles porque Radix lo es y porque el foco
  visible es un token, pero la auditoría de contraste, tabulación y lectores de pantalla sobre las
  pantallas reales es el último change de la etapa.

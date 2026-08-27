> El orden importa. El grupo 1 es el corazón del change y **no se ve**: si se deja para el final, la
> rejilla vestida navega mal y parece un problema de aspecto. Ver el plan de migración del design.

## 1. El destino tras el PIN, que es lo único que no se ve

- [x] 1.1 Esquema `manageSearch` en `apps/web/src/app/search.ts`, junto a `pageSearch`, con
      `.catch(false)`. Un valor inválido **cae a apagado**: quien «llama» aquí es una persona con un
      enlace viejo, no código.
- [x] 1.2 `validateSearch` en `/profiles` y en `/profiles/$profileId/pin`. Las dos rutas comparten el
      esquema porque la intención tiene que **cruzar** de una a otra.
- [x] 1.3 `requireProfileChoice` acepta la intención como segundo argumento. En el caso `"app"` con
      `manage`, redirige a `/account` si el actor es padre y a `/me/settings` si es hijo. **El rol
      sale de la sesión que la guarda ya tiene**, nunca de lo que pida el cliente: nadie debería
      poder pedir aterrizar en la pantalla de otro rol.
- [x] 1.4 Test: con `manage`, un padre acaba en `/account` y un niño en `/me/settings`. Es el corazón
      del change.
- [x] 1.5 Test: **sin** `manage`, los dos siguen acabando en `/`. Lo de hoy no se rompe.
- [x] 1.6 Test: `?manage=platano` deja el modo apagado y la pantalla entera.
- [x] 1.7 Comprobar que los tres fallan de verdad inyectando una violación, y no pasan por vacíos.

## 2. La rejilla

- [x] 2.1 Reescribir `ProfileGrid.tsx` con tokens: pregunta centrada, teselas con `Avatar` y el
      nombre debajo, anillo de foco visible, objetivo de toque amplio. Cero estilos en línea, cero
      colores literales, cero valores arbitrarios.
- [x] 2.2 **Mirarla**, y si a `large` la tesela queda pequeña al lado de las proporciones de Netflix,
      añadir la talla a `Avatar` — **no** una medida arbitraria en la rejilla.
- [x] 2.3 «Agregar perfil» pasa a ser una tesela en la misma fila, con un `+`, en vez del enlace de
      texto de debajo.
- [x] 2.4 El botón que alterna: «Administrar perfiles» ↔ «Listo». Lo único que hace es navegar a
      `/profiles` con el parámetro puesto o quitado.
- [x] 2.5 Con el modo encendido, un lápiz **dentro** del enlace de cada tesela entrable, y el nombre
      accesible pasa a «Editar ‹nombre›». **Un solo elemento interactivo por tesela**: ver la
      decisión 3 del design.
- [x] 2.6 Un perfil bloqueado **no lleva lápiz** y sigue sin ser un enlace.
- [x] 2.7 Textos nuevos al catálogo de `lib/messages.ts`. Ni un string incrustado en el componente.
- [x] 2.8 Tests: los perfiles salen; el bloqueado no es un enlace y no tiene lápiz; con el modo
      encendido cada tesela entrable se anuncia como «Editar ‹nombre›»; el botón alterna el
      parámetro y «Listo» lo quita.
- [x] 2.9 Test de que hay **una sola cosa interactiva por tesela**: el lápiz no es un control aparte.

## 3. El teclado de PIN

- [x] 3.1 Vestir `PinPad.tsx` con las piezas que ya existen: `Button` para las teclas, `Alert` para
      el error, tokens para los puntos. **La lógica no se toca**: ni la mutación al cuarto dígito, ni
      la clave por perfil, ni `describeProfileEnterError`.
- [x] 3.2 Tecla de **borrar**. No toca la mutación, ni el conteo de intentos, ni el bloqueo: solo
      quita un dígito antes de llegar a cuatro, que es antes de que exista ningún intento.
- [x] 3.3 Con el modo encendido, el título dice que se está entrando **a editar** ese perfil.
- [x] 3.4 Tests: borrar con dos dígitos deja uno y **no consume intento**; borrar con el PIN vacío no
      hace nada.

## 4. La deuda declarada

- [x] 4.1 Estrechar la entrada de `features/auth/` en `apps/web/eslint.config.js`: del glob del
      directorio a los cuatro archivos que siguen sin vestir.
- [x] 4.2 Lo mismo en `tests/ui/style-rules.test.ts`, y ajustar el `toHaveLength`. Ese test existe
      para obligar a venir a explicarse; la explicación es la decisión 6 del design.
- [x] 4.3 Comprobar que los tests de estilo cazan solos un color literal metido a mano en los dos
      archivos ya vestidos. Si no lo cazan, es que salieron mal de la lista.

## 5. Cierre

- [x] 5.1 **Abrir la aplicación** y recorrer el flujo entero: rejilla → Administrar → lápiz sobre
      Mateo → PIN `1234` → aterrizar en «Mi perfil». Y lo mismo con Lucía y el PIN `1357` hasta
      `/account`. Los defectos de esta etapa los ha cazado mirar, no los tests.
- [x] 5.2 Que el botón **atrás** salga del modo administrar y no de la aplicación.
- [x] 5.3 Recargar con el modo encendido y comprobar que sigue encendido.
- [x] 5.4 A **390×844**: cuatro teselas envuelven a 2×2 y cero desbordamiento horizontal.
      **Corrección**: la tarea decía «en las dos escalas» y la rejilla NO tiene dos. `data-scale` lo
      declaran los marcos, y la rejilla se pinta antes de que nadie sea nadie, así que siempre va en
      la escala base —la misma del padre—. No es un descuido a arreglar: el objetivo de toque es la
      tesela entera, que mide 8rem.
- [x] 5.5 Un perfil **bloqueado** con el modo encendido.
- [x] 5.6 Verificación completa: `pnpm turbo run lint typecheck test build --force --concurrency=1`,
      con Docker arriba. Si se corta por un fallo, **lo que queda detrás no es verde, es
      desconocido**: correr los paquetes restantes por separado.
- [x] 5.7 Actualizar `README.md`, la sección de front de `openspec/config.yaml` y `CLAUDE.md`.
- [x] 5.8 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.

## 1. La capa 1: los primitivos

- [x] 1.1 Sustituir el bloque de primitivos de `apps/web/src/styles/tokens.css`: fuera el índigo, el
      verde, el naranja de aviso y el azul; dentro los neutros CÁLIDOS, el naranja y el morado. El
      ámbar y el rojo se quedan exactamente como están. Los valores, en `design/ui/tokens.md`.
- [x] 1.2 Actualizar los comentarios del bloque: hoy explican por qué el neutro lleva una pizca de
      azul y por qué el índigo es la acción. Las dos frases dejan de ser ciertas, y un comentario que
      miente es peor que ninguno.
- [x] 1.3 Comprobar que la capa 1 sigue FUERA de `@theme`. Es lo que impide que exista
      `bg-mnd-naranja-500` y lo que hace que «solo la capa 2» no dependa de que nadie se despiste.

## 2. La capa 2: reasignar y renombrar

- [x] 2.1 Reasignar los semánticos de superficie, tinta, borde, acción y marca a los valores nuevos.
      `--color-coin*` no se toca.
- [x] 2.2 Renombrar DOS tonos por su papel: `--color-success → --color-done` y
      `--color-warning → --color-conflict`, con sus `-soft`. `--color-info` y `--color-danger`
      conservan el suyo: nunca nombraron un color.
- [x] 2.3 Renombrar la prop de `ui/Alert.tsx`, `ui/Badge.tsx` y `ui/Toast.tsx`: `tone="info" |
      "done" | "conflict" | "danger"`. El typecheck señala cada punto de uso; no quedan alias del nombre viejo, porque dos
      nombres para lo mismo es el problema que el renombrado resuelve.
- [x] 2.4 Recorrer los puntos de uso que el typecheck señale y traducir el tono, **mirando qué dice
      cada uno**: un 409 es `conflict` y no `danger`, y una tarea aprobada es `done` y no `waiting`.
      Traducir a ciegas por el nombre viejo es cómo se pierde la distinción que la API sostiene.
- [x] 2.5 Actualizar el comentario de la reserva del ámbar: sigue valiendo palabra por palabra, pero
      menciona el índigo como la acción.

## 3. La escala de radios y de tipografía

- [x] 3.1 Cerrar los cinco radios —`control`, `card`, `panel`, `sheet`, `pill`— con sus valores por
      audiencia. `panel` y `pill` son nuevos.
- [x] 3.2 Sustituir en `ui/` los `rounded-full` y los radios sueltos por el token, que es donde hoy se
      escapa el 999 a mano.
- [x] 3.3 Cerrar los siete pasos de tipografía y declarar las utilidades de los tres nuevos:
      `text-micro`, `text-lead`, `text-display`.
- [x] 3.4 Declarar `[data-scale="public"]` con sus valores, y montarlo solo en la puerta pública.
- [x] 3.5 Test: ningún archivo de `apps/web/src` usa un radio o un tamaño que no sea un paso
      declarado. Ampliar el test de valores arbitrarios que ya existe, en vez de escribir otro.
- [x] 3.6 **Inyectar la violación**: poner un `rounded-[19px]` en una pieza y ver caer 3.5. Revertir.

## 4. El tema oscuro

- [x] 4.1 Extraer los valores por defecto a variables de tema —`--tema-ink`, `--tema-surface-raised`,
      y las demás que `[data-surface="default"]` restituye—, y hacer que ese bloque las referencie en
      vez de escribir valores. Sin este paso, `Alert` dentro del acceso sale claro sobre claro.
- [x] 4.2 Declarar el bloque oscuro con los tres estados: `@media (prefers-color-scheme: dark)`
      guardado con `:root:not([data-theme="light"])`, y `:root[data-theme="dark"]`. Los valores, en
      `design/ui/tokens.md`.
- [x] 4.3 Hacer que `color-scheme` siga al tema, y comprobarlo a mano en los cuatro controles nativos
      que esta aplicación tiene: barra de desplazamiento, autocompletado, la fecha límite de una tarea
      y el selector de archivo de una foto. **Declarado y con test; falta abrirlo en el navegador.**
      **Comprobado**: `color-scheme: light dark` en la raíz y heredado por el campo de fecha, que
      es el que lo necesita. La barra de desplazamiento sale oscura en el tema oscuro.
- [x] 4.4 Reasignar también `[data-surface="brand"]` en oscuro: su superficie elevada tiene que seguir
      la rampa oscura, o un campo sobre el panel del acceso se queda con el valor claro.
- [x] 4.5 Test de paridad: el bloque oscuro reasigna TODOS los tokens semánticos que declara el claro.
      Que falle nombrando el token, no con un booleano.
- [x] 4.6 **Inyectar la violación**: quitar una línea del bloque oscuro y ver caer 4.5 nombrándola.
      Revertir.

## 5. La capa de alias para componentes de terceros

- [x] 5.1 Declarar el `@theme inline` con los nombres que shadcn espera apuntando a los tokens de
      aquí. Once líneas; `--color-primary` y `--color-border` ya coinciden y no necesitan alias.
- [x] 5.2 Comentar el bloque diciendo qué es y qué NO se hace: no se copia su paleta, y no se usa su
      modo oscuro —aquí el tema cambia el valor de las variables, así que sus componentes se repintan
      solos sin escribir un `dark:`—.
- [x] 5.3 Test: ningún archivo de `apps/web/src` fuera del archivo de tokens declara un color de la
      librería externa, y no aparece la variante `dark:` en ningún sitio. Un `dark:` en el código
      significa que alguien copió un componente sin adaptarlo.

## 6. Documentación y comprobación a ojo

- [x] 6.1 Actualizar `CLAUDE.md` §8: el índigo deja de ser la acción, los cuatro tonos de aviso se
      renombran, y el tema oscuro deja de ser una promesa. Decir qué cambió y con qué argumento — una
      reversión que no se explica se lee como que la regla no valía.
- [x] 6.2 Actualizar el catálogo vivo (`ui.html`): añadir el conmutador de tema para poder ver las
      piezas en los dos, que es lo único que hace revisable el oscuro.
- [x] 6.3 **Abrir la aplicación en los tres marcos y en los dos temas** —el del padre, el del niño y
      el de entrada— y confirmar que ninguna pantalla se enteró de nada salvo del color. Esto no lo
      cubre ningún test y es el riesgo real de tocar tokens. **Pendiente: hay que abrir el navegador.**
      **Y cazó tres defectos que ningún test veía.** `--color-ink-inverted` se reasignaba, así que
      en oscuro el saludo salía casi negro sobre el coral y con él cada panel de realce. Y los
      botones `danger` y `contrast` quedaban claro sobre claro —1.18 y 1.14 de contraste— porque
      rellenaban con tintas de página. Arreglado y atado con un test.
- [x] 6.4 Comprobar que `design/ui/` no entra en ningún glob de lint ni de test. Son 2 489 estilos en
      línea y 20 radios sueltos: si alguna verificación los alcanza, el change no pasa por una razón
      que no tiene nada que ver con él.
- [x] 6.5 Lint, typecheck y batería del front, en verde. La pasada en paralelo hizo caer un test
      distinto cada vez y todos pasan aislados: es la contención que `CLAUDE.md` ya documenta, no un
      defecto. Con `--no-file-parallelism` pasa entera.

## Why

Monedín ya sabe quién es cada miembro de una familia y cuánto dinero de mentira tiene. Lo que no
sabe es **cómo ganarlo**. Hoy el saldo de un hijo solo se mueve con un ajuste manual del sembrado, y
no existe ni un endpoint que acredite una sola moneda.

Eso deja el producto sin lo que lo define. Monedín no es un gestor de tareas ni una app bancaria
para niños: lo que enseña es que **las tareas valen monedas**, y ese vínculo es justo el que falta.
Sin él, la rejilla de perfiles y los saldos son un decorado.

Este change cierra la primera mitad del ciclo —**esfuerzo → ingreso**— y deja la segunda, gastar,
para los premios. Y es el primero que mueve dinero de verdad, lo que lo convierte en el primero que
tiene que cumplir a rajatabla la regla de atomicidad: un niño con un teléfono lento **va a tocar dos
veces**, y aprobar dos veces la misma tarea no puede acreditar el doble.

## What Changes

- **Módulo `tasks` nuevo**, con las cinco capas de la anatomía habitual.
- **Un padre reparte una tarea entre varios hijos** y se crea **una fila por hijo**, cada una con su
  propio estado. La petición acepta las dos formas ya previstas: mismo valor para todos, o un valor
  distinto por hijo. El reparto es **todo o nada**: si alguno de los hijos no existe o no es suyo, no
  se crea ninguna fila.
- **Las filas de un mismo reparto quedan agrupadas** por un identificador nuevo, `batchId`, que es la
  única migración del change. Sin él no se puede distinguir un reparto de dos tareas homónimas
  creadas en semanas distintas.
- **El padre ve sus tareas agrupadas por reparto**, paginadas **por reparto** y no por fila, con
  filtros por estado y por hijo. Filtrar por «completadas» es la bandeja de lo que le toca aprobar.
- **El niño ve las suyas** en una lista plana con su valor en monedas.
- **Las tres transiciones**: el niño marca una tarea como hecha, y el padre la aprueba —lo que
  **acredita las monedas**— o la rechaza, que la devuelve a pendiente para que la reintente.
- **Aprobar es atómico e idempotente.** El cambio de estado se escribe con el estado de origen en su
  condición y se comprueba que afectó exactamente una fila; la acreditación y su entrada de historial
  van en esa misma transacción. Dos toques simultáneos dan una acreditación y un conflicto.
- **Editar y borrar solo en pendiente.** Una tarea que ya movió monedas no se toca: corregirla se
  hace registrando un movimiento que la compense, nunca editando el historial.
- **Fecha límite opcional e informativa**: se puede poner y se muestra, pero no caduca, no avisa y no
  cambia ninguna regla. La columna ya existe en el esquema.
- **Front funcional**, sin sistema de diseño: el reparto y la bandeja de aprobación para el padre, y
  sus tareas para el niño.
- **El sembrado pasa a crear tareas en los tres estados** y una acreditación real, para que la
  aplicación tenga algo que enseñar nada más levantarla.

## Capabilities

### New Capabilities

- `tasks`: el ciclo de vida de una tarea con valor en monedas —reparto entre hijos, consulta,
  edición y borrado restringidos por estado, y las transiciones de completar, aprobar y rechazar—
  junto con quién puede hacer cada cosa y qué pasa cuando dos personas actúan a la vez.

### Modified Capabilities

- `coin-ledger`: sus requisitos ya exigen que toda mutación de saldo sea atómica y deje rastro, pero
  ninguno afirma que **una misma tarea no pueda acreditar dos veces**. Eso no se deriva de la
  atomicidad: la operación de mover monedas no es idempotente por sí sola, y hasta ahora ningún
  módulo la usaba. Se añade ese requisito con el origen del movimiento.
- `family-data-model`: el modelo gana el dato del reparto —qué filas nacieron del mismo acto—, que
  hasta ahora no se guardaba en ningún sitio.

## Impact

**Código nuevo**: `apps/api/src/modules/tasks/` (cinco capas) y
`packages/contracts/src/schemas/tasks.ts`. En el front, `apps/web/src/api/tasks.ts`,
`apps/web/src/features/tasks/` y la ruta `apps/web/src/routes/tasks.tsx`.

**Código modificado**: `apps/api/src/app.ts` para registrar el router, el catálogo de mensajes de la
API, `apps/api/prisma/seed.ts`, y en el front el catálogo de textos y la home de cada rol.

**Base de datos**: **una migración**, la primera desde el modelo inicial. Añade `batchId` a `tasks`,
rellena las filas existentes dándole a cada una su propio reparto, y crea su índice. No toca ninguna
restricción existente, así que el test de coherencia de límites no cambia — pero hay que verlo pasar.

**Arquitectura**: es el primer módulo con una **transacción interactiva de producción**. Hasta ahora
solo había una por lote, para paginar. El patrón que se escriba aquí es el que copiarán los canjes,
que descuentan en vez de acreditar.

**API**: nueve rutas nuevas bajo `/tasks`. Ninguna rompe un contrato existente.

## No incluye

- **Fechas límite con consecuencias**: que caduquen, que avisen, que dejen de valer monedas o que
  cambien de estado solas. Aquí la fecha solo se muestra.
- **Tareas recurrentes o plantillas** («cada lunes, sacar la basura»).
- **Notificaciones** de ningún tipo.
- **Reasignar una tarea a otro hijo.** Cambiar de hijo es borrar la pendiente y crear otra.
- **Deshacer una aprobación.** El historial es inmutable: se corrige con un movimiento que compense,
  y ese mecanismo no se expone todavía en ningún endpoint.
- **El historial de monedas visible para el padre**, que merece su propia pantalla.
- **Ajuste manual del saldo**, que sigue sin existir fuera del sembrado.
- **Premios y canjes**, que son la otra mitad del ciclo.
- **Sistema de diseño.** El front sigue siendo el andamio con estilos en línea.

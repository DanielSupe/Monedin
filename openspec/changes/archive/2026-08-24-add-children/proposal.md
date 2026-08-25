## Why

Monedín sabe autenticar a una familia y ofrecerle una rejilla de perfiles, pero **no tiene forma de
crear un hijo**. Hoy los perfiles solo existen si alguien los siembra a mano contra la base de datos,
y la rejilla enseña un botón que dice literalmente *"Crear perfiles llega en el siguiente paso"*.

Eso deja dos cosas paradas a la vez. La primera es que nada de lo construido en
`add-profile-selection` se puede probar de verdad: una rejilla con un único perfil no ejercita ni el
cambio de perfil, ni el aislamiento entre hermanos, ni el PIN de cada niño. La segunda es que
`/tasks` —el núcleo del producto, donde una tarea vale monedas— no tiene a quién asignar nada. El
hijo es la entidad de la que cuelga todo lo demás: el saldo, las tareas, los canjes y el historial.

Este change también estrena la **paginación**, que hoy no existe en ningún endpoint pese a ser
obligatoria por convención, y lo hace sobre el listado más simple del sistema para que `/tasks` la
herede ya rodada en vez de improvisarla sobre un caso complicado.

## What Changes

- **Módulo `children` nuevo**, con las cinco capas de la anatomía habitual y sin ninguna migración:
  `ChildProfile` ya tiene `age`, `avatar`, `deletedAt` y el índice que necesita el listado.
- **Alta de un hijo desde la rejilla**, con nombre, PIN, y edad y avatar opcionales. Es una ruta de
  **solo cuenta**: no exige haber entrado a un perfil y por tanto no pide el PIN de adulto, que es lo
  que `profile-selection` ya prevé al ofrecer crear *"cuando aún no se ha elegido ninguno"*. El
  servicio **rechaza que la ejecute un perfil de niño activo**, como esa misma spec exige.
- **Tope de hijos activos por familia**, comprobado en el servicio y respondido como conflicto. Es lo
  que acota que el alta no pida PIN: quien no tiene perfil de padre no puede dar de baja, así que no
  puede liberar huecos y repetir.
- **Listado paginado para el padre**, con saldo, edad, avatar y estado de bloqueo. Estrena
  `paginationQuerySchema` y la envoltura `{ items, page, pageSize, total, totalPages }` en
  `@monedin/contracts`, pensadas para que las reutilicen los listados siguientes.
- **Detalle y edición** de un hijo propio: nombre, edad y avatar. Nunca el saldo.
- **Baja lógica y definitiva**, que revoca las sesiones abiertas de ese perfil y conserva su
  historial. No hay reactivación ni borrado físico.
- **El niño ve y personaliza lo suyo**: `GET /children/me` con su saldo, y `PATCH /children/me` para
  elegir su avatar del catálogo.
- **El niño puede cambiar su propio PIN** sabiendo el actual, con el mismo bloqueo por intentos que
  al entrar. Vive en el módulo `auth`, porque verificar y reescribir una credencial es suyo.
- **Esquema Zod del catálogo de avatares**, que `add-profile-selection` prometió y no entregó: hoy la
  columna acepta cualquier cadena y nada impide guardar una clave que el front no sabe pintar.
- **Front funcional** —sin sistema de diseño, como el resto del andamio—: alta desde la rejilla,
  pantalla de gestión del padre en una ruta propia, y ajustes del niño.
- **Se corrigen tres derivas entre las specs y el código**, detalladas abajo. Ninguna las introduce
  este change; las hereda y no quiere dejarlas otro change más.

## Capabilities

### New Capabilities

- `child-profiles`: el ciclo de vida de un perfil de hijo como entidad de producto —alta con su
  tope, listado paginado, consulta, edición, baja definitiva— y qué puede ver y cambiar cada rol
  sobre él.

### Modified Capabilities

- `child-authentication`: hoy afirma que *"un niño NO SHALL poder cambiar ningún PIN, ni el suyo"*.
  Pasa a poder cambiar **el suyo** sabiendo el actual, sin poder tocar el de un hermano ni el de su
  padre. Se corrige además que entrar a un perfil de niño exige *"una sesión de padre activa"*:
  desde `add-profile-selection` basta una sesión de **cuenta**.
- `parent-authentication`: el escenario *"No hay registro de niños"* afirma que *"la única forma de
  que exista un niño es que lo cree un padre desde su sesión"*, y el alta la hará la cuenta sin
  perfil activo. Se corrige también el requisito del PIN de adulto, que promete desactivar los
  perfiles activos en otros dispositivos: el código nunca lo hizo, y la decisión es **ajustar la
  spec a lo que el sistema hace**, no añadir esa revocación.
- `profile-selection`: el requisito *"Elegir perfil es obligatorio antes de operar"* declara las
  rutas que se conforman con la cuenta; el alta de un hijo se suma a esa lista cerrada, con la
  condición explícita de que ninguna ruta de solo cuenta toca monedas, tareas, premios ni canjes.

## Impact

**Código nuevo**: `apps/api/src/modules/children/` (cinco capas), `apps/api/src/shared/pagination.ts`,
`packages/contracts/src/schemas/{pagination,avatar,children}.ts`, `apps/web/src/api/children.ts`,
`apps/web/src/features/children/` y la ruta `apps/web/src/routes/children.tsx`.

**Código modificado**: `apps/api/src/app.ts` (registrar el router), el catálogo de mensajes de la API,
el módulo `auth` (la ruta del PIN propio del niño), `constants/domain.ts` (el tope), y en el front
`ProfileGrid` —donde desaparece el marcador de posición—, `AuthGate`, `messages.ts` y la home.

**API**: siete rutas nuevas bajo `/children` más una en `/auth`. Ninguna rompe un contrato existente;
la única respuesta que cambia de forma es el avatar del actor de niño, que pasa a salir siempre
resuelto en vez de admitir nulo, alineándose con lo que ya hace la rejilla.

**Base de datos**: **sin migración**. Es la comprobación de que `add-data-model` acertó con el
esquema.

**Documentación**: `CLAUDE.md` gana el patrón de paginación y la distinción entre invariante de
integridad y límite de política; y se corrige su recuento de rutas de solo cuenta, que dice tres
cuando ya son cuatro. `config.yaml` actualiza la superficie de `/children`.

## No incluye

- **Ajuste manual del saldo.** El saldo solo se moverá con tareas y canjes. `MANUAL_ADJUSTMENT`
  existe en el enum del historial, pero ningún endpoint lo produce todavía.
- **Reactivar un hijo dado de baja**, ni listarlos, ni un cubo de papelera. La baja es definitiva.
- **Borrado físico** de un perfil, que además la clave ajena del historial impide.
- **El historial de monedas de un hijo** visible para el padre: llega con las tareas, que es lo
  primero que lo llena.
- **Avatares subidos a S3** y la imagen del padre. Aquí solo se usa el catálogo cerrado de
  ilustraciones que ya existe.
- **Revocar los perfiles activos en otros dispositivos al cambiar un PIN.** Se descarta a conciencia
  y se corrige la spec que lo prometía.
- **Limitación de peticiones** y **registro de quién creó cada perfil**, que exigiría una columna
  nueva.
- **Sistema de diseño.** El front sigue siendo el andamio funcional con estilos en línea.
- `/tasks`, `/rewards` y `/redemptions`.

## Why

Monedín lleva tres changes prometiendo imágenes de verdad y entregando marcadores de posición. Los
avatares son un catálogo cerrado de doce emojis, `Reward.image` es una columna que existe desde
`add-data-model` y que ningún formulario ha rellenado nunca, y `CLAUDE.md` da por cerrada desde el
primer día la decisión de que «los avatares y las imágenes se suben a S3, bucket privado, URLs
firmadas de corta vida, detrás de una interfaz `StorageProvider`». El propio código lo anota:
`avatars.ts` dice literalmente «cuando llegue `add-file-storage`, un avatar propio será otra forma
del mismo campo», y `avatarGlyph` promete que «cuando haya ilustraciones de verdad, cambia este
archivo y nada más».

Este change cobra esas tres promesas. Y de paso cierra el ciclo pedagógico por el otro lado: hasta
ahora el niño dice que hizo la tarea y el padre le cree o no le cree. Con una foto opcional, puede
**enseñarlo**.

## What Changes

- **Infraestructura de archivos, por primera vez**: `apps/api/src/shared/storage/` con la interfaz
  `StorageProvider` y su implementación sobre S3, más MinIO en `docker-compose.yml` para que el
  flujo completo —y sus tests— corran en local sin credenciales de AWS.
- **El binario nunca pasa por la API**: la API firma una URL de subida de vida corta, el navegador
  hace `PUT` directo contra S3, y después confirma llamando al endpoint de dominio que ya existía
  para guardar esa referencia. Antes de persistirla, el servicio comprueba que el objeto existe de
  verdad.
- **Avatar propio del hijo y del padre**, que **convive** con el catálogo de emojis: seguir eligiendo
  una nutria sigue siendo válido, subir una foto es la otra forma del mismo campo. De paso, el padre
  pasa a ver su propio avatar dentro de su sesión y no solo en la rejilla, que hoy no puede porque
  `parentActorSchema` no lo expone.
- **Foto del premio** (`Reward.image`), que se añade al editarlo y no al publicarlo: la clave de S3
  necesita un identificador de premio que todavía no existe mientras se está creando.
- **Evidencia fotográfica OPCIONAL al completar una tarea**: el niño puede adjuntar una foto al
  marcarla como hecha, y el padre la ve antes de aprobar. Sin foto, completar funciona exactamente
  igual que hoy.
- **Compresión y recorte en el navegador** antes de subir: recorte cuadrado para los avatares, que
  se muestran pequeños, y solo compresión para la foto de premio y la evidencia, donde recortar
  quitaría justo lo que hay que ver.
- **Una migración, y pequeña**: `Task.evidenceKey`. Las otras tres columnas de imagen ya existían.

## Capabilities

### New Capabilities

- `file-storage`: subida de imágenes por URL firmada —pedirla, subir directo al almacén, confirmarla
  verificando propiedad y existencia real del objeto— y entrega de URLs de lectura firmadas de vida
  corta en las respuestas de la API.

### Modified Capabilities

- `child-profiles`: el avatar de un hijo puede ser una foto propia además de una clave del catálogo,
  y se lee siempre resuelto (clave corta o URL lista para pintar).
- `profile-selection`: el avatar del padre también puede ser una foto propia, y viaja en su actor,
  no solo en la rejilla previa.
- `rewards`: un premio puede llevar una foto, que se añade editándolo.
- `tasks`: completar una tarea admite adjuntar una evidencia fotográfica opcional, que el padre ve
  al resolverla.

## Impact

**Código nuevo**: `apps/api/src/shared/storage/` (interfaz, implementación S3, cliente perezoso),
`apps/api/src/shared/avatar/resolve-avatar.ts`, `packages/contracts/src/constants/uploads.ts` y
`schemas/uploads.ts`, `apps/web/src/lib/s3-upload.ts`, `apps/web/src/features/uploads/`,
`apps/web/src/features/auth/Avatar.tsx`, `apps/api/tests/support/storage.ts`.

**Código modificado**: los cuatro módulos que ganan una ruta de subida y una confirmación —`children`,
`auth`, `rewards`, `tasks`—, sus contratos correspondientes, `avatars.ts` en el front (único punto que
resuelve un valor de avatar), `AvatarPicker.tsx`, y las pantallas donde se elige avatar, se edita un
premio, se completa una tarea y se aprueba.

**Dependencias nuevas**: `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner` en `apps/api`;
`browser-image-compression` y `react-easy-crop` en `apps/web`.

**Base de datos**: una sola migración, `Task.evidenceKey String?`, un `ADD COLUMN` que no toca
ninguna fila existente. `ChildProfile.avatar`, `User.image` y `Reward.image` ya estaban.

**Configuración**: seis variables nuevas en `env.schema.ts` y `.env.example` —dos de ellas
secretas—, y MinIO en `docker-compose.yml` con su bucket de desarrollo y su bucket de tests.

**Arquitectura**: `shared/storage` no sabe de negocio. Quién es dueño de qué, y con qué prefijo de
clave, lo decide cada módulo de dominio, igual que ya decide su propia autorización.

## No incluye

- **Certificados e insignias de logro.** Generar una imagen cuando el niño alcanza una meta es una
  idea que merece su propio change: no reutiliza nada de este —no hay nadie subiendo un archivo— y
  arrastra decisiones de producto (qué metas, qué diseño, si se comparten) que no toca abrir aquí.
- **Crear el bucket y las credenciales de producción.** Este change queda completo y probado contra
  MinIO en local. Aprovisionar el bucket real de S3 y un usuario IAM con permisos mínimos sobre él es
  un paso operativo, no de código, y bloquearía el change sin necesidad.
- **Borrar los objetos huérfanos.** Reemplazar un avatar, retirar un premio o borrar una tarea deja
  su imagen anterior en el almacén. Se acepta a conciencia: el borrado sin transacción distribuida es
  siempre a mejor esfuerzo, y equivocarse borrando pesa más que el coste de guardar de más mientras
  el volumen sea el de unas cuantas familias.
- **Cancelar o reemplazar una evidencia ya subida.** Una vez la tarea está marcada como hecha con su
  foto, esa foto es lo que el padre va a ver. Rehacerla es rechazar la tarea y volver a completarla.

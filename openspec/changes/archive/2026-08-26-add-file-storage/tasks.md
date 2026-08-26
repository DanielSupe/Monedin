## 1. Contratos compartidos

- [x] 1.1 Crear `packages/contracts/src/constants/uploads.ts`: `ALLOWED_IMAGE_CONTENT_TYPES =
      ["image/jpeg", "image/png", "image/webp"] as const` con su tipo, `MAX_UPLOAD_KEY_LENGTH = 512`
      y `MAX_IMAGE_SIZE_MB` (lo que el front usa como objetivo de compresión).
- [x] 1.2 Crear `packages/contracts/src/schemas/uploads.ts`: `imageContentTypeSchema`,
      `createUploadUrlSchema` (`{ contentType }`, `.strict()`), `uploadUrlSchema`
      (`{ uploadUrl, key, expiresAt }`, la respuesta) y `uploadKeySchema` (forma de la clave; la
      PROPIEDAD la comprueba el servicio, no el esquema — decisión 3 del design).
- [x] 1.3 En `packages/contracts/src/schemas/avatar.ts`, añadir
      `avatarValueSchema = z.union([avatarKeySchema, z.string().url()])` y su tipo, documentando que
      es la forma de LECTURA —clave de catálogo o URL ya firmada— mientras `avatarKeySchema` sigue
      siendo la de ESCRITURA para elegir del catálogo. Ver la decisión 4 del design.
- [x] 1.4 En `schemas/children.ts`: `avatar` pasa a `avatarValueSchema` en `childSchema` y
      `ownChildSchema`; añadir `avatarUploadKey` opcional a `updateChildSchema` y
      `updateOwnChildSchema`, con el `.refine()` que rechaza mandar catálogo y foto a la vez (en
      `updateOwnChildSchema`, pasa a exigir exactamente uno de los dos).
- [x] 1.5 En `schemas/auth.ts`: añadir `avatar: avatarValueSchema` a `parentActorSchema` —hoy no lo
      tiene, ver la decisión 6— y crear `updateParentAvatarSchema` (`{ avatarUploadKey }`,
      `.strict()`).
- [x] 1.6 En `schemas/rewards.ts`: `avatar` de `rewardOfferChildSchema` pasa a `avatarValueSchema`;
      añadir `image: z.string().url().nullable()` a `rewardSchema` y `imageUploadKey` opcional y
      nullable a `updateRewardSchema` —`null` explícito borra la foto—. **`createRewardSchema` NO lo
      lleva**: el alta no acepta imagen (decisión 7).
- [x] 1.7 En `schemas/tasks.ts`: `avatar` de `taskChildSchema` pasa a `avatarValueSchema`; crear
      `completeTaskSchema` (`{ evidenceUploadKey }` opcional, `.strict()`); añadir
      `evidence: z.string().url().nullable()` a `taskSchema` y `ownTaskSchema`.
- [x] 1.8 Exportar lo nuevo desde `packages/contracts/src/index.ts`.
- [x] 1.9 Tests en `packages/contracts/tests/contracts.test.ts`: `avatarValueSchema` acepta una clave
      del catálogo y una URL, y rechaza una clave cruda de almacén sin protocolo;
      `updateOwnChildSchema` rechaza `{}` y rechaza los dos campos a la vez, y acepta cada uno por
      separado; `createUploadUrlSchema` rechaza un tipo fuera de la lista (`image/gif`);
      `createRewardSchema` rechaza `imageUploadKey`; `completeTaskSchema` acepta un cuerpo vacío.

## 2. `shared/storage` en la API

- [x] 2.1 Añadir `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner` a `apps/api/package.json`.
- [x] 2.2 Crear `apps/api/src/shared/storage/provider.ts` con la interfaz `StorageProvider`
      (`createUploadUrl`, `createReadUrl`, `objectExists`) y las constantes
      `UPLOAD_URL_TTL_SECONDS = 300` y `READ_URL_TTL_SECONDS = 3600`, con el comentario de por qué son
      constantes y no configuración (decisión 9).
- [x] 2.3 Crear `apps/api/src/shared/storage/extension.ts` con `extensionForContentType()` —mapeo
      puro, sin negocio— que usan los cuatro módulos al construir su clave.
- [x] 2.4 Crear `apps/api/src/shared/storage/s3-provider.ts`: `S3Client` con `region`, `endpoint`
      opcional y `forcePathStyle` cuando hay endpoint (necesario para MinIO); `PutObjectCommand` +
      `getSignedUrl` firmando con el `ContentType`; `GetObjectCommand` + `getSignedUrl` para leer;
      `HeadObjectCommand` con el 404 traducido a `false` para `objectExists`.
- [x] 2.5 Crear `apps/api/src/shared/storage/client.ts` con `getStorageProvider()` perezoso —mismo
      patrón que `getPrisma()`— y `setStorageProviderForTests()`, más el `index.ts` que reexporta.
- [x] 2.6 Crear `apps/api/src/shared/avatar/resolve-avatar.ts` con `resolveAvatarForResponse()`,
      documentando que es el ÚNICO sitio que distingue clave de catálogo de clave de almacén, y que lo
      usan los cuatro módulos para no repetir la rama (decisión 5).
- [x] 2.7 Tests de `s3-provider.ts` contra MinIO real: subir con la URL firmada y volver a leerla;
      `objectExists` da `false` para una clave inventada y `true` tras subir; una URL firmada para
      `image/jpeg` **rechaza** un `PUT` con otro tipo; una URL de subida caducada se rechaza.

## 3. Configuración

- [x] 3.1 En `apps/api/src/config/env.schema.ts`: añadir `S3_REGION`, `S3_BUCKET_NAME`,
      `TEST_S3_BUCKET_NAME`, `S3_ENDPOINT` (opcional-vía-vacío: vacío significa el S3 real de AWS),
      `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`; las dos últimas también a `SECRET_ENV_KEYS`.
      Corregir el comentario de `LOG_LEVEL` que dice ser el único campo con valor por defecto.
- [x] 3.2 Añadir las seis a `.env.example` con valores de desarrollo apuntando a MinIO, y las de
      `MINIO_*` que solo consume `docker-compose.yml`, con el mismo aviso que ya llevan las
      `POSTGRES_*` de que la API no las lee.
- [x] 3.3 Comprobar con `pnpm lint` desde `apps/api` que **no** hace falta tocar `allowEnvAccess()` en
      `eslint.config.js`: `shared/storage` lee vía `getConfig()` y nunca `process.env`.
- [x] 3.4 Tests: el de sincronía entre el esquema y `.env.example` sigue en verde con las seis nuevas;
      `S3_ENDPOINT` vacío se resuelve a ausente y uno sin `http(s)://` se rechaza; el arranque con una
      variable obligatoria ausente sigue muriendo reportando todos los problemas de una vez.

## 4. MinIO en `docker-compose.yml`

- [x] 4.1 Añadir el servicio `minio` (`minio/minio`), con sus dos puertos, credenciales de raíz,
      healthcheck y volumen nombrado, con el mismo estilo de comentario que ya usa `adminer` para
      dejar claro que es infraestructura de desarrollo.
- [x] 4.2 Añadir el servicio `minio-init` (`minio/mc`, `restart: "no"`) que espera a que MinIO esté
      sano y crea el bucket de desarrollo y el de tests con `mc mb --ignore-existing`.
- [x] 4.3 Documentar en la cabecera del archivo que MinIO es el S3-compatible local y que producción
      usa el S3 real con `S3_ENDPOINT` vacío.
- [x] 4.4 Comprobar a mano que `docker compose up -d` deja MinIO sano y los dos buckets creados.

## 5. Migración de `Task`

- [x] 5.1 Añadir `evidenceKey String?` al `model Task` en `apps/api/prisma/schema.prisma`.
- [x] 5.2 Generar la migración y **revisar el SQL a mano**: debe ser un único `ALTER TABLE ... ADD
      COLUMN`, sin recrear la tabla. Ver la advertencia de la sección 6 de `CLAUDE.md`.
- [x] 5.3 Confirmar que no se genera ninguna migración para `ChildProfile.avatar`, `User.image` ni
      `Reward.image` —ya existen—. Si aparece algo, parar: se coló un cambio fuera de alcance.
- [x] 5.4 Comprobar que `tests/database/limits-sync.test.ts` sigue en verde tras la migración.

## 6. Módulo `children`: avatar del hijo

- [x] 6.1 Añadir `InvalidAvatarUploadError` a `children.errors.ts` y su texto al catálogo de mensajes
      de la API.
- [x] 6.2 En `children.service.ts`, añadir `requestAvatarUploadUrl()` reutilizando el `ownedChild`/
      `ownProfile` que ya existe, con la clave `avatars/children/{childId}/{uuid}.{ext}`.
- [x] 6.3 Extender `updateChild()` y `updateOwnAvatar()`: si viene `avatarUploadKey`, comprobar el
      prefijo del dueño **y** `objectExists()` antes de persistir (decisión 3); si viene `avatar`, sin
      cambios. Pasar `toChild()`/`toOwnChild()` a asíncronas usando `resolveAvatarForResponse()`, y
      propagar hacia arriba (`Promise.all` en el listado).
- [x] 6.4 Añadir las dos rutas a `children.routes.ts` —`/children/me/avatar/upload-url` (niño) y
      `/children/:childId/avatar/upload-url` (padre)— **antes** de `/children/:childId`, con el
      comentario del fallo silencioso, y sus manejadores en el controlador.
- [x] 6.5 Tests de subida: el padre pide URL para un hijo suyo y el niño para sí mismo, y la clave
      lleva el prefijo correcto; para un hijo ajeno responde 404 y no entrega URL; un padre sin perfil
      elegido recibe 401.
- [x] 6.6 Tests de confirmación: confirmar una clave realmente subida deja el avatar como URL firmada
      en la respuesta; una clave jamás subida da 422 y el avatar no cambia; la clave de OTRO hijo da
      422 aunque el objeto exista; mandar `avatar` y `avatarUploadKey` juntos da 422; elegir del
      catálogo sigue funcionando exactamente igual que antes.

## 7. Módulo `auth`: avatar del padre

- [x] 7.1 Añadir `updateParentImage()` a `auth.repository.ts` y el error de subida inválida del módulo.
- [x] 7.2 En `auth.service.ts`, añadir `requestParentAvatarUploadUrl()` (clave
      `avatars/parents/{userId}/{uuid}.{ext}`) y `updateParentAvatar()` con las dos comprobaciones.
- [x] 7.3 Resolver el avatar del padre con `resolveAvatarForResponse()` en `listProfiles`,
      `enterParentProfile` y el estado de sesión, e **incluir `avatar` en el actor del padre**, que
      hoy no lo lleva (decisión 6).
- [x] 7.4 Añadir `POST /auth/avatar/upload-url` y `PATCH /auth/avatar` a `auth.routes.ts` con
      `requireParent`, y sus manejadores.
- [x] 7.5 Tests: el padre pide, sube y confirma su avatar, y aparece resuelto tanto en la rejilla como
      en `GET /auth/session` y al entrar al perfil; un niño pidiendo la URL recibe 403; confirmar la
      clave de otro padre da 422 aunque el objeto exista; el actor del padre incluye `avatar` incluso
      cuando nunca subió ninguno (el del catálogo por defecto).

## 8. Módulo `rewards`: foto del premio

- [x] 8.1 Extender el repositorio para escribir y leer `Reward.image`, y añadir el error de subida
      inválida del módulo con su mensaje.
- [x] 8.2 En `rewards.service.ts`, añadir `requestRewardImageUploadUrl()` con `ownedReward` primero y
      la clave `rewards/{rewardId}/{uuid}.{ext}`.
- [x] 8.3 Extender `updateReward()` con `imageUploadKey` (prefijo + `objectExists`) y con `null`
      explícito para borrar la foto. **`createReward()` no toca la imagen** (decisión 7). Pasar
      `toReward()`/`toRewardOffer()` a asíncronas resolviendo la foto y el avatar del hijo de cada
      oferta.
- [x] 8.4 Añadir `POST /rewards/:rewardId/image/upload-url` a `rewards.routes.ts` con `requireParent`
      y su manejador.
- [x] 8.5 Tests: subir y confirmar deja la foto visible en el catálogo del padre **y** en
      `GET /rewards/mine` del niño; `image: null` la borra y el premio sigue siendo válido; mandar una
      imagen en el alta da 422; un premio ajeno responde 404 al pedir la URL; un niño pidiéndola
      recibe 403; el escaparate con foto sigue sin filtrar el precio del hermano.

## 9. Módulo `tasks`: evidencia opcional

- [x] 9.1 Extender el repositorio para escribir `evidenceKey` al pasar de `PENDING` a `COMPLETED` y
      para devolverlo en las lecturas, y añadir el error de evidencia inválida con su mensaje.
- [x] 9.2 En `tasks.service.ts`, añadir `requestEvidenceUploadUrl()` con `ownTask` **y** la condición
      de que la tarea siga pendiente —conflicto si ya está marcada o aprobada—, con la clave
      `tasks/{taskId}/evidence/{uuid}.{ext}`.
- [x] 9.3 Extender `completeTask(actor, taskId, input)`: si viene `evidenceUploadKey`, comprobar
      prefijo y `objectExists` **antes** de la transición, de modo que un fallo deje la tarea
      pendiente. Resolver `evidence` en `toTask()`/`toOwnTask()`.
- [x] 9.4 Añadir `POST /tasks/:taskId/evidence/upload-url` (niño) a `tasks.routes.ts` y **añadir el
      `body` a la ruta de completar**, que hoy no valida ninguno.
- [x] 9.5 Tests de evidencia: completar sin evidencia funciona igual que hoy y deja la tarea sin ella;
      completar con evidencia la deja asociada y visible para el padre antes de resolver, y para el
      propio niño; una clave jamás subida da 422 y **la tarea sigue `PENDING`**; la clave de otra
      tarea da 422 aunque el objeto exista.
- [x] 9.6 Tests de permisos y estado: pedir URL sobre una tarea ya marcada o aprobada da 409; sobre la
      de un hermano da 404; un padre pidiéndola recibe 403; el doble tap de completar con evidencia
      sigue dando un 200 y un 409, con una sola evidencia guardada.

## 10. Front: subida directa y preparación de la imagen

- [x] 10.1 Añadir `browser-image-compression` y `react-easy-crop` a `apps/web/package.json`.
- [x] 10.2 Crear `apps/web/src/lib/s3-upload.ts` con `putToUploadUrl()`: un `fetch` PUT directo,
      **fuera de `apiFetch`**, con el comentario de por qué —URL absoluta, sin prefijo, sin cuerpo
      JSON que validar— y su propio error, no `ApiRequestError`.
- [x] 10.3 Crear `apps/web/src/features/uploads/prepare-image.ts` con `prepareImage()`: redimensiona y
      comprime al objetivo de `MAX_IMAGE_SIZE_MB`.
- [x] 10.4 Crear `apps/web/src/features/uploads/ImageUploadField.tsx`: con `aspect` monta el recorte,
      sin él solo comprime y previsualiza (decisión 10). No sabe de hijos, premios ni tareas: recibe
      por props cómo pedir la URL y qué hacer con la clave confirmada.
- [x] 10.5 Tests: `prepareImage` deja el blob por debajo del objetivo; `putToUploadUrl` usa `PUT` con
      el tipo correcto y una URL **sin** el prefijo de la API.

## 11. Front: cómo se pinta un avatar

- [x] 11.1 En `apps/web/src/features/auth/avatars.ts`, añadir `isAvatarUrl()` —ninguna clave del
      catálogo empieza por `http`—, manteniendo la promesa de su comentario de ser el único archivo a
      tocar.
- [x] 11.2 Crear `apps/web/src/features/auth/Avatar.tsx`: pinta la imagen si el valor es una URL y el
      emoji si es una clave del catálogo.
- [x] 11.3 Sustituir por `<Avatar>` los usos directos de `avatarGlyph()` fuera de `avatars.ts`
      (rejilla de perfiles, formulario de premios, listados de hijos, tareas y canjes).
- [x] 11.4 Extender el selector de avatar para ofrecer, junto a la rejilla del catálogo, subir una
      foto propia con `ImageUploadField` y `aspect={1}`, dejando que quien lo usa decida si manda
      `avatar` o `avatarUploadKey`.
- [x] 11.5 Tests de `<Avatar>` y `isAvatarUrl()`: una clave del catálogo pinta su emoji y **no** una
      imagen; una URL pinta una imagen con su texto alternativo y **no** un emoji; un valor vacío o
      desconocido cae al avatar por defecto en vez de dejar el hueco roto. Es la pieza que decide
      entre las dos formas de la decisión 4, así que la que más barato rompe en silencio.

## 12. Front: integración por pantalla

- [x] 12.1 Añadir al cliente de la API las llamadas de subida de los cuatro casos y extender las de
      actualizar hijo, actualizar avatar propio, editar premio y completar tarea.
- [x] 12.2 Cablear el selector extendido en el alta/edición de un hijo y en los ajustes del propio
      niño.
- [x] 12.3 Añadir al padre una pantalla —o una sección en la que ya tiene— donde cambiar su propio
      avatar, que hoy no existe en ninguna parte.
- [x] 12.4 Añadir la foto al editar un premio, con su vista previa si ya la tiene y la opción de
      quitarla, y mostrarla en el escaparate del niño.
- [x] 12.5 Añadir la evidencia opcional donde el niño marca una tarea como hecha, dejando claro que
      puede hacerlo sin foto.
- [x] 12.6 Mostrar la evidencia al padre en la bandeja de aprobación, antes de los botones de aprobar
      y rechazar.
- [x] 12.7 Añadir los textos nuevos a `messages.ts` y el caso de subida inválida a las funciones que
      traducen errores de cada módulo.
- [x] 12.8 Tests de cliente: las llamadas de subida salen del contrato sin campos de más; el
      formulario nunca manda `avatar` y `avatarUploadKey` a la vez; completar una tarea sin foto no
      manda `evidenceUploadKey`.

## 13. Soporte de storage en los tests

- [x] 13.1 Crear `apps/api/tests/support/storage.ts` con el cliente de test contra el bucket de
      pruebas, un `sembrarObjeto()` para colocar un objeto sin pasar por la URL firmada, y un
      `subirConUrlFirmada()` para los tests que quieren recorrer el flujo entero de verdad.
- [x] 13.2 Extender el arranque global de los tests: comprobar que el bucket de tests **no** es el de
      desarrollo —mismo guardián que ya existe para las bases de datos— y vaciarlo antes de la
      batería, creándolo si no existe.
- [x] 13.3 Registrar el proveedor de storage de test en el `setup` de Vitest, con el mismo patrón que
      `setPrismaForTests`.
- [x] 13.4 Confirmar que los tests de los bloques 6 a 9 corren contra MinIO real y no contra un doble
      (decisión 8).

## 14. Sembrado y cierre

- [x] 14.1 Dejar el sembrado con avatares del catálogo y documentar en `seed.ts` por qué no siembra
      imágenes: sembrar objetos exigiría que el almacén estuviera arriba, y el catálogo ya enseña el
      caso por defecto.
- [x] 14.2 Actualizar `openspec/config.yaml` con las rutas nuevas y con el patrón de subida.
- [x] 14.3 Documentar en `CLAUDE.md` el patrón completo —URL firmada, confirmación por el endpoint de
      dominio, las dos comprobaciones antes de persistir— y la regla de que `shared/storage` no conoce
      prefijos de negocio.
- [x] 14.4 Mencionar MinIO en el `README.md`, en el arranque y en la tabla de servicios.
- [x] 14.5 Pasar `db:generate`, `lint`, `typecheck` y `test` en verde desde `apps/api` —batería
      completa en segundo plano— y desde `apps/web`.
- [x] 14.6 Recorrido manual con `docker compose up` y `pnpm dev`: subir foto como padre y como hijo y
      verla en la rejilla y dentro de la sesión; ponerle foto a un premio y verla en el escaparate del
      niño; completar una tarea con foto y verla como padre antes de aprobar; completar otra sin foto
      y comprobar que funciona igual.
- [x] 14.7 Sincronizar las specs y archivar el change.

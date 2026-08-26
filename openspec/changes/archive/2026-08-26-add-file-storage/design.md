## Context

Ver `proposal.md` para la motivación. Lo que condiciona el diseño es lo que ya existe:

- **Tres de las cuatro columnas ya están.** `ChildProfile.avatar`, `User.image` y `Reward.image` son
  `String?` desde `add-data-model`. Solo `Task` no tiene dónde guardar una evidencia.
- **El avatar del padre se llama `image`, no `avatar`**, y solo lo lee y escribe `auth.repository.ts`.
  Además, `parentActorSchema` no lo expone: el padre ve su avatar en la rejilla y lo pierde al entrar.
- **La API solo entiende JSON.** `app.ts` monta `express.json({ limit: "1mb" })` y nada más: no hay
  multer, ni busboy, ni formidable en todo el monorepo.
- **`apiFetch` no sirve para hablar con S3.** Siempre antepone `API_PREFIX`, siempre fuerza
  `Content-Type: application/json`, y siempre parsea la respuesta con un esquema de Zod. Un `PUT`
  contra una URL absoluta que responde sin cuerpo falla las tres cosas.
- **El catálogo de avatares ya se escribió anticipando esto.** `avatars.ts` dice que la columna
  guarda la clave y no una URL, y que un avatar propio será «otra forma del mismo campo»;
  `avatarGlyph` dice que es el único archivo a tocar cuando haya ilustraciones de verdad. Las dos
  frases son el contrato que este change tiene que respetar.
- **No hay nada de storage instalado ni levantado**: ni SDK de AWS en la API, ni librería de imagen
  en el front, ni servicio S3-compatible en `docker-compose.yml`, que hoy solo trae PostgreSQL y
  Adminer.

## Goals / Non-Goals

**Goals:**

- Que subir una imagen no obligue a la API a tocar el binario, ni a crecer su límite de cuerpo, ni a
  ganar una dependencia de multipart.
- Que una clave de almacén guardada en la base sea siempre de quien dice ser, comprobado por el
  servidor y demostrado por un test, y no por confiar en lo que manda el cliente.
- Que el flujo entero —subir, confirmar, ver— se pueda ejecutar y probar en local sin una cuenta de
  AWS.
- Que quien ya eligió una nutria siga con su nutria sin que nadie migre nada.

**Non-Goals:**

- Servir las imágenes por CDN, cachearlas o transformarlas del lado del servidor.
- Garantizar que el almacén no acumule objetos huérfanos (ver Risks).
- Moderar o validar el contenido de lo que se sube más allá de su tipo y su tamaño.

## Decisions

### 1. URL firmada de `PUT` directo: el binario nunca pasa por la API

```
   Subir a través de la API              Subir con URL firmada
   ────────────────────────              ─────────────────────
   navegador --imagen--> API             navegador --pide URL--> API
                          |                          <--URL+key--
                     (en memoria)                            
                          |              navegador --imagen--> S3
                          v                          
                         S3              navegador --confirma key--> API
                                                              (HeadObject)
   límite de 1mb, multer,                la API solo mueve JSON pequeño
   la API carga el archivo               y firma; S3 recibe el binario
```

El cliente pide una URL al endpoint del módulo que corresponda, la API devuelve
`{ uploadUrl, key, expiresAt }` con la firma atada al `Content-Type`, el cliente hace `PUT` contra
esa URL, y después **confirma llamando al endpoint de dominio que ya existía** —`PATCH /children/:id`,
`PATCH /children/me`, `PATCH /auth/avatar`, `PATCH /rewards/:id`, `POST /tasks/:id/complete`— en vez
de a un endpoint nuevo de «confirmar subida».

**Atar la firma al tipo exige una opción explícita, y descubrirlo costó un test.** Pasar
`ContentType` dentro del `PutObjectCommand` NO basta: el firmante del SDK deja
`X-Amz-SignedHeaders: host`, la firma no cubre el tipo, y una URL emitida para una imagen acepta
subir cualquier cosa. Hay que pedirlo:

```ts
getSignedUrl(client, command, {
  expiresIn: UPLOAD_URL_TTL_SECONDS,
  signableHeaders: new Set(["content-type"]),
});
```

La primera implementación no lo llevaba y el test contra MinIO —el que la spec exige, «subir con un
tipo distinto del firmado»— lo cazó en la primera ejecución. Es exactamente el caso que un doble en
memoria habría dado por bueno, y la razón por la que la decisión 8 insiste en probar contra un
almacén de verdad.

**Alternativa descartada**: recibir el binario en la API con `multer`. Obligaría a subir el límite de
`express.json`, a meter una dependencia de multipart que el proyecto no tiene, y a que la API cargue
en memoria y reenvíe algo que S3 sabe recibir directo. La confirmación por el endpoint de dominio
existente también se eligió a conciencia frente a un `POST /uploads/:key/confirm` genérico: ese
endpoint tendría que saber qué significa cada clave y a qué fila pertenece, que es exactamente lo que
el módulo dueño ya sabe.

### 2. `shared/storage` no sabe de negocio; cada módulo es dueño de su clave y su autorización

```ts
export interface StorageProvider {
  createUploadUrl(params: { key: string; contentType: string }): Promise<{ uploadUrl: string; expiresAt: Date }>;
  createReadUrl(key: string): Promise<string>;
  objectExists(key: string): Promise<boolean>;
}
```

Recibe una clave ya decidida y no pregunta de dónde salió, igual que `applyCoinMovement` recibe una
transacción y no la abre. Quién puede subir qué, con qué prefijo, y si el recurso es suyo, lo decide
el servicio del módulo —`children`, `auth`, `rewards`, `tasks`— con el actor, como ya decide todo lo
demás.

**Alternativa descartada**: un módulo `uploads` con las cuatro rutas juntas. Tendría que conocer las
reglas de propiedad de tres módulos a la vez para saber si quien pide subir un avatar es el dueño de
ese perfil, y eso es justo la mezcla que la anatomía de módulo de `CLAUDE.md` separa.

### 3. La clave la genera el servidor, y se comprueba dos veces antes de guardarla

Las claves llevan el dueño dentro:

```
avatars/children/{childId}/{uuid}.{ext}
avatars/parents/{userId}/{uuid}.{ext}
rewards/{rewardId}/{uuid}.{ext}
tasks/{taskId}/evidence/{uuid}.{ext}
```

El cliente nunca la inventa: la recibe al pedir la URL y la devuelve igual al confirmar. Antes de
persistirla, el servicio comprueba **las dos cosas**:

1. Que empieza por el prefijo exacto del dueño autenticado —nunca el de otro—, porque si no, un padre
   podría confirmar sobre su hijo una clave que vio en la respuesta de otro recurso.
2. Que `objectExists()` —un `HeadObjectCommand`—, porque si no, una referencia rota se guardaría como
   si fuera una imagen y el front pediría una URL de lectura de algo que no está.

La primera sin la segunda deja huecos rotos; la segunda sin la primera deja que alguien apunte a una
imagen ajena que sí existe. Las dos viven en el módulo de dominio, no en `shared/storage`.

### 4. Dos campos de entrada excluyentes, una sola forma de lectura

**Entrada** (`updateChildSchema`, `updateOwnChildSchema`): `avatar` sigue siendo `avatarKeySchema`
—elegir del catálogo— y `avatarUploadKey` es nuevo —confirmar una foto propia—, con un `.refine()`
que rechaza mandar los dos a la vez.

**Lectura** (`childSchema`, `ownChildSchema`, `taskChildSchema`, `rewardOfferChildSchema`,
`parentActorSchema`): `avatarValueSchema = z.union([avatarKeySchema, z.string().url()])`. El front
recibe o una clave corta del catálogo, o una URL firmada lista para un `<img src>`, nunca una clave
cruda de almacén.

**Alternativa descartada**: un solo campo `avatar` de entrada que acepte también una clave de S3.
Relajaría el enum que hoy garantiza que un avatar de catálogo mandado a mano es uno de los doce, y
convertiría «elegir un bicho» y «confirmar mi foto» en la misma operación cuando son dos cosas
distintas con dos validaciones distintas.

### 5. `resolveAvatarForResponse()`, el único sitio que sabe distinguir clave de catálogo de clave de almacén

```ts
export async function resolveAvatarForResponse(
  storage: StorageProvider,
  value: string | null,
): Promise<AvatarValue> {
  if (isAvatarKey(value)) return value;
  if (value === null) return DEFAULT_AVATAR_KEY;
  return storage.createReadUrl(value);
}
```

Lo usan `children`, `auth`, `tasks` y `rewards` al serializar. Sin esto, la misma rama de tres líneas
se escribe cuatro veces y se despega a la primera reescritura. `Reward.image` y `Task.evidence` usan
la misma idea sin la parte de catálogo: `null` se queda en `null`, y una clave se firma.

La consecuencia es que `toChild()`, `toTask()`, `toReward()` y sus variantes propias pasan a ser
asíncronas. Es contagioso hacia arriba, y se acepta: la alternativa era que el front recibiera claves
crudas y supiera pedirlas él, que es peor por dos motivos —expone la estructura del bucket y obliga a
una segunda ida y vuelta por cada imagen de una lista—.

### 6. El avatar del padre vive en `auth`, y su actor pasa a llevarlo

`User.image` solo lo tocan hoy las consultas de `auth.repository.ts`, así que las rutas nuevas
—`POST /auth/avatar/upload-url` y `PATCH /auth/avatar`— van ahí y no a un módulo nuevo ni a
`children`, que es de los hijos.

Además se añade `avatar` a `parentActorSchema`, que hoy no lo tiene aunque `childActorSchema` sí. No
es adorno: hoy el padre elige su avatar en la rejilla, entra, y deja de verlo. Era un hueco real y se
arregla aquí porque es exactamente el mismo campo que este change viene a tocar.

### 7. El alta de un premio no lleva foto; se añade al editarlo

La clave de un premio es `rewards/{rewardId}/...`, y ese identificador no existe mientras se está
creando la fila. Publicar y luego editar para poner la foto es el mismo patrón que ya rige para el
avatar propio de un hijo, que se sube después de crear el perfil.

**Alternativa descartada**: una clave temporal (`rewards/pending/{uuid}/...`) que se mueva al bucket
definitivo al crear el premio. Añade un `CopyObject` y un estado intermedio que hay que limpiar si el
alta falla, para ahorrar un clic.

### 8. MinIO en `docker-compose.yml`, y tests contra él y no contra un doble

MinIO habla el mismo protocolo, así que el mismo `S3Client` sirve apuntándolo a otro `endpoint` —con
`forcePathStyle` cuando ese endpoint está puesto—. Se añaden el servicio `minio` y un `minio-init` de
un solo uso, con la imagen `mc`, que crea el bucket de desarrollo y el de tests y termina.

**Alternativa descartada**: mockear S3 en los tests. El proyecto ya cerró este debate para la base de
datos —«un doble en memoria no tiene restricciones, que es justo lo que hay que probar»— y aquí el
argumento es el mismo: lo que hay que probar es que una URL firmada caduca, que una firma atada a un
`Content-Type` rechaza otro, y que `HeadObject` responde 404 sobre lo que no existe. Un doble diría
que sí a todo.

### 9. Los TTL son constantes del código, no variables de entorno

Subida cinco minutos —es una ventana de trabajo, no algo que se guarda—; lectura una hora —para que
una pestaña abierta no se quede con las imágenes rotas antes del siguiente refetch—. Viven en
`shared/storage` porque no son un parámetro que cambie entre despliegues: si algún día uno de los dos
resulta equivocado, lo que hay que cambiar es el número, no la forma de configurarlo.

### 10. Recorte cuadrado solo para avatares

Un avatar se pinta pequeño y en una rejilla, así que encuadrarlo importa y el 1:1 es el encuadre. Una
foto de premio o una evidencia de tarea son lo contrario: recortarlas a cuadrado quita justo lo que el
padre necesita para decidir —el juguete entero, la cama hecha—. Se resuelve con **un solo componente**
(`ImageUploadField`) y una prop `aspect?`: con ella monta el recortador, sin ella solo comprime.

Librerías: `browser-image-compression` para redimensionar y comprimir, `react-easy-crop` para la
interacción de recorte. Las dos son pequeñas y sin dependencias pesadas, y el front hoy no tiene nada
parecido que reutilizar.

### Se difiere a un change posterior

- **Certificados e insignias de logro.** No reutiliza nada de aquí: no hay nadie subiendo un archivo,
  sino el servidor generando una imagen.
- **Borrar los objetos huérfanos** al reemplazar un avatar, retirar un premio o borrar una tarea.
- **Reemplazar o cancelar una evidencia ya subida** sin rechazar la tarea entera.
- **Aprovisionar el bucket real y su usuario IAM** de producción, que es trabajo de infraestructura y
  no de código.

## Risks / Trade-offs

**Una URL de lectura firmada de una hora funciona para cualquiera que la tenga, sin volver a
identificarse** → Se acepta. Es cómo funciona una URL firmada, y el bucket sigue siendo privado: sin
la firma no se ve nada. El contenido son fotos de familia dentro de la app de una casa, no datos que
justifiquen renovar la firma cada pocos minutos a cambio de imágenes que se rompen solas en una
pestaña abierta.

**El almacén crece con imágenes que ya nadie mira** → Se acepta a conciencia (ver «Se difiere»). Un
borrado sin transacción distribuida es siempre a mejor esfuerzo, y el coste de equivocarse borrando
—la foto de un premio que sigue vivo— es mayor que el de guardar de más con el volumen que este
producto tiene hoy.

**Serializar una lista firma una URL por imagen** → Se acepta. Firmar es una operación local de
cómputo, sin ida y vuelta a S3, así que una página de veinte premios no hace veinte peticiones de
red. Si alguna vez pesa, el sitio donde arreglarlo ya está centralizado en `resolveAvatarForResponse`.

**`toChild`/`toTask`/`toReward` pasan a ser asíncronas y eso se propaga hacia arriba** → Se acepta.
Es ruido mecánico en las firmas, no una complicación de diseño, y la alternativa —devolver claves
crudas y que el front las resuelva— expone la estructura del bucket y añade una ida y vuelta por
imagen.

**Nadie puede levantar el proyecto sin Docker** → Ya era así por PostgreSQL. MinIO no cambia el
requisito, solo añade un servicio al mismo `docker compose up`.

**Pasar a S3 real exige configuración del bucket que el código no puede hacer** → Se acepta, y se
documenta en `CLAUDE.md`. Son dos cosas que funcionan en MinIO y fallan en AWS, así que no se
descubren hasta desplegar: (1) el bucket necesita una regla **CORS** que permita `PUT` desde el
origen de la aplicación, porque el navegador sube directo; (2) la política IAM necesita
`s3:ListBucket` **sobre el bucket**, sin la cual `HeadObject` de una clave ausente responde 403 en
vez de 404 y `objectExists()` convierte un 422 legítimo en un 500. La segunda se descubrió sondeando
una credencial real, no revisando el código.

## Migration Plan

Una sola migración: `Task.evidenceKey String?`, nullable y sin valor por defecto. Es un `ADD COLUMN`
puro que no reescribe ninguna fila, pero hay que **revisar el SQL generado a mano** antes de darla por
buena: la advertencia de la sección 6 de `CLAUDE.md` sobre migraciones que recrean tablas y se llevan
por delante las restricciones `CHECK` aplica igual aquí, aunque esta migración no tenga motivo para
hacerlo.

El despliegue añade seis variables de entorno y un bucket. Revertir es retirar el commit y quitar la
columna: ningún otro módulo depende de datos escritos por este change, y los perfiles que sigan con
una clave de catálogo funcionan exactamente igual antes y después.

# Monedín — reglas de desarrollo

Documento vinculante. Lo que hay aquí no es estilo ni preferencia: es lo que este proyecto da por
resuelto. Saltarse cualquiera de estas reglas en un change posterior es una regresión, no una
decisión de diseño.

Se redactó al cerrar `setup-foundations`, sobre lo que quedó realmente construido.

---

## Rol asignado

Actúas como **desarrollador full stack senior** responsable del producto de punta a punta: modelo de
datos, API, front y despliegue.

Lo que eso significa en la práctica, y en orden de prioridad:

1. **Corrección antes que velocidad.** Es dinero de mentira, pero es la primera experiencia de un
   niño con el concepto de saldo. Una tarea que acredita dos veces o un canje que descuenta sin
   entregar rompe justo lo que el producto enseña.
2. **La regla se hace cumplir con una herramienta, no con la memoria.** Si una convención importa,
   tiene que fallar el lint, el typecheck o un test. Una convención que solo vive en un documento
   está muerta al tercer mes.
3. **Una sola fuente de verdad.** Antes de escribir una constante, un tipo o un mensaje, se busca
   dónde vive ya. Duplicar es la forma por defecto en que este proyecto se degrada.
4. **Decir lo que no se hizo.** Un change que entrega ocho de diez tareas y lo dice es útil. Uno que
   entrega ocho y da a entender diez, no.

---

## 1. Nada hardcodeado

### Configuración

`apps/api/src/config/` es el **único** lugar del proyecto que lee el entorno. Lo garantiza una regla
de ESLint (`no-restricted-properties` más `no-restricted-syntax`) que prohíbe `process.env` e
`import.meta.env` en todo el resto del código, incluida la desestructuración `const { env } = process`.

La excepción se declara en `apps/api/eslint.config.js` con `allowEnvAccess([...])`. Hoy hay una sola
entrada. Está prevista una segunda cuando llegue `prisma.config.ts` en `add-data-model`. **Una
tercera entrada es una señal de que algo se está haciendo mal.**

Para usar un valor de configuración:

```ts
import { getConfig } from "../config/index.js";

const { DATABASE_URL } = getConfig(); // ya validado, no hay que comprobarlo otra vez
```

Añadir una variable son tres pasos, y ninguno es opcional:

1. Declararla en `apps/api/src/config/env.schema.ts`.
2. Añadirla a `.env.example` con un valor de ejemplo **no sensible**.
3. Si es secreta, añadirla a `SECRET_ENV_KEYS` para que su valor nunca se imprima.

Hay un test que falla si el esquema y `.env.example` se desincronizan, en ambos sentidos.

La API **muere al arrancar** si la configuración es inválida, reportando todos los problemas de una
vez. No se añaden valores por defecto silenciosos para variables que en producción son obligatorias:
un valor por defecto que tapa una variable ausente es cómo se acaba apuntando a la base de datos
equivocada sin enterarse.

### Constantes de dominio

Viven en `packages/contracts/src/constants/domain.ts` y **solo ahí**. Rangos de edad, longitudes de
título, mínimos y máximos de monedas, tamaños de página, el prefijo de la API.

Si estás a punto de escribir un número con significado de negocio en un módulo, está mal. Impórtalo.

### Textos visibles al usuario

Dos catálogos, uno por app:

- `apps/api/src/shared/messages/index.ts`
- `apps/web/src/lib/messages.ts`

Ni un string visible incrustado en un módulo o en un componente. Cuando llegue un segundo idioma,
migrar un catálogo es mecánico; extraer textos repartidos por sesenta archivos no lo es.

---

## 2. Anatomía de módulo

Todo módulo de la API tiene exactamente esta forma. `apps/api/src/modules/health/` es la plantilla
ejecutable: existe con las cinco capas aunque su lógica sea de dos líneas, para que se copie.

```
modules/<name>/
  <name>.routes.ts       monta rutas. CERO lógica.
  <name>.controller.ts   parsea y serializa. CERO autorización.
  <name>.service.ts      reglas de negocio Y autorización.
  <name>.repository.ts   ÚNICO archivo que toca Prisma.
  <name>.errors.ts       errores de dominio del módulo.
```

Reglas que no se negocian:

- **El controlador nunca decide permisos.** Construye el actor desde la sesión y se lo pasa al
  servicio. Si en un controlador aparece un `if` sobre el rol o sobre la propiedad de un recurso,
  está en la capa equivocada.
- **Solo el repositorio importa el cliente de base de datos.** Ninguna otra capa. Lo garantiza una
  regla de ESLint (`no-restricted-imports`): importar el cliente desde una ruta, un controlador o un
  servicio no compila el lint. Los repositorios envuelven sus consultas en `withTranslatedErrors()`
  para que un choque de unicidad salga como 409 y no como 500.
- **El módulo no define su propio mapeo a HTTP.** Lanza errores de dominio y ya está.

### Patrón de actor

Todo método de servicio recibe el actor como **primer argumento**:

```ts
service.method(actor, dto);

type Actor =
  | { familyRole: "PARENT"; userId: string }
  | { familyRole: "CHILD"; childProfileId: string; parentId: string };
```

El tipo está en `apps/api/src/shared/actor.ts`, junto a `isParent()`, `isChild()` y
`owningParentId()`.

Es una **unión discriminada, no un objeto con campos opcionales**, porque el niño no tiene fila en
`User` y por tanto no tiene identificador de usuario. Con campos opcionales se podía construir un
actor de niño sin su perfil y compilaba.

Esto es lo que hace *cumplible* que la autorización viva en la capa de negocio: si el actor es un
parámetro obligatorio, no se puede escribir un servicio que ignore quién llama sin que se note al
leer la firma. Y un servicio invocado desde otro servicio o desde un job sigue comprobando permisos,
cosa que un middleware por ruta no haría.

`owningParentId(actor)` da el identificador del padre dueño de los datos: para un padre es él mismo,
para un niño el suyo. Es el valor con el que se filtra para no cruzar familias.

`health` es la **única** excepción del sistema: es público por definición y no recibe actor.

Las reglas de acceso del producto, que el servicio debe verificar:

- Un `PARENT` solo opera sobre entidades cuyo `parentId` es el suyo.
- Un `CHILD` solo opera sobre entidades cuyo `childId` es su propio perfil.
- Los niños nunca ven datos de sus hermanos.

**El niño no es un `User`.** `User` es exclusivamente el padre; el niño vive entero en
`ChildProfile`, con su nombre y su PIN. Por eso no hay columna de rol en la base de datos: valdría
siempre `PARENT`. `FamilyRole` existe como tipo de dominio y es lo que discrimina el actor.

---

## 3. Contrato de errores

Los servicios lanzan errores de dominio de `apps/api/src/shared/errors/domain-errors.ts`. **No saben
nada de HTTP.** Un único traductor al final de la cadena los convierte en respuesta.

| Error de dominio     | HTTP | Código             |
| -------------------- | ---- | ------------------ |
| `UnauthorizedError`  | 401  | `UNAUTHORIZED`     |
| `ForbiddenError`     | 403  | `FORBIDDEN`        |
| `NotFoundError`      | 404  | `NOT_FOUND`        |
| `RouteNotFoundError` | 404  | `ROUTE_NOT_FOUND`  |
| `ConflictError`      | 409  | `CONFLICT`         |
| `ValidationError`    | 422  | `VALIDATION_ERROR` |
| cualquier otro       | 500  | `INTERNAL_ERROR`   |

Toda respuesta de error, sin excepción, tiene esta forma:

```jsonc
{
  "code": "VALIDATION_ERROR", // estable, legible por máquina
  "message": "…", // español, puede reescribirse sin romper nada
  "details": [{ "field": "coins", "code": "too_small", "message": "…" }], // solo en 422
  "incidentId": "…" // solo en 500
}
```

- **El código es el contrato. El mensaje no.** El front decide qué hacer mirando `code`, nunca
  comparando texto.
- **El 500 no filtra nada**: ni trazas, ni SQL, ni rutas de archivos. El detalle completo va al log
  bajo el mismo `incidentId` que ve el usuario.
- **La validación va antes que la lógica**, con el middleware `validate()`, y reporta *todos* los
  campos inválidos de una vez, no el primero.

Un módulo nuevo hereda todo esto sin escribir una línea de mapeo.

---

## 4. Atomicidad e idempotencia

Estas dos reglas existen porque un niño con un teléfono lento **va a tocar dos veces**.

### Toda mutación de saldo es atómica

**No escribas tu propia versión de esto.** Existe una operación de referencia y todo módulo que
mueva monedas pasa por ella:

```ts
import { applyCoinMovement } from "../../shared/database/index.js";

await prisma.$transaction(async (tx) => {
  await applyCoinMovement(tx, { childId, amount: task.coins, reason: "TASK_APPROVED", taskId });
  // ...el resto de la unidad de trabajo, en la MISMA transacción
});
```

Recibe la transacción como primer argumento precisamente para que no se pueda llamar fuera de una.

**`applyCoinMovement` NO es idempotente**, y suponer lo contrario es el error caro de este proyecto.
Dos llamadas idénticas acreditan dos veces: hace exactamente lo que se le pide, tantas veces como se
le pida. Lo que impide el duplicado es que el segundo intento **no encuentre el estado de origen que
esperaba** — la transición condicional de más abajo—, nunca el libro mayor.

**La transacción interactiva vive en el repositorio**, porque el cliente no se puede importar fuera
de uno. La consecuencia es que la comprobación de «cuántas filas afectó» ocurre ahí, y que ahí se
lanza el error de dominio: devolver un `null` desde dentro de `$transaction` la confirmaría, y en el
caso de aprobar eso significa acreditar. El repositorio sigue sin saber de roles ni de pertenencia,
que es lo que el servicio comprueba **antes** de llamarlo.

`tasks.repository.approve()` es la plantilla, y el orden de sus tres pasos es la plantilla:

```ts
return withTranslatedErrors(() =>
  getPrisma().$transaction(async (tx) => {
    // 1. La transición, con el estado de ORIGEN en la condición.
    const affected = await tx.task.updateMany({
      where: { id: taskId, status: "COMPLETED" },
      data: { status: "APPROVED" },
    });
    if (affected.count !== 1) throw new TaskTransitionConflictError(); // deshace la transacción

    // 2. Y SOLO ENTONCES el dinero, en la misma transacción.
    await applyCoinMovement(tx, { childId, amount: coins, reason: "TASK_APPROVED", taskId });

    // 3. Lo que se devuelve, leído dentro.
    return tx.task.findUniqueOrThrow({ where: { id: taskId }, select: TASK_FIELDS });
  }),
);
```

Al revés —acreditar y después mirar el estado— el segundo toque de un doble tap paga antes de
descubrir que perdió la carrera. Read Committed basta: el `UPDATE` condicional toma un bloqueo de
fila, la segunda transacción espera y reevalúa el predicado sobre la versión ya confirmada. No hace
falta subir el aislamiento ni mapear `P2034`.

`ChildProfile.coins` es la fuente de verdad del saldo. Se modifica **siempre** con `increment` o
`decrement`, **nunca** leyendo, sumando en memoria y escribiendo: dos peticiones simultáneas con
lectura-modificación-escritura pierden una de las dos.

En la **misma transacción** se escribe la fila del historial. El historial es append-only: nunca se
edita ni se borra una fila. Lo garantiza un **disparador de PostgreSQL**, no la buena voluntad del
código: intentar un `UPDATE` o un `DELETE` sobre `coin_transactions` falla. Corregir un movimiento
equivocado se hace registrando otro que lo compense.

El saldo nunca es negativo, y también eso lo garantiza el motor con un `CHECK`.

### Toda transición de estado es condicional

Una transición se escribe como una actualización que incluye el estado de origen en su condición, y
después se **verifica que afectó exactamente una fila**. Si afectó cero, alguien ganó la carrera:
eso es `ConflictError`, no un éxito silencioso.

```
   Aprobar tarea, mal                     Aprobar tarea, bien
   ──────────────────                     ───────────────────
   leer tarea                             UPDATE ... WHERE id = ?
   si status == COMPLETED:                  AND status = 'COMPLETED'
     UPDATE status = APPROVED             si filas afectadas != 1 -> ConflictError
     UPDATE coins = coins + n             increment coins + fila de historial
                                          todo en una transacción
   dos taps -> acredita dos veces         dos taps -> el segundo da 409
```

En los canjes, **el saldo se valida dos veces**: al solicitar y otra vez al aprobar. Entre ambos
momentos el niño pudo gastar sus monedas.

Máquinas de estado, tal como las define el producto:

- **Tarea**: `PENDING → COMPLETED` (el niño la marca) `→ APPROVED` (el padre aprueba, **acredita**).
  Rechazar la devuelve a `PENDING`. Solo se edita en `PENDING`.
- **Canje**: `PENDING → APPROVED` (**descuenta**) o `→ REJECTED` (terminal, no devuelve nada, porque
  el descuento solo ocurre al aprobar).

### Reemplazo atómico de un conjunto de filas puente

Cuando una relación de muchos a muchos lleva un dato propio en la tabla puente —el precio de un
premio para cada hijo, en `RewardAssignment`— y el cliente decide de una vez **el conjunto entero**
que debe quedar vigente, la operación se escribe como `deleteMany` de las filas actuales seguido de
`createMany` de las nuevas, **en una única transacción**:

```ts
return getPrisma().$transaction(async (tx) => {
  await tx.rewardAssignment.deleteMany({ where: { rewardId } });
  if (assignments.length > 0) {
    await tx.rewardAssignment.createMany({ data: assignments.map(/* ... */) });
  }
  return tx.reward.findUniqueOrThrow({ where: { id: rewardId }, select: REWARD_FIELDS });
});
```

Y no un `upsert` por fila calculando la diferencia contra lo que había. Poner o quitar un hijo del
conjunto es **una sola decisión** de quien la toma, no una secuencia de altas y bajas que la interfaz
tiene que reconstruir comparando dos listas; y encadenar varias llamadas dejaría un estado a medias
visible si la segunda de tres fallara. La transacción es lo que hace que un conjunto rechazado —un
hijo ajeno entre los indicados— deje las filas **exactamente como estaban**, en vez de a medio borrar.

**Cuándo NO aplica**: en cuanto la fila puente tenga algo que conservar —un `createdAt` que alguien
lea, un historial propio, una fila que otra tabla referencie por clave ajena—, borrar y recrear deja
de ser inocuo y hay que volver al diff (leer lo que hay, calcular altas/bajas/cambios, escribir solo
eso). `RewardAssignment` puede permitírselo porque no lleva historial y ningún canje la referencia:
`RewardRedemption` congela su propio precio apuntando al premio y al hijo, no a la asignación. Ver la
decisión 3 del design de `add-rewards`.

---

## 5. Sesión y protección de rutas

**Las rutas nacen protegidas.** Se definen con `moduleRouter()`, que mete el guardián dentro de la
cadena de cada ruta. Definir una y olvidarse de protegerla no es posible:

```ts
const tasks = moduleRouter();

tasks.get("/tasks", requireParent, handleList);   // protegida, sin decir nada
tasks.publicGet("/health", handleHealth);         // pública, a conciencia
```

Solo hay dos rutas públicas en todo el sistema —la sonda de salud y el acceso— y cada una lo declara
en su propio router.

**Hay tres niveles de protección, no dos.** Además de público y protegido, una ruta puede
conformarse con la CUENTA acreditada sin exigir actor. La cookie de cuenta certifica que el
dispositivo pertenece a una familia; **no da actor por sí sola**. El actor —quién está operando,
padre o hijo— sale únicamente del perfil activo, una sesión aparte que cuelga de la de cuenta. Sin
perfil elegido, una ruta que exige actor responde 401 igual que si no hubiera sesión: es justo lo que
impide rodear la rejilla de selección de perfil llamando al endpoint directamente.

Una ruta de solo cuenta se declara con `accountGet`/`accountPost`, uno a uno como las públicas — no
es el criterio general:

```ts
auth.accountGet("/auth/profiles", handleListProfiles); // rejilla: cuenta acreditada, aún sin actor
auth.get("/tasks", requireParent, handleList);          // exige actor, como cualquier ruta normal
```

Hoy hay **cinco** rutas de solo cuenta, y la lista está escrita en un test (`account-only-routes`)
que falla si aparece una sexta: listar los perfiles, entrar a uno, salir a la rejilla, restablecer el
PIN de adulto con la contraseña, y **crear un perfil de hijo**. Las cuatro primeras son los pasos
previos a ser alguien —entrar a un perfil es lo que crea el actor, así que la ruta que lo hace no
puede exigirlo de antemano—. La quinta ocurre en la misma pantalla y por la misma razón: pedir el PIN
de adulto para añadir un hijo convierte la rejilla en un trámite, y una familia recién registrada se
quedaría sin salida.

Esta frase decía «tres» y ya eran cuatro: se olvidaba `/auth/profiles/leave`. Por eso ahora la lista
vive en un test y no solo aquí. Una convención que solo vive en un documento está muerta al tercer
mes, incluida esta.

**Solo cuenta NO significa sin autorización.** `POST /children` se conforma con la cookie de cuenta,
pero su servicio rechaza que la ejecute un perfil de niño activo: que la cookie alcance no quiere
decir que valga cualquiera que la traiga. Por eso ese servicio recibe, además del identificador de la
cuenta, quién está operando —si es que ya hay alguien—.

**El actor se obtiene del middleware, nunca se reconstruye.** El controlador lo lee y se lo pasa al
servicio:

```ts
export const handleList: RequestHandler = async (req, res) => {
  const tareas = await service.listTasks(actorOf(req), filtros);
  res.json(tareas);
};
```

`requireParent` y `requireChild` son filtros GRUESOS y **no autorizan nada**: que alguien tenga el
rol correcto no dice si el recurso es suyo. Eso lo sigue comprobando el servicio.

**Ningún módulo lee la tabla de sesiones.** Es del módulo `auth`, y la única pieza que la consulta
desde fuera es el middleware, a través del repositorio de `auth`.

**Las credenciales se hashean con `scrypt`** de `node:crypto`, en un formato que lleva dentro sus
propios parámetros para poder subirlos sin invalidar a nadie. El identificador de sesión se guarda
hasheado: leer la tabla entera no permite suplantar a nadie.

**Los bloqueos son por identidad, no por IP.** En una casa todos comparten IP.

---

## 6. Archivos e imágenes

**El binario nunca pasa por la API.** Subir una imagen son tres pasos, y ninguno mueve el archivo a
través de nuestro servidor:

```
1. el cliente pide       POST /<recurso>/<id>/<que>/upload-url  ->  { uploadUrl, key, expiresAt }
2. el cliente sube       PUT  directo al almacén, con la URL firmada
3. el cliente confirma   PATCH /<recurso>/<id>  con la MISMA key que recibió
```

El paso 3 usa el endpoint de dominio **que ya existía** para guardar esa referencia, no uno nuevo de
«confirmar subida»: ese tendría que saber qué significa cada clave y a qué fila pertenece, que es
justo lo que el módulo dueño ya sabe.

**Antes de guardar una clave se comprueban DOS cosas, y hacen falta las dos**:

```ts
if (!(await isConfirmableUpload(getStorageProvider(), key, prefijoDelDueño))) {
  throw new InvalidXUploadError(); // 422
}
```

Solo el prefijo deja guardar referencias a archivos que nunca se subieron. Solo la existencia deja
apuntar a la imagen de otro, que sí existe. `isConfirmableUpload` las hace juntas para que ninguna
se pueda olvidar; el **prefijo** lo decide cada módulo, porque «ser dueño de esto» es su política.

**`shared/storage` no sabe de negocio.** Recibe una clave ya decidida y firma, igual que
`applyCoinMovement` recibe una transacción y no la abre. Quién puede subir qué lo comprueba el
servicio del módulo con el actor, antes de llamar.

**La firma tiene que atar el tipo de contenido explícitamente.** Pasar `ContentType` en el comando NO
basta: el firmante deja `X-Amz-SignedHeaders: host` y una URL emitida para una imagen acepta subir
cualquier cosa. Hay que pedirlo con `signableHeaders: new Set(["content-type"])`. Lo cazó un test
contra MinIO, no una revisión.

**Lo que se guarda es la CLAVE, nunca una URL.** Las URLs de lectura se firman al serializar y
caducan; una guardada en la base estaría rota en una hora. `resolveAvatarForResponse()` es el único
sitio que traduce lo guardado a lo que sale por la respuesta —clave de catálogo tal cual, o URL
firmada—, y por eso los serializadores de los cuatro módulos son asíncronos.

**Los tests van contra MinIO real**, no contra un doble, por la misma razón que los de datos van
contra PostgreSQL: lo que hay que probar es que una firma rechaza otro tipo, que una URL caduca y que
`HeadObject` responde 404. Un doble diría que sí a todo.

Y van contra MinIO **siempre**, aunque desarrollo apunte al S3 real: su arranque VACÍA el bucket que
se le indique. Por eso `TEST_S3_ENDPOINT` es una variable aparte de `S3_ENDPOINT` y **no admite
vacío** —vacío es como se dice «el S3 de AWS»—, y por eso `testBucket()` comprueba dos cosas y no
una. Equivocarse ahí es la única forma de perder datos de verdad con este módulo.

### La política IAM necesita `s3:ListBucket`, y no es opcional

Sobre S3 real, `HeadObject` de una clave inexistente responde **403 y no 404** si el usuario no tiene
`s3:ListBucket` sobre el bucket: AWS no quiere revelar si un objeto existe a quien no puede listar.
Como `objectExists()` solo trata el 404 como «no está» y relanza lo demás, sin ese permiso **cada
confirmación de una foto ausente sería un 500 en vez de un 422**.

No se arregla ablandando `objectExists()`: devolver `false` ante un 403 haría pasar una política mal
puesta por «el usuario no subió la foto», que es justo lo que ese código evita a propósito. Se
arregla en la política:

```json
{ "Effect": "Allow", "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::EL-BUCKET" }
```

Fíjate en el ARN: **sin** `/*`, porque `ListBucket` es un permiso sobre el bucket y no sobre sus
objetos. MinIO responde 404 igualmente, así que esto solo se manifiesta al desplegar.

### Y el bucket necesita CORS

El navegador hace el `PUT` directo contra el almacén, así que es una petición de origen cruzado. MinIO
la acepta por defecto; S3 la rechaza sin una regla que permita `PUT` desde el origen de la aplicación
y `AllowedHeaders` que incluya `Content-Type` —que va dentro de la firma—.

---

### La batería de tests está aislada del almacén real por TRES vías

Esta sección decía dos. Eran dos, y la tercera faltaba.

La batería **vacía su bucket al arrancar**, así que el aislamiento respecto del almacén de la
aplicación se sostiene sobre tres separaciones, y hacen falta las tres:

1. **Bucket propio** (`TEST_S3_BUCKET_NAME`), distinto del de desarrollo. `testBucket()` lo comprueba.
2. **Endpoint propio** (`TEST_S3_ENDPOINT`), que **no admite vacío**, porque vacío es como se dice
   «el S3 de AWS».
3. **Credenciales propias** (`TEST_AWS_ACCESS_KEY_ID` y `TEST_AWS_SECRET_ACCESS_KEY`).

La tercera llegó tarde, en `split-test-storage-credentials`, y su ausencia se notó en cuanto alguien
hizo justo lo que la segunda contempla: al poner una llave de AWS de verdad en `AWS_ACCESS_KEY_ID`
para apuntar el desarrollo al S3 real, la batería siguió hablando con MinIO —el endpoint sí estaba
separado— pero con credenciales que MinIO rechaza, y **toda la suite murió con
`InvalidAccessKeyId`**.

Conviene quedarse con las dos mitades de esa historia. La que falló: compartir una variable entre dos
consumidores con necesidades opuestas se paga el día que uno de los dos cambia. La que funcionó: el
aislamiento **evitó el desastre**, porque los tests fueron a MinIO y se llevaron un 403 en vez de ir a
AWS y vaciar un bucket real.

Ninguna de las tres es redundante: cada una tapa un camino distinto, y basta que falte una para que
cambiar la configuración de desarrollo arrastre a los tests.

## 7. Base de datos

**Los invariantes viven en el motor**, no solo en el código. La migración inicial instala
restricciones `CHECK` (saldo no negativo, rangos de monedas y de edad) y un disparador que hace
inmutable el historial. La validación de entrada protege la puerta principal; esto protege todo lo
demás: una consulta a mano, una importación, un módulo futuro que use `update` en vez de `increment`.

**Un invariante de INTEGRIDAD va al motor; un límite de POLÍTICA que cuenta filas, no.** Saldo no
negativo y rangos son integridad: violarlos corrompe los datos, así que los impone PostgreSQL.
Cuántos hijos caben en una familia es política: excederlo no descuadra ningún saldo, y expresarlo en
SQL exigiría un disparador que cuenta en cada inserción. Ese vive en el servicio
(`MAX_CHILDREN_PER_FAMILY`) y responde 409. La consecuencia se acepta a conciencia: bajo Read
Committed, dos altas simultáneas en el último hueco pueden dejar la familia en uno más del tope.

**AVISO para cualquier migración que recree una tabla**: Prisma no conoce esas restricciones y una
migración generada automáticamente puede llevárselas por delante. El test de coherencia
(`tests/database/limits-sync.test.ts`) lo detecta, pero revísalo tú antes de dar la migración por
buena.

**Los límites se repiten en SQL.** Una migración es un artefacto congelado y no puede importar
constantes, así que los números de `@monedin/contracts` aparecen también en el SQL. Cambiar un
límite son tres pasos: editar la constante, escribir una migración que altere la restricción, y ver
pasar el test que compara ambos.

**El cliente generado no se versiona.** `pnpm db:generate` lo reconstruye en `apps/api/src/generated`
y las tareas de Turborepo lo encadenan a `build`, `typecheck` y `test`.

**Prisma 7 no se configura como Prisma 5 o 6.** La URL va en `prisma.config.ts`, el cliente necesita
un adaptador explícito, y el generador exige `moduleFormat = "esm"` e `importFileExtension = "js"`.
Sin esas dos opciones el proyecto compila, los tests pasan, y el proceso revienta al arrancar en
producción. Ver la decisión 6 del design de `add-data-model` antes de tocar nada de esto.

**El vigilante de la API mira solo `apps/api/src`**, con `node --watch` y no con el de `tsx`. Un
vigilante que mire `packages/contracts/dist` encadena un reinicio por cada archivo que reescribe
`tsc --watch` y acaba matando el proceso antes de que termine de arrancar. Si tocas un contrato,
reinicia `pnpm dev`.

**Los tests de datos corren contra PostgreSQL de verdad**, en una base separada de la de desarrollo,
con cada test dentro de una transacción que se deshace. Un doble en memoria no tiene restricciones,
que es justo lo que hay que probar.

---

## 8. Convenciones

### Rutas

Todo cuelga de `/api/v1`, que se importa de `@monedin/contracts` como `API_PREFIX` y no se escribe a
mano en ningún sitio. Una ruta sin el prefijo devuelve 404 con el cuerpo de error estándar.

En desarrollo, Vite hace proxy de ese prefijo hacia la API: un solo origen, sin CORS, y las cookies
de sesión se comportan igual que en producción detrás de Nginx.

### Idiomas

- **Inglés**: código, identificadores, tablas, endpoints, ramas y mensajes de commit.
- **Español**: todo lo que ve un usuario, y los artefactos de OpenSpec (proposals, designs, specs y
  tasks).
- Los comentarios de código, en español, y solo donde expliquen un *porqué* que el código no dice.

### Paginación

Los listados paginan por defecto: `DEFAULT_PAGE_SIZE = 20`, `MAX_PAGE_SIZE = 100`, ambos en
`@monedin/contracts`. Un endpoint de listado sin paginación es un endpoint sin terminar.

El patrón lo estrena `GET /children` y es el que copian los listados siguientes:

- `paginationQuerySchema` valida `page` y `pageSize` con `z.coerce`, porque la query llega como
  cadena. Un `pageSize` por encima del máximo es **422, no un recorte silencioso**: recortar esconde
  el error de quien llama, que pide 500, recibe 100 y cree que hay 100.
- La respuesta es `{ items, page, pageSize, total, totalPages }`, con los metadatos en el cuerpo y no
  en cabeceras, porque el front valida cada respuesta con Zod y una cabecera quedaría fuera del
  contrato. `totalPages` nunca es 0.
- La aritmética vive solo en `shared/pagination.ts`: el servicio habla de página y tamaño, el
  repositorio de `skip`/`take`, y ningún repositorio hace cuentas con entrada de usuario.
- El repositorio **cuenta y lee en la misma transacción** —si no, un alta concurrente entre las dos
  consultas deja `total` e `items` contradiciéndose— y su `orderBy` **incluye el identificador como
  desempate**. Sin desempate, dos filas creadas en el mismo milisegundo pueden salir en dos páginas o
  en ninguna: es el bug clásico de la paginación por desplazamiento.
- Una página posterior a la última devuelve lista vacía, no 404.

`GET /auth/profiles` es la excepción declarada: la rejilla es el conjunto entero de una familia, y
paginar un «¿quién eres?» no significa nada.

**Cuando la unidad de la lista es un grupo, se pagina por el grupo.** `GET /tasks` devuelve repartos,
así que el `skip`/`take` se aplica a los identificadores de reparto y no a las filas, en dos
consultas dentro de la misma transacción: primero qué grupos entran, después todas las filas de esos
grupos. Paginar filas y agrupar después es una línea menos y produce grupos truncados en cada
frontera de página. El desempate del orden es el identificador del grupo, por la misma razón de
siempre.

### TypeScript

`strict` más `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` y `verbatimModuleSyntax`, desde
`@monedin/config`. Nada de `any`, nada de `@ts-ignore`. Si un tipo estorba, casi siempre es que el
diseño está pidiendo otra forma.

Toda la monorepo es ESM (`"type": "module"`). Los imports relativos llevan extensión `.js`, que es lo
que exige Node en ESM aunque el archivo fuente sea `.ts`. Está verificado que Prisma funciona así;
ver la decisión 11 del design de `setup-foundations` antes de tocar la configuración de Prisma.

---

### El front

Desde `add-design-system`, el front tiene sistema de diseño y **ya no se escribe estilo a mano**.

- **`apps/web/src/styles/tokens.css` es la fuente única** de todo color, medida, radio, sombra y
  duración, igual que `constants/domain.ts` lo es de los límites de negocio. Tres capas, y un
  componente solo puede usar la de en medio —los tokens semánticos, `--color-coin` y no
  `--mnd-amber-400`—. La capa de primitivos vive **fuera de `@theme`** a propósito: así Tailwind no
  genera utilidades con ella y saltarse la regla no es posible, no solo desaconsejado.
- **Las piezas viven en `apps/web/src/ui/`** y **no importan nada de `features/` ni de `api/`**. Por
  eso se prueban sin servidor y el catálogo vivo no necesita proveedores. Hay un test que lo
  comprueba.
- **Tres reglas lo hacen cumplible**: ESLint prohíbe el prop `style` —con `allowInlineStyles()` para
  la excepción declarada, hoy solo `ProgressBar`, cuyo ancho depende del saldo de un niño—, y dos
  tests cazan colores literales y valores arbitrarios de Tailwind.
- **La doble escala es un atributo, no una prop**: `data-scale="child" | "parent"` en el contenedor.
  Si aparecen dos piezas cuya única diferencia es la audiencia, es un defecto.
- **El catálogo vivo está en `ui.html`**, un punto de entrada aparte que no se compila en producción.
  `pnpm dev` y `http://localhost:5173/ui.html`. Una pieza nueva sin entrada en el catálogo falla un
  test.
- **La tipografía la entrega el proyecto, no el dispositivo.** Desde `add-brand-typography`,
  `--font-sans` empieza por **Nunito variable, autoalojada** con `@fontsource-variable/nunito`. No es
  un CDN: en ejecución no sale nada a la red, y **ninguna petición del front va a un tercero**. Antes
  era solo una pila del sistema, así que la marca salía redondeada en Apple y no en Windows ni en
  Android —la tablet compartida, que es el escenario más probable—. La pila se queda **detrás** como
  respaldo y no es decorativa: sin ella, un fallo de carga da la serif por defecto del navegador.
  Tres tests lo sostienen: que la primera familia no sea del dispositivo, que esa familia esté
  importada en `tokens.css`, y que detrás quede respaldo acabado en genérica. Cambiar de familia
  algún día es legítimo; volver a una pila del sistema, no.
- **Las cantidades se dibujan con `Coins`, y `Coins` pide cifras tabulares** para que una columna de
  saldos alinee. Va en la pieza y **no** en `body`: alinear cifras es correcto en una columna de
  números e incorrecto en un texto corrido. Hoy no cambia nada de lo que se ve —Nunito ya trae cifras
  de ancho fijo—, y ese es justo el motivo de declararlo: deja de depender de qué familia gane.
- **Deuda declarada con fecha de caducidad**: quedan pantallas de `features/` con estilos en línea y
  colores a mano, exceptuadas en dos listas —en `apps/web/eslint.config.js` y en
  `tests/ui/style-rules.test.ts`—. Cada change de rediseño **borra su entrada**. Una entrada que siga
  ahí sin change que la reclame es que alguien se saltó el plan. **`routes/` ya no está en esas
  listas** desde `redesign-parent-home`, que vistió `account.tsx`, la última con estilo en línea: un
  archivo de ruta monta el destino y no lo dibuja, así que ese directorio no debería volver a
  aparecer ahí. Desde `redesign-parent-inbox` quedan **ocho** entradas: las dos bandejas del padre
  salieron juntas.

**Un test que no falla ante la violación que persigue no prueba nada.** Comprobar que las etiquetas
de tres estados están en pantalla no comprueba que se distingan: con el mismo tono en los tres, ese
test sigue en verde. Por eso la tarea de **inyectar la violación** no es ceremonia — en
`redesign-child-shop` cazó un test que habría entrado al repositorio dando una garantía que no daba.

Y volvió a cazar uno en `redesign-parent-home`, esta vez con la lección ya escrita aquí arriba: el
caso de prueba no basta con que sea el escenario correcto, tiene que **dar un número distinto para
cada respuesta equivocada**. El test contaba tareas por aprobar en un reparto de estados mezclados
—una `PENDING`, una `COMPLETED`, una `APPROVED`—, que es el escenario que la spec pide; pero la
respuesta correcta era `1` y la cuenta equivocada por repartos también daba `1`, así que pasaba con
el defecto puesto. Con **dos** completadas las tres cuentas dan 1, 3 y 2, y ahí sí distingue. Elegir
un caso donde lo correcto y lo incorrecto coinciden es la forma silenciosa de este error.

**Una cuenta sobre un listado que pagina por GRUPO no se lee de su `total`.** `GET /tasks` pagina por
reparto y, al filtrar por estado, devuelve el reparto **entero** —las dos cosas a propósito—. Así que
`total` cuenta repartos y las filas recibidas vienen sin filtrar: un reparto con dos hermanos
esperando y uno sin hacer nada da `1` por `total`, `3` por filas y `2` de verdad. Se cuentan las filas
con el estado buscado. `GET /redemptions` sí pagina por fila y su `total` sí es la cifra; que dos
cuentas del mismo panel se obtengan de dos maneras **no es una incoherencia que unificar**, es que
las dos listas tienen unidades distintas porque sus pantallas las tienen.

**Una acción irreversible se confirma con `Dialog`, y la ceremonia se mide contra lo que cuesta
deshacerla.** Hasta `redesign-parent-children` estaba al revés: retirar un premio —que se revierte
publicándolo otra vez— abría un diálogo, y dar de baja un perfil —que NO se deshace— preguntaba con
un párrafo y dos botones sueltos dentro de la fila, a un toque de la fila del hijo de al lado en una
tablet que se usa con el dedo.

**Un hijo se edita en su ruta y un premio en línea, y NO es una incoherencia.** Son dos gestos de
tamaño distinto: editar un premio es subir un precio o cambiar una foto y cabe en la tarjeta que ya
se ve; editar un hijo es nombre, edad y avatar, y es un formulario entero. Lo incoherente sería que
el mismo tipo de edición se hiciera de dos maneras. **Cerrado**: no se reabre sin un argumento nuevo
sobre el tamaño de cada edición.

**Reescribir un requisito es ARRASTRAR sus escenarios, no volver a redactar los que el argumento
nuevo necesita.** `openspec archive` rechaza un bloque `MODIFIED` que se deje fuera un escenario que
la spec vigente sí tiene, y ya lo ha hecho dos veces —en `pin-sidebar-on-desktop` y en
`redesign-parent-authoring`—. La herramienta impide que se pierdan en silencio; el hábito de mirar la
spec actual antes de reescribir un requisito, no.

**Una regla que se comprueba por su NOMBRE está a un sinónimo de morirse.** `add-app-shell` prohibió
que una pantalla reciba una función para cerrarse y dejó un test que buscaba `onDone`. Al enumerar
las props de `features/` en `redesign-parent-authoring` no había **ni un** `onDone` en el proyecto —y
sí `onCancel` en cinco archivos, `onSettled` y `onClose`—. El test perseguía el único nombre que nadie
usaba. Ahora está **invertido**: una prop callback declarada sin argumentos solo puede llamarse como
diga `EVENTOS_DE_DOMINIO` —hoy solo `onSaved`—, así que un sinónimo nuevo falla por defecto. Lo que
lleva argumento no aplica: `onUploaded(key)` es dominio por construcción y `onOpenChange(open)` es la
forma correcta de una revelación, la que ya usan `Dialog` y `Drawer`.

**Para salir de un formulario, un HUECO con un enlace dentro.** `ChildForm` se usa desde dos sitios
que cancelan a destinos distintos, así que no puede navegar solo ni recibir un callback: recibe
`cancel: ReactNode`, igual que `Pagination` recibe sus enlaces. Navegar vuelve a ser trabajo de un
enlace.

**Elegir «a quién y por cuánto» es UNA pieza**, `ChildrenPicker`. Estaba escrito tres veces —entero en
las dos altas y otra vez en el catálogo— y devuelve ya la forma que el contrato espera, o `null` si
falta algo, que es lo que permite decir QUÉ falta antes de rechazar. Vive en `features/children/` y no
en `ui/`: sabe qué es un hijo.

**Una pantalla donde se escribe es un `<form>`.** `TaskForm` y `RewardForm` eran un `<section>` con un
`type="button"`, así que escribir el título y pulsar Enter no hacía nada — y `ChildForm` sí lo hacía,
o sea que la misma tecla respondía distinto según la pantalla.

**Quién marca el destino activo es el `Link`, y solo él.** El router pone `aria-current="page"` y
`data-status="active"` por su cuenta según `activeOptions`; escribirlos ADEMÁS a mano da dos fuentes
para el mismo hecho, y la de fuera puede separarse de la del router sin que falle nada. El aspecto se
declara con `data-[status=active]:`, que es lo que ya hacían las dos barras que `add-sidebar-nav`
retiró. Lo destapó inyectar la violación: al quitar el `aria-current` escrito a mano **el test siguió
en verde**, porque quien lo ponía de verdad era el enlace.

**Cuando hay ancho, la navegación va delante; cuando no, detrás de su botón.** Desde
`pin-sidebar-on-desktop` el lateral es una columna fija a partir de `lg`, contraíble a solo iconos, y
un cajón por debajo. Se monta **UNA** de las dos formas y nunca las dos con una escondida por CSS:
dos listas de destinos son dos para quien recorre el documento con teclado aunque una no se vea, y
`display:none` dejaría la garantía dependiendo de una utilidad que ningún test puede comprobar —jsdom
no aplica CSS—. Lo decide `useIsWide()` con `matchMedia`, leído de forma **síncrona** al inicializar
el estado para que el primer pintado ya sea el correcto.

**Al contraer, el texto se oculta a la vista y NO se borra.** Los iconos de navegación son
decorativos a propósito —lo que nombra al destino es su texto—, así que borrarlo deja los cinco
destinos sin nombre de golpe. Y un control que solo dibuja una flecha lleva su nombre en
`aria-label`, que cambia con el estado porque lo que el botón hace cambia.

**El perfil es la ÚNICA excepción declarada a «ningún destino dos veces»**: el avatar de la cabecera
y la fila del pie del lateral llevan al mismo sitio. El avatar responde además a quién está usando el
dispositivo —pregunta real en una tablet compartida— y la fila existe porque un destino que solo se
alcanza pulsando una foto sin texto no se encuentra. El test la comprueba **por su nombre y con cifra
exacta**, para que sea una y no una puerta abierta; y la comprueba en ANCHO, porque con el cajón
abierto Radix marca el resto del documento como oculto y los dos caminos no coexisten en el árbol de
accesibilidad.

**La navegación de un perfil es UNA sola, y está entera.** Desde `add-sidebar-nav` los dos marcos
comparten un cajón lateral con todos los destinos del rol. Antes había dos barras distintas —arriba
el padre, abajo el niño— y, en las dos, un destino que NO estaba en ellas y colgaba del avatar de la
cabecera. Un test enumera los destinos de cada rol y comprueba que ninguno aparece dos veces en el
marco: es lo que impide que vuelvan las dos navegaciones.

**Abrir un cajón es una revelación, no un destino, y va en `useState`.** No contradice «la navegación
es del router»: esa regla habla de qué PANTALLA se enseña. La prueba está en compararlo con
`?manage=true`, que sí fue a la dirección — aquel tenía que **sobrevivir** a una navegación y este
tiene que **morir** con ella. Y se cierra al cambiar la DIRECCIÓN, no en el `onClick` de cada enlace:
el botón atrás también cambia la dirección, y un panel abierto tapando la pantalla a la que se acaba
de volver es peor que no tenerlo.

**Un 409 se cuenta como ADVERTENCIA, no como error.** `Alert` lo declara desde `add-design-system`
—«nadie hizo nada mal: el padre aprobó dos veces, o el hermano llegó antes»— y hasta
`redesign-parent-inbox` esa distinción no llegaba a ninguna pantalla: las dos bandejas del padre, que
son las **únicas** que producen un 409 de verdad, aplanaban todos sus errores en el mismo párrafo
rojo. La API está construida entera alrededor de esa diferencia y la interfaz la tiraba. Lo decide
`alertToneFor(error)`, en `lib/` y no en `ui/` porque mira el CÓDIGO de un error y una pieza no sabe
de eso.

**Un filtro que vive en la dirección es un conjunto de ENLACES, no de pestañas.** `Tabs` prometía en
su cabecera que la estrenarían los filtros por estado del padre. Al ir a usarla no encajaba, y no por
un detalle: `Tabs` posee su contenido y cambia por callback, mientras que el filtro es una sola lista
que se vuelve a pedir con otro parámetro. Usarla habría creado cuatro paneles para una lista y
convertido cuatro enlaces en botones, perdiendo abrirlos en otra pestaña. La salida es la que ya
existía para `buttonClasses`: la pieza **exporta su aspecto** —`tabLinkClasses`— y el control sigue
siendo un enlace. Y la cabecera se corrigió: **una afirmación falsa dentro de una pieza es peor que
ninguna**, porque manda al siguiente que la lea a usarla donde no encaja.

**Una pieza del sistema recibe sus enlaces, no los construye.** `ui/Pagination` toma `previous` y
`next` como contenido. Es la misma frontera que le impide importar de `features/` o de `api/`: lo que
la hace montable en un test sin proveedores y en `ui.html` sin aplicación. Una paginación que hiciera
sus propios `<Link>` necesitaría saber a qué ruta pertenece, que es justo lo que la pieza no puede
saber. Quien la usa pone los enlaces, porque es quien sabe a dónde van.

**Una decisión de producto que no se explica en pantalla es indistinguible de un defecto.** Un
reparto filtrado por estado se enseña ENTERO —a propósito—, y hasta `redesign-parent-inbox` eso solo
estaba dicho en un comentario del código: filtrar por «Por aprobar» y ver tareas pendientes se leía
como un filtro roto. Ahora lo dice la pantalla, y solo cuando hay filtro.

**Al probar una pantalla que carga, se espera a la LISTA y no al título.** El título, el filtro y la
nota se pintan antes de que llegue la respuesta, así que esperar a uno de ellos deja comprobando
sobre un esqueleto. Dos tests de `redesign-parent-inbox` cayeron por esto, los dos por lo mismo.

**Cerrar sesión y cambiar de perfil no son gemelas, y no van juntas.** Cambiar de perfil devuelve a
la rejilla, ocurre varias veces al día y no pide credenciales para volver; cerrar sesión obliga a
teclear correo y contraseña. Desde `redesign-parent-home` viven en pantallas distintas —salir del
perfil en el inicio, cerrar sesión en `/account`—, porque ponerlas del mismo tamaño y una al lado de
la otra es cómo un padre acaba tecleando su contraseña cuando solo quería pasarle la tablet a su
hijo.

**Un control nativo puede imponer su medida a lo que lo rodea.** Un `input[type=file]` pide unos
360 px de ancho mínimo intrínseco y, en una rejilla —donde el mínimo por defecto es `auto`—, arrastra
a su columna. Dos pantallas del niño desbordaban por él **sin tenerlo en su propio código**. Desde
`redesign-child-tasks` el control va absoluto y a opacidad cero **cubriendo su etiqueta**: fuera del
flujo, así que no aporta ancho, y con su caja de foco encima de lo que se ve, así que el
`:focus-visible` del sistema sirve tal cual. Ocultarlo con `sr-only` NO vale: se llega tabulando y no
se ve nada.

**Un archivo de ruta monta el destino, no lo dibuja.** Desde `redesign-child-home`, elegir por rol
sigue siendo legítimo —el destino es el mismo y quien lo abre no— pero lo elegido vive en
`features/`. Una pantalla dentro de un archivo de ruta no se prueba sin router, no se reutiliza, y
crece hasta que nadie recuerda que ese archivo era una ruta.

**Mudar un archivo a una carpeta ESTRECHADA lo deja fuera de su excepción.** Las listas de deuda ya
no tapan directorios enteros, sino archivos nombrados, así que al mover código sin vestir a
`features/auth/` el lint lo caza. Cuando los estilos se traducen uno a uno a utilidades —`mt-4` por
`marginTop: "1rem"`— **traducir no es vestir**: no hay color, radio ni decisión visual, y la deuda no
engorda con código que solo cambió de sitio.

**La navegación es del router, no del estado.** Desde `add-app-shell`, cada destino tiene su
dirección y ningún componente de `features/` decide con `useState` qué pantalla enseñar. Dos tests lo
impiden: uno falla ante un prop `onDone` —«ciérrame», que empuja la navegación a quien llama— y otro
ante una unión de vistas. Un evento de dominio como `onSaved` —«esto ocurrió»— sí es legítimo: el
mismo formulario se usa desde dos sitios que navegan a destinos distintos.

**Un modo de pantalla que tiene que sobrevivir a una navegación va en la DIRECCIÓN.** Desde
`redesign-profile-grid`, el modo «administrar» de la rejilla es `?manage=true` y no un `useState`.
Las tres razones, en orden de peso: la intención **cruza** hasta el teclado de PIN, que es donde hace
falta para decidir el destino; el botón atrás sale del modo y no de la aplicación; y recargar lo
conserva. Apagado se escribe como **ausencia del parámetro**, no como `false`: un valor que solo dice
«lo de siempre» es ruido en la barra. Y nada de `z.coerce.boolean()`, que convierte `"false"` en
`true`.

**Editar un perfil desde la rejilla exige el PIN de ESE perfil**, y el destino lo decide la guarda a
partir del rol de la sesión —`/account` o `/me/settings`—, nunca lo que pida la dirección. Las dos
rutas de perfiles usan `requireProfileChoice`: si la rejilla admitiera un perfil ya activo, el lápiz
sobre otro perfil aterrizaría en los ajustes del que está dentro **sin pedir ningún PIN**. Pasó, y lo
cazó abrir la aplicación.

**Las guardas van en `beforeLoad`, no en un componente.** Deciden ANTES de pintar, así que redirigen
en vez de enseñar otra cosa bajo una dirección que no corresponde. Con una consecuencia que hay que
saber: **solo corren al entrar en una ruta**. Cuando la sesión cambia sin que cambie la dirección
—entrar a un perfil, salir, cerrar sesión—, quien la invalida tiene que invalidar también el router,
y eso lo hace `useRefreshSession()` en un solo sitio. Navegar desde el `onSuccess` de cada mutación
NO funciona: al cambiar la sesión, la raíz cambia de marco y desmonta el componente que llamó a
`mutate`.

**Sin sesión se va a la PUERTA PÚBLICA**, `/welcome`, y no al formulario de acceso. Es una constante
en `guards.ts`, no una excepción por ruta: quien llega sin sesión puede no conocer el producto, y un
formulario no se lo explica. Desde ahí se llega a `/sign-in`, que sigue existiendo — y **ese camino es
crítico**, porque es el único que le queda a quien ya es usuario y se le caducó la sesión.

**Navegar es trabajo de un enlace.** Un `<Link>` envolviendo un `<Button>` anida dos elementos
interactivos y se anuncia como «enlace que contiene un botón». Para que un enlace se vea como un
botón está `buttonClasses(variant, block)`, que exporta `ui/Button.tsx`. Se cayó dos veces en esto
antes de extraerlo.

**El rol equivocado redirige en silencio.** Un niño que abre una dirección del padre aterriza en su
inicio, sin mensaje: a los siete años «no tienes permiso» se lee como «hiciste algo mal». Es
interfaz, no seguridad — la guarda de verdad sigue siendo el 401 o el 403 del servidor.

**Entrar y registrarse son DOS destinos**, `/sign-in` y `/sign-up`, desde `redesign-access`. Eran uno
con `useState<"signIn" | "signUp">` —estado haciendo de router, que es lo que `add-app-shell` retiró
de quince componentes— y se escapaba de los dos tests que lo impiden porque buscan
`useState<Vista|View>`. Su consecuencia: «Empezar» en la puerta pública abría el formulario de
ENTRAR. Cuando dos formularios tienen campos y validación distintos, son dos rutas; un parámetro de
búsqueda sería el mismo `if` con otro sitio donde vivir.

**Un formulario dice lo que exige ANTES de rechazarlo**, y el número sale de la constante del
contrato, nunca escrito a mano: tenerlo en dos sitios acaba con uno de los dos mintiendo. Y cuando se
piden dos credenciales en la misma pantalla, se explica para qué sirve cada una — si no, parece un
error del producto.

**El acceso va en ÍNDIGO PROFUNDO, y el ámbar es el acento.** Es la única pantalla del producto que
mira un adulto: la calidez le corresponde al niño —su inicio, sus tareas, sus premios— y en la puerta
se lee como juguete justo donde alguien decide si esto es de fiar. El ámbar no desaparece, cambia de
papel: pintando media pantalla no decía nada, y sobre índigo un punto ámbar **es dinero**. La
rejilla, el PIN y la puerta pública siguen claros.

**Los neutros y las superficies se reasignan por SUPERFICIE, igual que los tamaños por audiencia.**
`[data-surface="brand"]` cambia el valor de la tinta, los bordes, las sombras **y
`--color-surface-raised`**. Esto último no es un detalle: sobre un fondo oscuro no basta con invertir
la tinta, porque un campo blanco acabaría con texto claro dentro. Reasignando también la superficie,
el campo pasa a ser oscuro y `Input` y `Field` componen solos.

**Y hace falta el camino de vuelta.** Un componente que pinta su propio fondo claro —`Alert`— es una
superficie clara esté donde esté, y lo declara con `[data-surface="default"]`. Sin eso, dentro del
acceso su cuerpo salía blanco sobre azul claro. Lo declara **el componente que pinta el fondo**, no
la pantalla que lo coloca.

**Una utilidad de color resuelve el token DONDE se escribe, no donde acaba el píxel.** Poner
`text-ink` en el contenedor de fuera y esperar que un bloque interior con otra superficie lo resuelva
distinto no funciona: el color ya resuelto se hereda. Si un bloque cambia de superficie, declara su
tinta él mismo.

**Un color de superficie necesita RAMPA, no un valor.** Pasos oscuros para pintar y claros para lo
que va encima, en la capa 1 —que no genera utilidades—, y solo se llega a ellos por semánticos que
dicen para qué sirven: `--color-brand-deep` para el pie de un degradado, `--color-brand-line` para lo
que se dibuja encima y `--color-brand-soft` para lo que solo se insinúa.

**La acción principal no compite con su fondo**, ni vibrando contra él ni desapareciendo en él. Para
eso está la variante `contrast` de `Button`, que como las otras se nombra por el **papel** y no por
el color — y esa decisión ya se cobró: pasó de tinta oscura a ámbar al cambiar la superficie, sin
tocar su nombre ni un solo punto de uso.

**Al tocar tokens hay que abrir pantallas del padre y del niño para confirmar que no se enteraron**,
porque eso no lo cubre ningún test.

**Una pieza declara sus variantes; no se le imponen con clases.** `cx` no es `twMerge` —lo dice su
propio comentario— así que dos utilidades del mismo grupo las resuelve el orden del CSS generado, no
el del código: un fallo que no se ve leyendo y que no tiene por qué ser estable entre compilaciones.
Por eso la forma de `Avatar` es una prop (`shape`) y no un `rounded-*` pasado desde la rejilla.

**Una animación de realce va bajo `motion-safe:`, no bajo una duración corta.** El bloque de
movimiento reducido del sistema pone las duraciones a 1 ms, y eso convierte un crecimiento suave en
un salto instantáneo — peor para quien pidió no ver movimiento, no mejor. La regla completa: el
movimiento se envuelve en `motion-safe:` y **siempre** queda un realce que no es movimiento —color—
encendido en los dos casos, para que el elemento nunca deje de responder. De regalo, Tailwind añade
`@media (hover:hover)`, así que en la tablet táctil una tesela no se queda pegada tras un toque.

**Decisión cerrada: el saldo NO se ve en la rejilla de perfiles.** Se propuso en
`polish-profile-tiles` y se descartó. No es una limitación técnica: `GET /auth/profiles` no lo
devuelve porque `profile-selection` exige que un perfil se identifique «por su nombre y su avatar, y
NO SHALL exponer ningún otro dato antes de entrar». Los dos precios de abrirlo: cualquiera con la
tablet desbloqueada vería todos los saldos **sin teclear un PIN**, y **los hermanos se compararían
cada vez que se abre la aplicación**. No se reabre sin un argumento nuevo sobre eso segundo.

**Hay TRES marcos, no dos.** Desde `add-entry-frame`, las pantallas por las que se pasa antes de ser
alguien —acceso, rejilla, teclado de PIN, alta de perfil y restablecer PIN— llevan `EntryShell`: logo
arriba a la izquierda y contenido centrado en los dos ejes. Antes caían en un contenedor de lectura
**sin marca**, así que se entraba por una página con logo, se pasaba por cuatro pantallas anónimas y
el logo volvía al final. Quiénes lo reciben **no se lista**: es la última rama de la raíz, o sea todo
lo que llega sin actor y sin pedir ancho completo, y como toda ruta de la aplicación exige actor ese
conjunto es exactamente el camino de entrada. No declara escala: la elige la audiencia, y ahí todavía
no se sabe quién está delante.

**Un marco centra; el ancho lo declara cada pantalla.** `EntryShell` lo intentó imponer y partía la
rejilla en dos filas. Solo la pantalla sabe si es un formulario de 22rem o una fila de caras.

**Deuda conocida: no se puede subir una foto al CREAR un perfil**, solo elegir un animal. No es un
olvido — la clave de subida lleva dentro el identificador del hijo, que no existe todavía—.

Desde `redesign-parent-children` tiene **dueño** —un change propio, cuando la lista de deuda de
estilos quede vacía— y el dato que faltaba para elegir camino, ya medido: **los cinco endpoints de
subida del proyecto cuelgan del identificador de una entidad que ya existe**, y ninguno del prefijo
del padre. De ahí salen los dos precios:

- **Dos momentos**: crear y aterrizar en la edición de ese hijo, donde el subidor ya está. Cero API,
  pero **no sirve desde la rejilla** — esa alta se hace sin perfil activo y la edición exige ser el
  padre.
- **Un momento**: endpoint nuevo bajo el prefijo del padre, `avatarUploadKey` en el alta y una
  política para las fotos de quien sube y luego no crea. Funciona en los dos sitios y sería el
  **primer cambio de API de esta etapa**.

**Sigue sin resolverse de pasada en otro change.**

**Tres capas en el front, y la de en medio es nueva**: `ui/` no sabe de dominio ni de rutas; `app/`
—los dos marcos— sabe de rol y de destinos pero no de negocio; `features/` sabe de negocio y ya no
sabe de navegación.

**`pnpm verify` puede quedarse sin memoria en una máquina cargada.** Lanza trece tareas en paralelo
con `--force`; con Docker, el editor y un navegador abiertos, V8 muere con `allocation failure` y
turbo devuelve 127 **con una tarea distinta cada pasada**, lo que parece un test frágil y no lo es. Si
pasa, `pnpm turbo run lint typecheck test build --force --concurrency=1`.

## 9. Tests

**Ningún change se da por terminado sin tests.** No es una fase final: las tareas de test van junto a
la funcionalidad que cubren.

Qué se espera de un módulo de dominio:

- El **camino feliz** de cada operación.
- Los **caminos de autorización**: que un padre no toque hijos ajenos, que un niño no vea a su
  hermano. Un módulo con reglas de propiedad y sin tests de 403 está sin terminar.
- Los **caminos de error**: 404, 409 y 422 donde correspondan.
- Para cualquier cosa que mueva monedas o cambie de estado: **el doble tap**. Dos llamadas
  concurrentes, y se comprueba que el saldo cuadra y que la segunda da 409.

Herramientas: Vitest en todo el proyecto, Supertest para la API.

---

## 10. Cómo se trabaja

El proceso lo lleva OpenSpec. Nada de código sin un change aprobado que lo cubra.

```
openspec/changes/<nombre>/
  proposal.md   qué y por qué, con su sección "No incluye"
  design.md     cómo, con las alternativas descartadas
  specs/        requisitos verificables, con escenarios
  tasks.md      tareas ejecutables de como máximo 2 horas
```

- Las tareas se marcan `[x]` **según se completan**, no al final.
- Si durante la implementación una decisión del design resulta equivocada, se **actualiza el design**
  y se dice. No se implementa a escondidas algo distinto de lo que el documento dice.
- Lo que quede fuera de alcance se dice explícitamente, en vez de reducir el alcance en silencio.

### Decisiones cerradas — no reabrir sin motivo nuevo

- Sin entidad `Family`: `parentId` apunta directo a `User`.
- El saldo vive en `ChildProfile.coins`, con una tabla de historial append-only.
- Los avatares y las imágenes van a S3 (bucket privado, URLs firmadas de vida corta), detrás de una
  interfaz `StorageProvider`.
- `health` es sonda de **vida**, no de dependencias: no consulta la base de datos, ni la consultará.

### Fuente de verdad

`openspec/config.yaml` es el **único** documento de producto. Recoge el marco, la superficie de la
API prevista y las decisiones cerradas, y se inyecta como contexto en toda la planificación de
OpenSpec.

Hubo un boceto inicial, `Markdown.md`, que se retiró al cerrar `add-data-model`: su modelo de datos
ya contradecía al esquema real en cinco puntos (el niño como `User`, `coins` desde 0,
`TaskStatus.REJECTED`, rutas sin prefijo y una columna `familyRole`). Un documento de producto que
describe algo distinto de lo que hay construido no es documentación de más: es una trampa para quien
lo lea de buena fe.

Lo que aquel boceto tenía y seguía siendo válido —la superficie de endpoints y el encuadre de
producto— vive ahora en `config.yaml`. Si aparece una discrepancia entre `config.yaml`, este
documento y el código, gana el código, y hay que corregir el documento en el mismo change que la
detectó.

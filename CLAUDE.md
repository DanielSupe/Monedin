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

## 6. Base de datos

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

## 7. Convenciones

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

## 8. Tests

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

## 9. Cómo se trabaja

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

Vas a constuir monedin desde cero en un monorepo usando turbo. Seguiremos una arquitectura por modulos. Para el front usaremos vite/react con tan TanStack Query y TanStack Router y para el back express con prisma(orm), para la bd usaremos posgress que corra en docker junto con adminer para verla desde crome. para los archivos que se tenga que subir(imágenes, documentos etc) usaremos S3. 

El proceso sera llevado por openSpec, planearemos con los spec y mas adelante comenzaremos a codear. me puedes hacer las preguntas que creas necesarias para llegar al mejor resultado posible. Tambien puedes propner partes de la app que contribuyan a su mejor funcionamiento. 

En el primer change tiene que hacer parte la escritura del Claude.md donde definiremos las reglas a seguir en todo el desarrollo como nada de hardcodear y todo centralizado para un fácil despliegue mas adelante en un servidor propio o en EC2. también el rol asignado a seguir (ejm desarrolador seniur full stack)

*Monedín* es una plataforma de *educación financiera gamificada para niños de 6 a 11 años*.

Los padres crean un entorno familiar virtual donde asignan *tareas* con valor en monedas y publican *premios* con precio
en monedas. Los niños ganan monedas completando tareas (previa aprobación del padre) y las gastan canjeando premios (también
con aprobación del padre).

### Propósito

Enseñar los conceptos de dinero, esfuerzo y ahorro en un contexto familiar seguro, con dinámicas de recompensa que refuerzan
comportamientos positivos *sin depender de dinero real*.

### Propuesta de valor

- *Para el padre*: herramienta de gestión del hogar con impacto educativo. Reemplaza el "te doy plata si limpiás tu cuarto"
  por un sistema estructurado, visible y pedagógico.
- *Para el niño*: experiencia lúdica de autonomía. Ve su saldo, elige sus metas y siente que trabaja por algo concreto.

### Target

- Familias con hijos de 6 a 11 años.
- Padres que quieren introducir conceptos financieros sin complejidad técnica.
- Primer mercado: Latinoamérica hispanohablante (UI en español).

### Diferenciador

No es una app bancaria para niños ni un simple gestor de tareas. La combinación es la clave: **las tareas tienen valor
económico, los premios tienen costo, y el niño aprende el ciclo esfuerzo → ingreso → decisión de gasto.**
La moneda es virtual y cerrada a la familia (no hay dinero real, no hay pagos, no hay interoperabilidad entre familias).

---

## 2. Actores y modelo de acceso

Hay *dos tipos de usuario*, discriminados por un campo familyRole en el usuario:

| Rol | Identificador de login | Cómo se crea | Qué ve |
|---|---|---|---|
| PARENT | email + password | Se registra solo (signup público) | Todo lo de *sus* hijos |
| CHILD | *username* + password | *Solo el padre lo crea; no hay signup público de niños | Solo **sus propios* datos |

Reglas de acceso (*se validan en la capa de negocio, no en el controlador*):

- Un PARENT solo puede leer/escribir entidades cuyo parentId sea el suyo.
- Un CHILD solo puede leer/escribir entidades cuyo childId corresponda a su propio perfil.
- Un niño *no tiene email real*. [IMPL ANTERIOR] se generaba un email sintético ${username}@child.monedin para
  satisfacer al proveedor de auth. Si el stack nuevo soporta login por username nativo, hacerlo sin ese hack.



- Los niños nunca ven datos de sus hermanos.


## 3. Modelo de datos

### Enums


FamilyRole       = PARENT | CHILD
TaskStatus       = PENDING | COMPLETED | APPROVED | REJECTED
RedemptionStatus = PENDING | APPROVED | REJECTED


### Tablas de dominio

#### User
Usuario base, compartido por padres y niños. [IMPL ANTERIOR] lo gestionaba la librería de auth, por eso el id no tenía default.

| Campo | Tipo | Notas |
|---|---|---|
| id | string (PK) | cuid/uuid |
| name | string | obligatorio |
| email | string? unique | *solo PARENT* |
| username | string? unique | *solo CHILD* (3–20 chars) |
| emailVerified | boolean | default false |
| image | string? | avatar del padre |
| familyRole | FamilyRole | default PARENT |
| createdAt / updatedAt | datetime | |

[IMPL ANTERIOR] incluía además campos de un plugin de administración (role, banned, banReason, banExpires) que
*no se usan en ninguna regla de negocio*. Omitirlos salvo que se quiera un backoffice.

#### ChildProfile
Perfil extendido del niño. *Es la entidad a la que apuntan tareas, premios y canjes* — no al User directamente.

| Campo | Tipo | Notas |
|---|---|---|
| id | string (PK) | |
| coins | int | default 0, *nunca negativo* — es el saldo actual |
| age | int? | rango válido 6–11 |
| avatar | string? | |
| userId | string unique (FK → User) | cascade on delete |
| parentId | string (FK → User) | el padre dueño |

Relaciones: tasks[], redemptions[], rewardAssignments[].

#### Task
Tarea asignada por el padre a *un* niño. Una tarea para varios niños = varias filas (ver POST /tasks).

| Campo | Tipo | Notas |
|---|---|---|
| id | string (PK) | |
| title | string | 2–100 chars |
| description | string? | máx 500 chars |
| coins | int | default 0, rango 0–9999 — lo que gana el niño al aprobarse |
| status | TaskStatus | default PENDING |
| dueDate | datetime? | opcional |
| childId | string (FK → ChildProfile) | cascade on delete |
| parentId | string (FK → User) | |
| createdAt / updatedAt | datetime | |

#### Reward
Premio creado por el padre. Existe una sola vez y se *asigna* a uno o más niños, cada uno con su propio precio.

| Campo | Tipo | Notas |
|---|---|---|
| id | string (PK) | |
| title | string | 2–100 chars |
| description | string? | máx 500 chars |
| image | string? | URL válida |
| isActive | boolean | default true — el borrado es *lógico* |
| parentId | string (FK → User) | |
| createdAt / updatedAt | datetime | |

#### RewardAssignment
Tabla puente premio ↔️ niño *con precio propio por niño*. PK compuesta (rewardId, childId).

| Campo | Tipo | Notas |
|---|---|---|
| rewardId | string (FK → Reward) | cascade on delete |
| childId | string (FK → ChildProfile) | cascade on delete |
| coins | int | precio para *ese* niño, rango 1–9999 |

> El mismo premio puede costarle 50 monedas al hijo mayor y 30 al menor. Es intencional.

#### RewardRedemption
Solicitud de canje iniciada por el niño.

| Campo | Tipo | Notas |
|---|---|---|
| id | string (PK) | |
| coins | int | *snapshot* del precio al momento de solicitar — si el padre cambia el precio después, el canje pendiente respeta el precio original |
| status | RedemptionStatus | default PENDING |
| rewardId | string (FK → Reward) | |
| childId | string (FK → ChildProfile) | cascade on delete |
| createdAt / updatedAt | datetime | |

### Tablas de infraestructura de auth

[IMPL ANTERIOR] requería Session, Account y Verification generadas por la librería de auth. En el stack nuevo,
usar lo que el proveedor elegido pida — no son parte del dominio.

---

## 4. Máquinas de estado

### Tarea


                 (niño marca hecha)            (padre aprueba)
   PENDING  ──────────────────────►  COMPLETED  ──────────────►  APPROVED  [+coins al niño]
      ▲                                   │
      └───────────────────────────────────┘
                 (padre rechaza)


- Solo se puede editar una tarea en estado PENDING.
- complete solo desde PENDING, y solo el niño dueño.
- approve / reject solo desde COMPLETED, y solo el padre dueño.
- *Aprobar acredita task.coins al saldo del niño* — de forma atómica (transacción: cambio de estado + incremento de saldo).
- Rechazar devuelve la tarea a PENDING para que el niño la reintente.
- *Nota: el enum tiene un valor REJECTED que **nunca se usa* en el flujo actual (rechazar vuelve a PENDING).
  Decidir en el rediseño: o se elimina del enum, o se usa como estado terminal y se agrega un "reabrir".

### Canje (redemption)


                    (padre aprueba)
   PENDING ─────────────────────────► APPROVED   [−coins al niño]
      │
      └─────────────────────────────► REJECTED
                    (padre rechaza)


- El niño solo puede solicitar un premio que: exista, esté *activo, esté **asignado a él*, y cuyo precio **no supere su
  saldo actual**.
- El saldo se valida *dos veces*: al solicitar y otra vez al aprobar (entre ambos momentos el niño pudo gastar monedas).
- *Aprobar descuenta las monedas* de forma atómica.
- Rechazar es terminal, no devuelve nada (el niño nunca perdió monedas: el descuento ocurre solo al aprobar).

---

## 5. Endpoints

Convención: no hay prefijo global (/tasks, no /api/tasks). Todas requieren sesión salvo las marcadas 🔓.
La columna *Rol* indica quién puede llamarla.

### Health

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | /health | 🔓 público | { status: 'ok' } |

### Auth

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | /auth/sign-up/email | 🔓 | Registro de *padre*. Body: { name, email, password } |
| POST | /auth/sign-in/email | 🔓 | Login de padre. Body: { email, password } |
| POST | /auth/sign-in/username | 🔓 | Login de *niño*. Body: { username, password } |
| POST | /auth/sign-out | 🔓 | Cierra sesión |
| GET | /auth/get-session | 🔓 | Devuelve la sesión actual (o null) |

> [IMPL ANTERIOR] estas rutas las servía íntegramente la librería de auth vía un handler catch-all /auth/*;
> los endpoints explícitos existían solo para que aparecieran documentados en Swagger. Google OAuth estaba
> cableado pero opcional (activado solo si había credenciales en el env).

### Children — /children

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | /children | PARENT | Crea la cuenta del niño *y* su perfil. Body: { name, username, password, age?, avatar? } |
| GET | /children | PARENT | Lista los hijos del padre autenticado |
| GET | /children/me | *CHILD* | El niño obtiene su propio perfil (incluye su saldo) |
| PATCH | /children/:id | PARENT | Actualiza { name?, age?, avatar? } de un hijo propio |

*Reglas:*
- POST /children valida que el username no esté tomado → 409 Conflict.
- Crear un hijo es una operación de dos pasos (crear User con familyRole: CHILD + crear ChildProfile con
  parentId = currentUser.id). *Debe ser atómica* — [IMPL ANTERIOR] no lo era: si fallaba el segundo paso quedaba un
  User huérfano. Corregir.
- PATCH valida profile.parentId === currentUser.id → 403 si no.
- El name vive en User y age/avatar en ChildProfile: el update toca dos tablas, en transacción.
- *No hay endpoint de borrado de hijo.* Evaluar si se necesita (con borrado lógico).

*Forma de respuesta de un hijo* (consistente en las tres rutas):
json
{ "id": "...", "age": 8, "avatar": "...", "coins": 120,
  "user": { "id": "...", "name": "Juan", "username": "juanito" } }


### Tasks — /tasks

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | /tasks | PARENT | Crea la tarea para uno o varios hijos (ver abajo) |
| GET | /tasks | ambos | PARENT: todas las tareas que creó. CHILD: solo las suyas. Orden: createdAt desc |
| GET | /tasks/:id | ambos | Detalle, validando pertenencia según rol |
| PATCH | /tasks/:id | PARENT | Edita { title?, description?, coins?, dueDate? } — *solo si está en PENDING* |
| DELETE | /tasks/:id | PARENT | Borrado *físico*. 204 No Content |
| PATCH | /tasks/:id/complete | CHILD | PENDING → COMPLETED |
| PATCH | /tasks/:id/approve | PARENT | COMPLETED → APPROVED + acredita monedas |
| PATCH | /tasks/:id/reject | PARENT | COMPLETED → PENDING |

*POST /tasks acepta dos formas* (una tarea puede asignarse a varios hijos de una vez; se crea *una fila por hijo*):

jsonc
// A) mismo precio para todos
{ "title": "Ordenar el cuarto", "description": "...", "dueDate": "2026-04-20",
  "childIds": ["c1", "c2"], "coins": 50 }

// B) precio distinto por hijo
{ "title": "Ordenar el cuarto",
  "assignments": [ { "childId": "c1", "coins": 50 }, { "childId": "c2", "coins": 30 } ] }

Debe cumplirse *A o B* (validación cruzada). Devuelve el *array* de tareas creadas.
Valida que todos los childId existan (404) y sean hijos del padre autenticado (403), *antes* de crear nada.

dueDate se acepta como string ISO 8601 (fecha o fecha-hora) y se convierte a datetime.
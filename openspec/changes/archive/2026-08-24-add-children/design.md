## Context

Ver `proposal.md` para la motivación. Lo que condiciona el diseño es el estado del sistema al
empezar:

- La sesión está partida en dos desde `add-profile-selection`: la **cuenta** acredita el dispositivo,
  el **perfil activo** crea el actor. Hay tres niveles de ruta y el módulo nuevo usa los tres.
- `ChildProfile` ya tiene todo lo que el módulo necesita —`age`, `avatar`, `deletedAt`,
  `@@index([parentId, deletedAt])`— así que **no hay migración**.
- `auth` ya lee y escribe `ChildProfile`, pero solo lo de autenticación, y su propio repositorio
  declara que crear, listar y editar hijos "como entidad de producto" es de este change.
- **No existe ningún endpoint paginado** en todo el proyecto, solo las dos constantes. Lo que se
  escriba aquí es la plantilla que copiarán `/tasks`, `/rewards` y `/redemptions`.
- Al escribir las specs aparecieron tres derivas heredadas entre documento y código. Se corrigen
  aquí porque este change toca justo esas áreas; ninguna la introduce él.

## Goals / Non-Goals

**Goals:**

- Un módulo de producto que sirva de segunda plantilla junto a `health`, ahora con lógica de verdad.
- Un patrón de paginación reutilizable sin retoques por los tres listados que vienen.
- Que "un niño no ve a sus hermanos" sea cierto **por construcción**, no por una comprobación que
  alguien pueda olvidar en el siguiente endpoint.
- Que la lista de rutas de solo cuenta deje de vivir en un documento y pase a fallar en un test.

**Non-Goals:**

- Rendimiento. Los conjuntos son de escala familiar; no hay que optimizar nada todavía.
- Un contrato de paginación que aguante conjuntos grandes y calientes: ver la decisión 3.
- Tocar el esquema, el motor o las migraciones.
- Cualquier cosa que mueva monedas.

## Decisions

### 1. El alta es una ruta de solo cuenta, y el servicio recibe `actingAs`

`profile-selection` ya prevé crear un perfil *"cuando el perfil activo es el del padre **o cuando aún
no se ha elegido ninguno**"*. Eso obliga a `accountPost`: con `post` normal, la rejilla no podría
crear nada porque todavía no hay actor.

Pero la misma spec exige que *"intentarlo por la vía directa"* desde un perfil de niño **se rechace**,
y `requireAccount` no lo consigue: solo comprueba que haya sesión, y un niño con perfil activo también
trae cookie de cuenta válida.

```
   requireAccount ve esto            y no distingue entre:
   ──────────────────────            ──────────────────────
   ¿hay sesión de cuenta?  ──► sí ──►  cookie de cuenta, sin perfil   ✔ debe crear
                                       cookie de cuenta + perfil padre ✔ debe crear
                                       cookie de cuenta + perfil niño  ✘ debe rechazar
```

Así que el servicio necesita saber si ya hay alguien dentro:

```ts
createChild(accountUserId: string, actingAs: Actor | undefined, input: CreateChildInput)
```

**Alternativas descartadas:**

- *Pasarle el `ResolvedSession` entero*: mete un tipo de `shared/http/` en la capa de negocio. Mala
  capa.
- *Un `markAccountOnlyNoChild` en el router*: es autorización en el middleware, que `CLAUDE.md` §2
  prohíbe expresamente.
- *Un `if` sobre el rol en el controlador*: la misma regla, del otro lado.
- *Aceptar que un niño cree perfiles*: contradice una spec vigente que nadie pidió cambiar, y a
  cambio de nada.

### 2. La desviación de "actor como primer argumento"

`createChild` es el único método del módulo que no recibe `Actor` primero, y no es una preferencia:
la ruta es de solo cuenta, así que `actorOf(req)` lanzaría 401. Lo único que hay es `accountOf(req)`.

El precedente es exacto y del mismo tipo de ruta —`listProfiles(accountUserId)`,
`resetAdultPin(accountUserId, …)`, `enterProfile(accountUserId, …)`— con el comentario que ya está
escrito en `auth.service.ts`: *"Recibe el identificador de la CUENTA y no un actor, porque se llama
justo antes de ser nadie"*.

La regla del proyecto, leída sobre el código, queda así: **actor como primer argumento, salvo en
rutas de solo cuenta, donde el primero es `accountUserId: string`**. El tipo es la señal: leer
`string` en vez de `Actor` avisa de que aquí todavía no hay nadie y de que no se puede preguntar por
el rol sin más.

Todos los demás métodos reciben `Actor` **aunque `requireParent`/`requireChild` ya hayan filtrado**,
porque esos filtros son gruesos y no autorizan. Y los métodos de niño usan **`actor.childProfileId`,
nunca un identificador del cuerpo o de la ruta**: por eso el aislamiento entre hermanos no depende de
recordar comprobarlo. El repositorio nunca ve el actor; recibe `parentId` ya extraído, porque un
repositorio que sepa de roles es un servicio disfrazado.

### 3. Paginación: página y tamaño, no cursor

```ts
paginationQuerySchema = { page: coerce.int().min(1).default(1),
                          pageSize: coerce.int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE) }
pageOf(T)            → { items, page, pageSize, total, totalPages }
```

Cuatro decisiones dentro, todas con consecuencias:

**`z.coerce`**, porque la query llega siempre como cadena. Con `z.number()` a secas, `"2"` fallaría
la validación y nadie entendería por qué.

**Un `pageSize` por encima del máximo es 422, no un recorte.** Recortar en silencio esconde el error
de quien llama: pide 500, recibe 100 y cree que hay 100. Es lo contrario de lo que hacen muchas APIs
y es deliberado.

**Offset y no cursor.** Cursor sirve para conjuntos grandes donde se insertan filas mientras se
pagina, e impide "ir a la página 3" en una interfaz. Aquí son unos hijos y unas decenas de tareas.
`/tasks` podrá añadir una variante por cursor más adelante sin romper esto.

**Los metadatos en el cuerpo, no en cabeceras**, porque el front valida cada respuesta con Zod
(`apiFetch(path, schema)`) y una cabecera quedaría fuera del contrato y sin validar.

La aritmética vive en un solo sitio, `shared/pagination.ts`, con `toSkipTake()` y `toPage()`: el
servicio habla de página y tamaño, el repositorio de `skip`/`take`, y ningún repositorio hace cuentas
con entrada de usuario. `totalPages` es `Math.max(1, …)` para que el front no pinte "página 1 de 0".

Dos detalles del repositorio que **son parte del patrón**, no adorno:

```ts
const [items, total] = await prisma.$transaction([ findMany(...), count(...) ]);
orderBy: [{ createdAt: "asc" }, { id: "asc" }]
```

- Contar y leer **en la misma transacción**: sin ella, un alta concurrente entre las dos consultas
  deja `total` e `items` contradiciéndose.
- **Desempate por `id`**: `createdAt` no es único, y dos filas del mismo milisegundo tienen orden
  indefinido. Sin desempate, una fila puede salir en dos páginas o en ninguna. Es *el* bug clásico de
  la paginación por offset y lleva test propio.

### 4. La regla 403 / 404, que son dos capas distintas

```
   requireParent / requireChild        el servicio
   ────────────────────────────        ───────────
   ¿el ROL es el correcto?             ¿el RECURSO es tuyo y está activo?
   no  ──► 403, antes de tocar datos   no  ──► 404, aunque exista
           idéntico exista o no                para no confirmar que existe
```

Un 403 sobre el identificador de un hijo ajeno confirmaría que ese perfil existe. Por eso un hijo de
otra familia y un identificador inventado dan **exactamente la misma respuesta**, y hay un test que
compara los dos cuerpos.

### 5. El PIN propio del niño vive en `auth`, el avatar en `children`

Tres razones, en orden de peso:

1. Cambiar un PIN toca la tabla de sesiones, y `CLAUDE.md` §5 dice que es exclusiva de `auth`.
2. Verificar el PIN actual necesita el **mismo algoritmo de bloqueo por intentos** que entrar a un
   perfil. Duplicarlo en otro módulo es exactamente cómo se relaja un límite sin querer.
3. Ya hay dos rutas hermanas ahí: la del padre reponiendo el PIN de un hijo y la de desbloquear.

**Alternativa descartada: ensanchar `POST /auth/pin` a los dos roles**, como hace `enterProfile`. Ese
precedente aplica cuando *todavía no hay actor* y el riesgo es proteger un endpoint y olvidar el otro;
aquí las dos rutas están detrás de `requireSession` con su filtro de rol, así que el riesgo no existe.
Y ensancharla invalidaría el escenario "un niño no puede cambiar el PIN del padre", que hoy es un test
útil: pasaría de 403 a 204.

### 6. El orden de las rutas es una condición, no un detalle

```
   ✘ mal                              ✔ bien
   GET /children/:childId             GET /children/me
   GET /children/me                   GET /children/:childId

   "me" entra por :childId            "me" casa con su ruta
   requireParent dispara
   el niño recibe 403 en SU ruta
```

Express resuelve por orden de registro. El fallo no es ruidoso —un 403 es perfectamente plausible—,
así que lleva comentario en el archivo y test propio.

### 7. El tope va en el servicio, y su carrera se acepta

Un tope de filas por padre **no se expresa con un `CHECK`**: es un recuento entre filas y exigiría un
disparador que cuenta en cada inserción, más una migración y su entrada en el test de sincronía.

La distinción que conviene fijar, porque sin ella el tope parece un olvido:

> Un invariante de **integridad** va al motor: saldo no negativo, rangos. Corromper los datos si se
> viola. Un límite de **política** que cuenta filas va al servicio: no corrompe nada si se excede.

Contar e insertar van en la misma transacción, pero bajo Read Committed **la carrera sigue
existiendo**: dos altas simultáneas en el último hueco pueden dejar la familia en 11. Se acepta y se
documenta, porque el tope es política y pasarse en uno no descuadra ningún saldo. La alternativa
—nivel Serializable— obligaría además a mapear `P2034` a conflicto en `translate-error.ts`, que hoy
no está y saldría como 500 con `incidentId`: el síntoma que nadie sabría diagnosticar. No compensa
para acotar un desorden cosmético.

### 8. El doble `DELETE` responde 404, no 409

`CLAUDE.md` §4 dice que una transición condicional que afecta a cero filas es `ConflictError`. Aquí
se devuelve **404 a propósito**, y la razón es que esa regla es para transiciones **con efecto
secundario**: aprobar una tarea acredita monedas, y un segundo tap tiene que enterarse de que no
acreditó.

La baja no acredita ni descuenta nada. Quien pierde la carrera está preguntando por un hijo que en ese
momento ya está dado de baja, y el patrón establecido para "hijo dado de baja" es 404. Un 409 sobre un
`DELETE` que ya está hecho es información sin uso para el cliente.

### 9. El avatar sale siempre resuelto, y por fin tiene esquema

`add-profile-selection` prometió el catálogo *"como constante y como esquema"* y solo entregó la
constante. Como la columna es `String?` libre, **hoy nada impide guardar una clave que el front no
sabe pintar**. Se añade `avatarKeySchema = z.enum(AVATAR_KEYS)` en su propio archivo, porque la
imagen del padre y la de un premio lo usarán después.

Toda salida devuelve el avatar ya resuelto con `resolveAvatarKey`, nunca nulo, para que el front no
vuelva a tratar el caso vacío. De paso se alinea `childActorSchema`, que hoy lo declara nullable
mientras `selectableProfileSchema` no: dos formas del mismo dato en el mismo paquete.

Y `createdAt` es la primera fecha que viaja por el cable, así que fija la convención —**ISO 8601 UTC**,
validada con `z.string().datetime()`— antes de que `dueDate` la improvise en el change de tareas.

### 10. Se corrige la spec del PIN de adulto, no el código

`parent-authentication` promete que cambiar el PIN de adulto *"SÍ SHALL desactivar los perfiles
activos en otros dispositivos"*. El código nunca lo hizo. Al añadir el cambio de PIN del niño había
que fijar la regla para los dos, y se elige **describir lo que el sistema hace**.

El argumento de fondo: un PIN abre un perfil, y un perfil ya abierto en otro dispositivo sigue siendo
el mismo perfil de la misma persona. Para echar a alguien de otro dispositivo ya existe una vía que sí
revoca de verdad, que es cerrar la sesión de cuenta. Implementar la revocación era la alternativa
—dos métodos de repositorio— y se descarta por alcance: añade superficie de sesión a un change que ya
toca bastante.

### 11. Los schemas de entrada son estrictos

`.strict()` en todos: mandar `parentId`, `coins`, `deletedAt` o `pinHash` es 422 y no un campo
ignorado en silencio. Es lo que hace verificable que el padre dueño sale de la sesión, y lo que
convierte "el saldo no se edita" en algo que falla en vez de en algo que simplemente no pasa.

Merece un comentario en el schema del alta: **el día que alguien añada `coins` ahí, el alta sin PIN
se convierte en una impresora de monedas.** Las decisiones "sin ajuste manual" y "alta sin PIN" se
sostienen la una a la otra.

### 12. Front: una ruta propia, y sigue siendo andamio

La gestión de hijos estrena `src/routes/children.tsx`, la primera ruta hermana de `/`. La alternativa
—otro `useState` con unión discriminada dentro de la home, como hace `ProfileGrid`— no aguanta cuando
lleguen `/tasks` y `/rewards`, y este es el momento barato de partirla.

Sigue sin sistema de diseño: estilos en línea, como todo el andamio actual. **Eso es otro change.**

Dos cosas que son donde se cuela el bug tonto:

- Toda mutación invalida `childrenQueryKey` **y** `profilesQueryKey`, porque la rejilla también pinta
  a los hijos. Y `PATCH /children/me` invalida además `sessionQueryKey`, porque el avatar viaja
  dentro del actor.
- **`describeChildrenError` propio.** `describeAuthError` traduce `CONFLICT` como "ese correo ya está
  registrado"; reutilizarlo haría que el tope de hijos dijera eso. El código HTTP es estable, pero
  **no significa lo mismo en dos módulos**.

## Risks / Trade-offs

**Cualquiera con el dispositivo y sin perfil elegido puede crear perfiles** → No es escalada: un
perfil de niño recién creado tiene cero monedas, ninguna tarea y no ve a sus hermanos. Lo acota el
tope, y como dar de baja exige perfil de padre, quien no lo tiene no puede liberar huecos y repetir.
Queda desorden que el padre ve en la misma pantalla y limpia.

**El tope puede superarse en uno bajo concurrencia** → Aceptado y documentado (decisión 7). El test
asevera que no se supera el tope más uno, con la carrera comentada.

**No queda rastro de quién creó cada perfil** → No hay actor que registrar, y añadir la columna es
alcance nuevo. Se acepta; queda `createdAt`.

**Un niño puede cambiar el PIN de un perfil ajeno si ya lo conoce y lo tiene abierto** → El cambio
solo alcanza al perfil de la sesión, así que hace falta haber entrado antes, es decir, saber ya el
PIN. El límite de intentos impide llegar ahí probando, y el padre puede reponer cualquier PIN de un
hijo sin conocer el anterior.

**El orden de rutas es un fallo silencioso** → Comentario en el archivo y un test que pide
`/children/me` como niño y exige 200.

**Un `updateMany` condicional en la baja depende de que nadie escriba un `update` directo** → El test
de doble baja simultánea lo cubre, y el patrón queda escrito aquí para el módulo de tareas, donde las
transiciones sí mueven monedas.

**El patrón de paginación se fija sobre el listado más simple del sistema** → A propósito: es más
barato equivocarse aquí que sobre `/tasks`, que además llevará filtros. Si `/tasks` necesita cursor,
lo añade como variante sin romper este contrato.

## Migration Plan

No hay migración de base de datos ni cambio de contrato que rompa nada. Las respuestas existentes solo
cambian en un punto: el avatar del actor de niño pasa a salir siempre resuelto en vez de admitir nulo,
que es estrechar el tipo, no ensancharlo. El front ya trataba el caso.

El despliegue es el habitual: `pnpm db:generate`, lint, typecheck, tests, y arriba. Revertir es
retirar el commit; nada queda a medias en la base porque nada de lo que este change escribe existía
antes.

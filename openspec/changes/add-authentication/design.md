## Context

Ver `proposal.md` para la motivación. Este documento cubre cómo se construye la sesión y por qué de
esa forma.

Lo que ya está puesto y condiciona el diseño:

- **`User.passwordHash` y `ChildProfile.pinHash` existen** desde `add-data-model`, vacíos y sin que
  nada los lea. Son columnas de texto: el algoritmo se decide aquí.
- **`Actor` ya tiene la forma correcta**, unión discriminada con `parentId` en la rama del niño. Este
  change es el primero que lo construye de verdad; hasta ahora era un contrato sin implementación.
- **El niño no es un `User`.** No tiene fila propia, ni correo, ni nombre de usuario. Cualquier diseño
  que asuma «un usuario, una credencial, una sesión» no encaja aquí.
- **El contrato de errores traduce errores de dominio a HTTP en un solo sitio.** Añadir un caso son
  dos líneas; inventarse respuestas en el módulo `auth` sería una regresión.

Y una restricción que no es técnica: el usuario final es una familia compartiendo una tablet. Un
diseño correcto que obligue al padre a teclear su contraseña cada vez que el niño quiere ver sus
tareas es un diseño que la familia va a rodear, apuntando la contraseña en un papel.

## Goals / Non-Goals

**Goals:**

- Que la frontera entre el padre y el niño sea real en el servidor, y no un rol que el cliente dice
  tener.
- Que pasar de padre a hijo y volver cueste un PIN de cuatro dígitos, no una contraseña.
- Que quien lea la base de datos entera no pueda suplantar a nadie.
- Que el primer módulo de dominio no tenga que pensar en autenticación: pide el actor y ya está.
- Que añadir una ruta sin acordarse de protegerla la deje protegida.

**Non-Goals:**

- Resistir a un atacante con acceso al dispositivo desbloqueado. Si alguien tiene la tablet abierta
  con la sesión del padre, ya está dentro; eso lo resuelve el bloqueo de pantalla del sistema
  operativo, no nosotros.
- Multi-dispositivo con sincronización de sesiones. Un padre puede tener sesión en dos sitios y son
  independientes.
- Auditoría de accesos. Se registrarán los fallos para el bloqueo, no para un histórico consultable.

## Decisions

### 1. Dos cookies: la del padre siempre, la del niño encima

Es la decisión que estructura todo lo demás. El requisito de producto —«la sesión del padre queda
suspendida, no cerrada»— se puede implementar de dos formas, y una es notablemente peor.

```
   COOKIES EN EL DISPOSITIVO FAMILIAR

   monedin_session   ───► sesión del padre    (siempre, mientras no cierre)
   monedin_child     ───► sesión del niño     (solo mientras está dentro)

   Resolución de cada petición:
     ¿hay cookie de niño?  ──sí──► ¿es válida Y su sesión padre también?
                                        │sí            │no
                                        ▼              ▼
                                   actor CHILD    retirar cookie de niño,
                                                  seguir como el padre
                           ──no──► ¿hay cookie de padre válida?
                                        │sí            │no
                                        ▼              ▼
                                   actor PARENT    sin sesión
```

Salir del perfil del niño es **borrar una cookie**. No hay que restaurar nada, porque la sesión del
padre nunca se tocó. Y la dependencia entre ambas no es una convención: la sesión de niño guarda de
qué sesión de padre nació, y se comprueba en cada petición, así que revocar al padre invalida al hijo
sin tener que ir a buscarlo.

**Alternativa descartada**: una sola cookie que apunta a la sesión activa, con la sesión de niño
guardando un puntero a la del padre para poder «volver». No funciona bien: al volver habría que
reemitir la cookie del padre, y de la sesión del padre solo tenemos el hash de su identificador —por
diseño, decisión 3—. Habría que crear una sesión de padre nueva, que es lo contrario de suspenderla:
el resto de pestañas se quedarían con la anterior.

**Lo que cuesta**: cada petición puede tener que validar dos sesiones en vez de una. Es una consulta
más, indexada por hash, y solo mientras un niño está dentro.

### 2. `scrypt` de la biblioteca estándar, no Argon2

Argon2id es la recomendación por defecto de la industria para contraseñas y sería la elección obvia.
Se descarta por una razón concreta de este proyecto: exige un binario nativo, y este entorno de
desarrollo ya demostró que un antivirus puede impedir que un binario sin firmar llegue a escribirse.
Pasó con `turbo.exe` y costó media tarde de diagnóstico. Repetirlo con la pieza que hashea
contraseñas, y descubrirlo en el servidor, es un riesgo que no compensa.

`scrypt` viene en `node:crypto`, es memory-hard —que es la propiedad que importa frente a hardware
especializado— y está bien considerado. Con parámetros correctos la diferencia práctica frente a
Argon2id, para un producto sin adversario dedicado, es teórica.

Se guarda en una sola cadena que incluye los parámetros usados, no solo el hash:

```
   scrypt$N=16384,r=8,p=1$<sal en base64>$<derivación en base64>
```

Así subir los parámetros más adelante no invalida las credenciales existentes: se verifica con los
que trae la cadena y, si son los antiguos y el acceso fue correcto, se vuelve a hashear con los
nuevos. Un `varchar` con solo el hash habría obligado a que todo el mundo restableciera su
contraseña.

**Lo que cuesta**: si algún día aparece una razón para migrar a Argon2id, hay que hacerlo. El formato
con prefijo de algoritmo lo deja preparado; la migración sería la misma que subir parámetros.

### 3. El identificador de sesión se guarda hasheado, y el PIN también

La cookie lleva 32 bytes aleatorios en base64url. La tabla guarda su SHA-256, nunca el valor.

Que se hashee el identificador de sesión es menos habitual que hashear contraseñas, y es
deliberado: una copia de la base de datos —una réplica, un volcado, una consulta en Adminer— no debe
bastar para suplantar a nadie. Aquí no hace falta un hash lento como el de las contraseñas, porque el
identificador ya tiene 256 bits de entropía y no hay diccionario que probar; SHA-256 sobra y no añade
latencia a cada petición.

El PIN sí va con `scrypt`, igual que una contraseña: cuatro dígitos son un espacio diminuto, y lo que
lo protege es el bloqueo por intentos, no el coste del hash. Aun así, hashearlo barato haría que un
volcado de la base revelara todos los PIN en segundos.

### 4. El bloqueo vive en la fila de quien se intenta acceder

Contador de fallos y momento de desbloqueo, como columnas en `User` y en `ChildProfile`:

| | Intentos | Bloqueo |
|---|---|---|
| Padre | 10 | 15 minutos |
| Niño | 5 | 5 minutos |

Los números difieren por quién se equivoca. Un adulto que teclea mal su contraseña lo hace unas
pocas veces; un niño de seis años falla su PIN sin querer con facilidad, así que el bloqueo es más
corto para no convertir un despiste en un berrinche. Y el padre puede desbloquearlo al momento, que
es el camino natural en una familia.

**Alternativa descartada**: limitar por dirección IP en un middleware genérico. En una casa todos
comparten IP, así que un hermano probando números bloquearía a toda la familia. El bloqueo por
identidad es el que corresponde a este producto.

**Lo que cuesta**: alguien que conozca el correo de un padre puede bloquearle el acceso a propósito
durante quince minutos. Es el compromiso conocido de este tipo de bloqueo, y para un producto
familiar el intercambio compensa.

### 5. Las rutas nacen protegidas

El middleware de sesión se monta antes que los módulos y siempre resuelve el actor si lo hay. La
protección es un guardián explícito por router, y lo que hace que «nacer protegida» sea verdad es
que el guardián por defecto se aplica a todo el router de la API y las rutas públicas se declaran una
a una.

```
   app
    └── /api/v1  ──► resolveSession       siempre: deja el actor si lo hay
                 ──► requireSession       salvo rutas declaradas públicas
                      └── health          ← declarada pública, explícitamente
                      └── auth            ← acceso y registro, públicos
                      └── (todo lo demás) ← protegido sin escribir nada
```

**Alternativa descartada**: una lista de rutas protegidas. Es la forma en que se acaba publicando un
endpoint sin querer: quien añade una ruta y no conoce la lista, la deja abierta. Con el criterio
inverso, olvidarse produce un 401 molesto en desarrollo, que se descubre en el primer intento.

La comprobación de rol de la ruta (`requireParent`, `requireChild`) es un filtro grueso y **no
sustituye a la autorización**: que un padre tenga el rol correcto no dice nada sobre si ese recurso
es suyo. Eso lo sigue comprobando el servicio, con el actor.

### 6. El módulo `auth` no rompe la anatomía, aunque tenga dos capas de datos

`auth` sigue la forma de siempre, con una particularidad: su repositorio toca `Session`, `User` y
`ChildProfile`. Eso está bien —es el módulo dueño de la sesión— pero significa que hay que ser
explícito sobre lo que NO hace: no gestiona hijos como entidad de producto. Crear, listar y editar
hijos es de `add-children`. Aquí solo se leen perfiles para ofrecerlos en la pantalla de acceso y se
escribe el PIN.

El middleware de sesión vive en `shared/http/`, no en el módulo, porque lo consume toda la API. Es la
única pieza fuera de `auth` que lee la tabla de sesiones, y lo hace a través del repositorio de
`auth`, no con Prisma directamente.

### 7. La respuesta de estado de sesión es lo que arranca el front

`GET /api/v1/auth/session` responde siempre 200, con o sin sesión. No es un endpoint de error: la
aplicación web lo llama al cargarse para saber qué pintar, y un 401 ahí obligaría a tratar el caso
normal —nadie ha entrado todavía— como una excepción.

```jsonc
// sin sesión
{ "actor": null }

// padre
{ "actor": { "familyRole": "PARENT", "id": "...", "name": "Lucía" } }

// niño, con la sesión del padre esperando detrás
{ "actor": { "familyRole": "CHILD", "id": "...", "name": "Mateo", "coins": 120 },
  "parentSessionAvailable": true }
```

## Risks / Trade-offs

**Un PIN de cuatro dígitos es débil por sí solo** → lo que lo sostiene es el bloqueo por intentos, y
por eso su test es de los que no se pueden saltar. Si alguna vez se relaja el bloqueo «porque
molesta», el PIN deja de ser una frontera y pasa a ser un adorno.

**Sin recuperación de contraseña, un padre que la olvide se queda fuera** → asumido y declarado en el
proposal. Es la deuda más visible que deja este change y lo primero que hay que mirar cuando haya
envío de correo.

**Dos cookies son más estado que una** → el escenario de la cookie de niño huérfana está en la spec y
tiene su test: si la de padre ya no vale, la de niño se retira. Sin ese caso cubierto, quedaría una
cookie que no concede acceso pero confunde al front.

**Hashear con `scrypt` en el hilo principal bloquea** → se usa la variante asíncrona, siempre. Un
hash de contraseña tarda del orden de 100 ms a propósito; hacerlo síncrono congelaría el servidor en
cada acceso.

**El bloqueo por identidad permite bloquear a alguien a propósito** → asumido en la decisión 4.

**Aparecen columnas de credencial y de bloqueo en tablas de dominio** → `User` y `ChildProfile` pasan
a mezclar dominio y autenticación. Se acepta porque separar una tabla de credenciales por cada una
añadiría dos uniones a cada acceso sin ganar nada: no hay varios métodos de acceso por usuario, ni
está previsto que los haya.

## Migration Plan

No hay datos de usuarios reales; sí hay datos de siembra, que se regeneran.

1. Migración con la tabla de sesiones y las columnas de bloqueo. La siembra pasa a generar
   credenciales verificables en vez de literales de relleno.
2. Módulo de hash y verificación, con sus tests, antes de que nada lo use.
3. Repositorio y servicio de sesiones: crear, resolver, renovar, revocar.
4. Middleware de resolución y guardianes, montados con `health` como única ruta pública.
5. Endpoints del padre: registro, acceso, cierre, cambio de contraseña.
6. Endpoints del niño: listar perfiles, entrar con PIN, salir; y la gestión del PIN por el padre.
7. Front: pantallas de acceso, selector de perfil, teclado de PIN y guarda de rutas.

**Reversión**: revertir el commit y bajar la migración. Al no haber usuarios reales, no hay
credenciales que preservar.

**Criterio de terminado**: ver los escenarios de las cuatro specs. Resumido —un padre se registra,
entra, pasa a su hijo con el PIN y vuelve sin reescribir la contraseña; fallar el PIN cinco veces
bloquea el perfil; y una ruta nueva sin declarar nada responde 401 sin sesión.

## Open Questions

Deferibles sin afectar a las specs ni al desglose de tareas:

- Duración exacta de la sesión de padre en un dispositivo familiar. Empieza en 30 días con
  prolongación por uso; es un valor de configuración y ajustarlo no toca código.
- Si la sesión de niño debe caducar por inactividad más agresivamente que la del padre. Hoy hereda la
  caducidad del padre y añade la suya, más corta.
- Si conviene un limitador de peticiones general, además del bloqueo por identidad. Es una defensa
  distinta, de infraestructura, y su sitio natural es el servidor web de delante.
- Parámetros finales de `scrypt` en el servidor real. Se fijan midiendo en la máquina de destino; el
  formato con parámetros incluidos permite subirlos sin invalidar nada.

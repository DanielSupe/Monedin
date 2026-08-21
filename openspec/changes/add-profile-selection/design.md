## Context

Ver `proposal.md` para la motivación. Este documento cubre cómo se parte la sesión en dos niveles sin
rehacer lo que ya funciona.

El punto de partida, construido en `add-authentication` y ya archivado:

```
   monedin_session   ──► sesión de padre   (cookie, 30 días, DA poderes de padre)
   monedin_child     ──► sesión de niño    (cookie, cuelga de la anterior)
```

Una fila de `Session` con `childProfileId` nulo **es** la sesión del padre, y el middleware la
convierte en un actor `PARENT`. Hay una restricción en la base que dice que `childProfileId` y
`parentSessionId` son ambos nulos o ambos no nulos.

Eso es exactamente lo que hay que cambiar: la cookie de cuenta tiene que dejar de significar «soy el
padre».

## Goals / Non-Goals

**Goals:**

- Que la rejilla sea una frontera de verdad y no una pantalla que se puede rodear llamando al
  endpoint.
- Que cambiar de perfil cueste cuatro dígitos y vincular un dispositivo cueste la contraseña, y que
  nadie confunda las dos cosas.
- Que el cambio se note donde tiene que notarse: los tests que daban por buena la cookie de padre
  deben fallar.
- Que la reutilización sea máxima. El hash, el bloqueo, las cookies y el contrato de errores ya
  existen y no se tocan.

**Non-Goals:**

- Reescribir la autenticación. Registro, acceso, cierre y contraseña se quedan como están.
- Sesiones por dispositivo con nombre, listado y revocación remota.
- El alta de perfiles, que es `add-children`.

## Decisions

### 1. La sesión de cuenta y el perfil activo son dos filas, no una

Se conserva el esquema de dos cookies y se le cambia el significado a las filas:

```
   ANTES                              AHORA
   ─────                              ─────
   Session(child=null, parent=null)   Session(child=null,  parent=null)
     = SESIÓN DE PADRE                  = SESIÓN DE CUENTA
     → actor PARENT                     → NINGÚN actor

   Session(child=X, parent=S)         Session(child=X,     parent=S)
     = sesión de niño                   = perfil de niño activo
     → actor CHILD                      → actor CHILD

                                      Session(child=null,  parent=S)   ← NUEVA
                                        = perfil del PADRE activo
                                        → actor PARENT
```

La forma nueva —`childProfileId` nulo con `parentSessionId` no nulo— es hoy imposible: la
restricción `sessions_child_requires_parent_session` la prohíbe. Se sustituye por la regla correcta:

> `parentSessionId IS NULL` ⟹ es una sesión de cuenta, y entonces `childProfileId` también es nulo.
> `parentSessionId IS NOT NULL` ⟹ es un perfil activo, y `childProfileId` dice cuál: nulo es el
> perfil del padre.

**Alternativa descartada**: una bandera `unlocked` en la sesión de cuenta en vez de una fila aparte.
Es menos código, pero mezcla dos ciclos de vida en una fila: la cuenta dura treinta días y el perfil
activo debe durar horas. Con una bandera habría que llevar dos caducidades en la misma fila, y
«cerrar el perfil» pasaría a ser un `UPDATE` sobre la fila que sostiene la cuenta, en vez de un
`DELETE` de algo desechable.

**Lo que cuesta**: el nombre `monedin_child` deja de describir lo que guarda, porque ahora puede
llevar el perfil del padre. Se renombra a `monedin_profile`. Es un cambio de nombre de cookie, con lo
que quien tenga una sesión abierta al desplegar vuelve a la rejilla: aceptable, no hay usuarios.

### 2. La resolución del actor se invierte

Hoy el middleware mira la cookie de padre y ya tiene un actor. Ahora:

```
   ¿cookie de cuenta válida?
        │ no ──► sin actor, sin sesión
        │ sí
        ▼
   sesión de cuenta acreditada  (el dispositivo es de esta familia)
        │
   ¿cookie de perfil válida Y cuelga de ESTA cuenta Y no ha caducado?
        │ no ──► sin actor, PERO con cuenta        ← el estado nuevo
        │ sí
        ▼
   childProfileId nulo ──► actor PARENT
   childProfileId       ──► actor CHILD (+ parentId)
```

El estado intermedio —cuenta sin perfil— es el que hace posible la rejilla: hay que poder listar los
perfiles sin ser todavía nadie. Se resuelve con **una ruta declarada como «solo cuenta»**, un
guardián nuevo junto a `requireSession` y los de rol.

`requireSession` mantiene su significado: exige actor. Así, cualquier ruta escrita antes o después
sigue protegida sin tocarla, y solo las tres de la rejilla usan el guardián nuevo.

### 3. El PIN del padre reutiliza todo lo del PIN del niño

`User` gana `pinHash`, `failedPinAttempts` y `pinLockedUntil`, exactamente como `ChildProfile`. El
hash es el mismo `scrypt`, el bloqueo el mismo patrón, el error el mismo `TooManyAttemptsError` con
su 429.

`User` ya tiene `failedLoginAttempts` y `lockedUntil` para la contraseña. Se añaden columnas
**aparte** para el PIN en vez de reutilizarlas: son dos fronteras distintas y bloquear una no debe
bloquear la otra. Un niño aporreando el PIN de su madre no puede dejarla sin poder entrar con su
contraseña desde el móvil.

**Cuántos intentos**: los mismos que el padre tiene para la contraseña —10 intentos, 15 minutos—.
Es un adulto tecleando, no un niño de seis años.

### 4. El PIN se establece al registrarse, y ahí hay un problema que resolver

Si el PIN se pide en el registro, el formulario de alta pasa a tener cuatro campos. Si no se pide, un
padre recién registrado no puede entrar a su propio perfil.

Se elige **pedirlo en el registro**, junto al nombre, el correo y la contraseña. Es un campo más una
sola vez, frente a un estado intermedio —cuenta sin PIN— que habría que contemplar en la resolución
del actor, en la rejilla y en la respuesta de estado.

**Alternativa descartada**: derivar un PIN inicial de la contraseña o generarlo al azar y enseñarlo.
Un PIN que el usuario no eligió es un PIN que no recuerda.

### 5. El catálogo de avatares vive en `packages/contracts`

Una lista de claves —`nutria`, `zorro`, `pulpo`…— exportada como constante y como esquema Zod. La API
valida contra ella; el front la recorre para pintar el selector y resuelve cada clave a su
ilustración.

La columna guarda **la clave, no la URL**. Cuando llegue `add-file-storage`, un avatar propio será
otra forma del mismo campo —una referencia a un objeto en S3— y los perfiles existentes no habrá que
migrarlos.

**Alternativa descartada**: guardar la ruta del archivo. Cambiar dónde viven las ilustraciones
obligaría a un `UPDATE` sobre todos los perfiles.

### 6. Los tests que se rompan son la señal, no el daño

`add-authentication` dejó tests que hacen exactamente esto:

```ts
const { cookies } = await registerParent(app);
const r = await request(app).get(`${API_PREFIX}/auth/child-profiles`).set("Cookie", cookies);
expect(r.status).toBe(200);
```

Con este change eso pasa a ser 401, porque la cookie ya no concede poderes. **Si al terminar no
hubiera fallado ninguno, sería la prueba de que el cambio es cosmético.**

Se actualizan uno a uno: cada ayudante de test que hoy devuelve «las cookies del padre» pasa a
devolver «las cookies con el perfil del padre activo», que es un paso más. Lo que NO se hace es
relajar una aserción para que pase.

### 7. La rejilla es la ruta raíz del front

`/` deja de ser la pantalla del perfil y pasa a ser la rejilla. La pantalla de cada perfil cuelga de
haberlo elegido. La guarda de rutas gana un estado:

```
   sin cuenta          ──► pantalla de acceso
   cuenta sin perfil   ──► rejilla                ← nuevo
   perfil activo       ──► la aplicación
```

Es el mismo `AuthGate` que ya existe, con una rama más. La rejilla se ve al abrir porque el estado de
sesión se consulta al arrancar y devuelve «cuenta sin perfil» siempre que no se haya elegido: no hace
falta ningún mecanismo de «mostrar solo la primera vez».

## Risks / Trade-offs

**Un paso más para el padre en cada uso** → es el precio de que la frontera exista. Se compensa
haciendo que el paso sean cuatro dígitos y no una contraseña, y que la sesión de cuenta dure treinta
días. Si en uso real resulta molesto, lo que se ajusta es la caducidad del perfil activo, que es
configuración.

**Cambiar el significado de una fila ya existente** → la migración no mueve datos, pero sí sustituye
una restricción por otra. Las sesiones abiertas al desplegar dejan de ser válidas como perfil y
mandan a la rejilla; sin usuarios reales, no hay nada que preservar.

**Dos credenciales para el padre** → más que gestionar, y una más que olvidar. Mitigado porque el PIN
se restablece con la contraseña, que es la vía natural y no necesita correo.

**El PIN de adulto invita a pensar que protege del padre malicioso** → no lo hace, ni pretende. Con
la contraseña se restablece el PIN. Protege del niño que tiene la tablet, que es el escenario real.

**El estado intermedio se puede olvidar en una ruta nueva** → no, porque `requireSession` sigue
exigiendo actor y es lo que se aplica por defecto. Olvidarse produce un 401, que es el fallo benigno.
Lo que hay que declarar explícitamente es lo contrario: que una ruta se conforma con la cuenta.

## Migration Plan

No hay datos de usuarios reales; la siembra se regenera con PIN de adulto.

1. Migración: columnas de PIN en `User` y sustitución de la restricción de sesión.
2. Catálogo de avatares en `packages/contracts`, con su esquema.
3. PIN de adulto: alta en el registro, verificación, cambio y restablecimiento con contraseña.
4. Sesión de perfil: crear, resolver, revocar; renombrar la cookie.
5. Resolución del actor en dos niveles y el guardián de «solo cuenta». **Aquí es donde rompen los
   tests de `add-authentication`**; se arreglan en este paso, no al final.
6. Endpoints de la rejilla: listar perfiles, entrar, salir.
7. Front: guarda con tres estados, rejilla, teclado de PIN reutilizado para el padre.

**Reversión**: revertir el commit y bajar la migración. Las cookies emitidas dejan de valer y todo el
mundo vuelve a la pantalla de acceso.

**Criterio de terminado**: ver los escenarios de las cuatro specs. Resumido — con la cookie de cuenta
y sin perfil, una operación de padre responde 401; entrar al perfil del padre pide su PIN y no la
contraseña; y salir de un perfil devuelve a la rejilla y no a nadie.

## Open Questions

Deferibles sin afectar a las specs ni al desglose de tareas:

- Cuánto dura un perfil activo. Empieza en las mismas 12 horas que hoy dura la sesión de niño; es
  configuración y se ajusta con uso real.
- Si la rejilla debe recordar el orden en que se usan los perfiles. Afecta a la ergonomía, no al
  contrato.
- Cuántas ilustraciones lleva el catálogo inicial. Doce es un punto de partida razonable; añadir más
  es añadir claves.
- Si conviene un aviso al padre cuando alguien falla su PIN varias veces. Es una decisión de producto
  y necesita un canal de notificación que no existe.

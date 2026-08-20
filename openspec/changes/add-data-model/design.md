## Context

Ver `proposal.md` para la motivación. Este documento cubre cómo se monta el esquema y por qué tiene
la forma que tiene.

El punto de partida son tres restricciones que no se eligen aquí:

- **El niño no es un `User`.** Decisión tomada antes de escribir este change, y de la que se derivan
  casi todas las diferencias respecto al modelo de datos de `Markdown.md`.
- **Prisma 7 no se configura como Prisma 5 o 6.** El spike de `setup-foundations` (decisión 11 de su
  design) dejó verificado que funciona sobre ESM y dejó anotadas tres condiciones que hay que
  aplicar. Este change las aplica; no las vuelve a investigar.
- **Los límites del dominio ya existen** en `@monedin/contracts` y son la única fuente de verdad. Lo
  que aquí se decide es si el motor los conoce también, y cómo se evita que las dos copias se
  separen.

## Goals / Non-Goals

**Goals:**

- Que un dato imposible sea imposible de almacenar, no solo difícil de escribir por accidente.
- Que el esquema de cualquier entorno se reproduzca desde cero aplicando migraciones, sin un solo
  paso manual.
- Que la primera vez que alguien escriba un repositorio de dominio tenga un molde y un cliente ya
  cableado, en vez de tener que decidir cómo se conecta.
- Que las decisiones caras de cambiar más adelante —qué es el saldo, qué es el historial, quién es
  dueño de qué— queden fijadas mientras no hay ni una fila.

**Non-Goals:**

- Rendimiento. Los índices que se crean son los que se derivan de los accesos que el documento de
  producto ya describe; afinar sin tráfico es adivinar.
- Abstraer el motor detrás de una interfaz por si algún día se cambia de base de datos. No hay
  ningún indicio de que vaya a pasar y el coste se paga todos los días.
- Modelar nada que no tenga un caso de uso escrito. Sin notificaciones, sin auditoría general, sin
  campos "por si acaso".

## Decisions

### 1. El niño vive entero en `ChildProfile`, sin fila en `User`

`Markdown.md` daba al niño una fila en `User` con `username` y contraseña, y una `ChildProfile` que
la extendía. Se elige la lectura literal de `config.yaml`: el niño accede con perfil y PIN, así que
no es un usuario del sistema sino un perfil dentro de la cuenta de su padre.

```
   ANTES (Markdown.md)                 AHORA
   ───────────────────                 ─────
   User                                User            solo el padre
     familyRole PARENT|CHILD             email @unique
     email?    solo PARENT               passwordHash
     username? solo CHILD
     passwordHash                      ChildProfile    el niño entero
       │                                  name
       │ 1:1                              pinHash
   ChildProfile                           coins, age?, avatar?
     coins, age?, avatar?                 parentId ──► User
     parentId ──► User

   Dos tablas, y en User la mitad      Una tabla. Cada columna aplica
   de las columnas solo aplican        siempre.
   a un rol.
```

Lo que se gana no es solo una tabla menos. `Markdown.md` advertía de que actualizar un hijo tocaba
dos tablas en transacción porque el nombre vivía en `User` y la edad en `ChildProfile`; ese problema
desaparece. Y deja de ser representable el estado que la implementación anterior producía cuando
fallaba a medias: un `User` huérfano sin perfil.

**Alternativa descartada**: mantener `User` para ambos y darle al niño un PIN en lugar de contraseña.
Habría dado un único mecanismo de sesión, que es cómodo, a cambio de perpetuar una tabla donde la
mitad de las columnas solo aplican a un rol y donde nada del esquema impide crear un `User` con rol
`CHILD` y correo.

**Lo que cuesta**: si algún día el niño necesita una cuenta de verdad —correo, recuperación de
contraseña, acceso desde fuera de la familia— hay que migrar. Se asume: el producto está dirigido a
niños de 6 a 11 años dentro de la cuenta de su padre, y esa premisa es más estable que el esquema.

### 2. Consecuencias en el código ya escrito

La decisión 1 deja tres cosas del andamio apuntando al vacío. Se arreglan aquí, no en el change
siguiente, porque el primer módulo de dominio que se escriba las va a usar.

**`Actor` pasa a unión discriminada.** Hoy exige un `userId` para todo el mundo:

```ts
// antes: un actor CHILD sin childProfileId compila perfectamente
interface Actor { userId: string; familyRole: FamilyRole; childProfileId?: string }

// ahora: no se puede construir un CHILD sin su perfil
type Actor =
  | { familyRole: "PARENT"; userId: string }
  | { familyRole: "CHILD"; childProfileId: string; parentId: string };
```

El `parentId` en la rama `CHILD` no es decorativo: casi toda consulta de un niño necesita saber de
qué familia es, y llevarlo en el actor evita una consulta previa en cada servicio.

**`User.familyRole` no se crea.** Si solo los padres son `User`, la columna vale siempre `PARENT`, y
una columna con un único valor posible es ruido que además invita a comprobaciones inútiles.
`FamilyRole` sobrevive como tipo de dominio, que es lo que discrimina el actor. Esto contradice
`config.yaml`; queda escrito en el proposal en lugar de aplicarse en silencio.

**Las constantes de `username` se sustituyen.** El niño no tiene username, así que
`USERNAME_MIN_LENGTH` y `USERNAME_MAX_LENGTH` se quedan sin consumidor. Entran `PIN_LENGTH` y las
constantes que la migración necesita replicar.

### 3. Los invariantes del saldo viven en el motor

Es la decisión central del change. Prisma no genera restricciones `CHECK`, así que la migración
inicial se edita a mano para añadirlas.

| Invariante | Dónde |
|---|---|
| El saldo nunca es negativo | `CHECK (coins >= 0)` en `ChildProfile` |
| Una tarea vale entre 1 y 9999 | `CHECK` en `Task` |
| Un premio cuesta entre 1 y 9999 | `CHECK` en `RewardAssignment` y en `RewardRedemption` |
| La edad está entre 6 y 11 | `CHECK` en `ChildProfile`, admitiendo nulo |
| El historial es inmutable | *trigger* en `CoinTransaction` que rechaza `UPDATE` y `DELETE` |
| No se borra un hijo con historial | `ON DELETE RESTRICT` en `CoinTransaction` |

**Por qué en el motor y no solo en el código.** La validación de entrada protege la puerta principal.
Estas restricciones protegen todo lo demás: una consulta escrita a mano en una madrugada de
incidencia, una migración de datos, un script de importación, un módulo futuro que use `update` en
vez de `increment`. El día que algo de eso ocurra, un `CHECK` convierte una corrupción silenciosa del
saldo de un niño en un error ruidoso.

**Alternativa descartada**: confiar solo en la capa de servicio. Es lo que hace casi todo el mundo, y
funciona hasta que deja de funcionar. El coste de la alternativa elegida es real —las restricciones
viven en SQL, lejos de la constante que las origina— y se paga con la decisión 4.

**Alternativa descartada para la inmutabilidad**: revocar `UPDATE` y `DELETE` sobre la tabla al
usuario de la aplicación. Es más limpio conceptualmente, pero mete la gestión de permisos de
PostgreSQL en el ciclo de despliegue y en el arranque de cada entorno de test. El *trigger* viaja en
la migración, que es donde se puede versionar y probar.

### 4. Los límites se duplican en SQL, y un test lo vigila

Una migración es un artefacto congelado: no puede importar `@monedin/contracts` porque el valor que
se aplicó el día que se ejecutó tiene que seguir siendo ese para siempre. Así que los números
aparecen dos veces, y eso es exactamente el tipo de duplicación que `CLAUDE.md` prohíbe.

La salida no es evitar la duplicación, sino hacerla verificable: un test lee las restricciones vivas
de la base de datos y las compara con las constantes del contrato compartido. Si alguien cambia
`COINS_MAX` y no escribe la migración correspondiente, el test falla nombrando la restricción
descuadrada.

```
   packages/contracts        COINS_MIN = 1, COINS_MAX = 9999
          │                            │
          │ valida la entrada          │ un test compara ambos
          ▼                            ▼
      apps/api  ────────────► PostgreSQL  CHECK (coins BETWEEN 1 AND 9999)
```

Cambiar un límite pasa a ser: editar la constante, escribir una migración que altere la restricción,
y ver el test pasar. Es más trabajo que cambiar un número, y es deliberado: cambiar el rango de
monedas cuando ya hay saldos es una operación que merece pensarse.

### 5. El historial guarda el saldo resultante

`CoinTransaction` registra la cantidad del movimiento **y** el saldo que quedó después. Estrictamente
es redundante: sumando todos los movimientos se llega al mismo número.

Se guarda igualmente porque hace la auditoría barata y, sobre todo, detectable. Comprobar que un
saldo cuadra con su historia no requiere recorrer miles de filas: basta comparar `ChildProfile.coins`
con el `balanceAfter` del movimiento más reciente. Eso convierte "el saldo y el historial han
divergido" en algo que se puede comprobar con una consulta, en vez de en algo que se descubre cuando
un padre reclama.

**Alternativa descartada**: no guardar el saldo en `ChildProfile` y calcularlo siempre sumando el
historial. Elimina por construcción la posibilidad de divergencia, que es tentador, pero convierte
cada lectura de saldo —la operación más frecuente de la aplicación— en una agregación, y hace
imposible la restricción `CHECK (coins >= 0)`, que es justamente la red de seguridad más valiosa.

### 6. Prisma 7: adaptador explícito y cliente generado dentro del repositorio

Las tres condiciones del spike, aplicadas:

```prisma
generator client {
  provider            = "prisma-client"      // no "prisma-client-js"
  output              = "../generated/prisma"
  moduleFormat        = "esm"
  importFileExtension = "js"                 // sin esto, revienta SOLO en producción
}

datasource db {
  provider = "postgresql"                    // sin `url`: Prisma 7 lo rechaza
}
```

La tercera es la que más caro sale si se olvida: por defecto el cliente generado importa sus propios
archivos como `./enums.ts`, con extensión `.ts` literal. `tsx` lo tolera y `tsc` compila sin
quejarse, de modo que desarrollo y build parecen correctos, y el proceso falla con
`ERR_MODULE_NOT_FOUND` al arrancar sobre el JavaScript compilado. Hay una tarea que lo comprueba
ejecutando el artefacto compilado, no solo compilándolo.

**El cliente generado no se versiona.** Son cientos de archivos que ensuciarían cada revisión. A
cambio, hay que generarlo antes de compilar, de comprobar tipos y de ejecutar tests: una tarea
`db:generate` en Turborepo de la que dependen las tres. Esto es lo contrario de lo que se hizo con el
árbol de rutas del front, que sí se versionó por ser un único archivo pequeño.

**`prisma.config.ts` lee `DATABASE_URL`.** Es la segunda y última excepción prevista a la regla del
entorno, y por eso la spec de `runtime-configuration` pasa de "ninguna excepción" a "una lista
cerrada y declarada". Es un archivo de tiempo de CLI: se ejecuta antes de que exista un proceso de
API que pueda validar nada.

### 7. Una única migración inicial, aunque tenga trabajo a mano

El esquema entero entra en una sola migración, generada por Prisma y después editada para añadir las
restricciones y el *trigger* de la decisión 3. No hay datos ni entornos desplegados: partir el
esquema en varias migraciones solo produciría un historial que cuenta el orden en que se escribió el
código, no la evolución del producto.

A partir de la siguiente, cada cambio de esquema va en su propia migración.

### 8. Los tests de datos corren contra PostgreSQL de verdad

Lo que este change aporta son restricciones del motor. Un doble en memoria no las tiene, así que un
test contra un doble comprobaría exactamente lo que no hace falta comprobar.

Cada test parte de un estado conocido. Se usa una base de datos separada de la de desarrollo, creada
y migrada al arrancar la batería, y cada test se ejecuta dentro de una transacción que se deshace al
terminar. Así el orden de ejecución no importa y los datos de desarrollo no se tocan.

**Alternativa descartada**: truncar todas las tablas entre tests. Funciona, pero es más lento y
obliga a mantener la lista de tablas al día cada vez que se añade una.

**Lo que cuesta**: los tests de la capa de datos necesitan Docker levantado. Ya era requisito para
desarrollar, así que no añade nada nuevo, pero sí significa que esa parte de la batería no corre en
una máquina sin contenedores.

## Risks / Trade-offs

**Los límites viven en dos sitios** → el test que compara las restricciones vivas con las constantes
del contrato compartido. Sin ese test, la duplicación se convierte en divergencia silenciosa, que es
peor que no haber puesto las restricciones.

**El *trigger* de inmutabilidad puede estorbar una corrección legítima** → corregir un movimiento
equivocado se hace añadiendo un movimiento que lo compensa, no editando el original. Es la disciplina
normal de un libro contable, y la spec lo recoge como escenario. Si algún día hace falta una
excepción operativa, será una migración deliberada y visible.

**El cliente generado no versionado rompe a quien no ejecute `db:generate`** → la tarea de Turborepo
lo encadena a `build`, `typecheck` y `test`, que es por donde pasa todo el mundo. El riesgo real es
un editor abierto justo después de clonar mostrando errores de tipos hasta la primera instalación;
queda anotado en el README.

**Migrar si el niño necesitase cuenta propia** → asumido en la decisión 1. La migración existiría,
sería laboriosa, y hoy no hay ningún indicio de que vaya a hacer falta.

**Las restricciones `CHECK` se pueden quedar atrás respecto al esquema declarado** → Prisma no las
conoce, así que una migración generada automáticamente podría recrear una tabla y perderlas. Se
mitiga con el test de coherencia, que fallaría, y anotándolo en `CLAUDE.md` como algo que revisar en
cada migración que toque una tabla con restricciones.

## Migration Plan

No hay migración de datos: la base de datos está vacía y no hay usuarios. El orden sí importa:

1. Instalar Prisma y el adaptador, y crear `prisma.config.ts` con su excepción de lint. Comprobar que
   `prisma generate` funciona antes de escribir un solo modelo.
2. Escribir el esquema completo y generar la migración inicial.
3. Editar la migración para añadir restricciones y *trigger*.
4. Aplicarla sobre una base vacía y comprobar que el esquema resultante es el esperado.
5. Cablear el cliente, el cierre ordenado y la traducción de errores.
6. Actualizar `Actor` y las constantes compartidas, que es lo que rompe compilación en el andamio ya
   escrito.
7. Tests contra la base de datos real.

**Reversión**: borrar el volumen de PostgreSQL y revertir el commit. No hay estado que preservar.

**Criterio de terminado**: ver los escenarios de las cuatro specs. Resumido — una base vacía llega al
esquema completo aplicando migraciones; el motor rechaza un saldo negativo, una tarea de cero monedas
y un intento de editar el historial; y el artefacto compilado arranca sobre `node` sin
`ERR_MODULE_NOT_FOUND`.

## Open Questions

Deferibles sin afectar a las specs ni al desglose de tareas:

- Si el historial necesitará algún día un movimiento de tipo "ajuste manual" expuesto en la interfaz,
  o basta con que exista el motivo en el enum para correcciones desde la consola. Añadir la interfaz
  después no toca el esquema.
- El tamaño de la reserva de conexiones. Es configuración del adaptador y depende del servidor real,
  que todavía no existe.
- Si conviene una vista o una consulta materializada para el listado de tareas de un padre con muchos
  hijos. Se decidirá con datos de uso, no antes.
- Cuántos dígitos tendrá el PIN. Afecta a una constante y a la interfaz de acceso, no al esquema:
  la columna guarda un hash de longitud fija en cualquier caso. Se cierra en `add-authentication`.

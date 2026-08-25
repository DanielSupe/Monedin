## Context

Ver `proposal.md` para la motivación. Lo que condiciona el diseño es lo que ya existe:

- **Las tablas están desde la migración inicial.** `Reward`, `RewardAssignment` con su clave compuesta
  `(rewardId, childId)`, su `CHECK` de rango de precio y su índice por `childId`. Este change no
  necesita tocar el esquema, y eso es una condición a verificar, no una suposición.
- **`add-tasks` dejó escrito el patrón de módulo de dominio completo**: repositorio con transacción,
  servicio que autoriza, controlador sin roles, rutas con `moduleRouter()`, y la trampa del orden de
  `/tasks/mine` antes de `/tasks/:taskId`. Aquí se copia entero.
- **La regla de «las dos formas del precio» ya existe**, dentro de `createTaskSchema`. Este es el
  segundo cliente, así que toca sacarla de ahí.
- **El patrón de paginación existe** desde `add-children`, con `.extend()` para los filtros.
- **Este change no mueve una sola moneda.** No hay `applyCoinMovement`, no hay transición condicional
  y no hay doble tap que probar. Eso vuelve en `add-redemptions`.

## Goals / Non-Goals

**Goals:**

- Que el precio por hijo sea imposible de filtrar entre hermanos, y que eso esté demostrado por un
  test y no por una lectura atenta del serializador.
- Dejar escrito el patrón de **reemplazo atómico de un conjunto de filas puente**, que es lo que
  copiará cualquier módulo futuro con una relación de muchos a muchos con datos propios.
- Sacar la regla de las dos formas del precio a un sitio compartido antes de que exista una tercera
  copia.

**Non-Goals:**

- Rendimiento. Un catálogo familiar son decenas de premios, no millones.
- Un historial de cambios de precio. Lo que un premio costó ayer no se guarda; lo que se congela es
  el precio **del canje**, y eso ya lo garantiza el modelo de datos.
- Que `affordable` sea una promesa. Es una pista para la interfaz, no una reserva.

## Decisions

### 1. Un premio es UNA fila. Una tarea eran N, y ahí está toda la diferencia

Es la decisión que da forma al módulo entero, y conviene ser explícito porque el instinto —después de
`add-tasks`— es copiar `batchId`.

```
   TAREA repartida entre dos hijos        PREMIO ofrecido a dos hijos
   ───────────────────────────────        ───────────────────────────
   tasks                                  rewards
     id=t1  batchId=b  child=Ana            id=r1  "Ir al cine"
     id=t2  batchId=b  child=Bruno
                                          reward_assignments
   Dos filas con VIDA PROPIA:               (r1, Ana)   coins=200
   Ana la termina, Bruno no.                (r1, Bruno) coins=150

   Corregir el título de la de Ana         Corregir el título del premio
   NO toca la de Bruno.                    lo cambia para LOS DOS.
```

La tarea se reparte en copias porque cada niño la hace o no la hace por separado: el estado es de
cada uno. El premio no se «hace»: existe en el catálogo y se ofrece. Por eso el precio no vive en el
premio sino en la oferta, y por eso **aquí no hay reparto, ni `batchId`, ni nada que se le parezca**.

**Alternativa descartada:** duplicar el premio por hijo, como las tareas. Daría uniformidad
superficial y convertiría «cambiar el título» en N escrituras que pueden divergir, que es exactamente
el problema que la tabla puente ya resolvió en el modelo de datos.

### 2. La regla de las dos formas se extrae, no se copia

`createTaskSchema` ya la lleva dentro: `{ childIds, coins }` o `{ assignments: [{ childId, coins }] }`,
con un `.refine()` que exige exactamente una y otro que rechaza hijos repetidos. El alta de premios
necesita **lo mismo palabra por palabra**.

Se mueve a `packages/contracts/src/schemas/coins-per-child.ts`, que exporta los tres campos, la
función que aplica los dos `.refine()` sobre un esquema de objeto, y la normalización a una lista de
`{ childId, coins }`. `schemas/tasks.ts` pasa a usarla y `normalizeAssignments` sale de
`tasks.service.ts` para vivir junto a la regla que la justifica.

No es una refactorización de oportunidad: es la regla 3 de `CLAUDE.md`. La segunda copia es cuando
todavía sale barato; la tercera es cuando alguien corrige el mensaje de error en una sola.

**Alternativa descartada:** copiar el bloque en `schemas/rewards.ts`. Son unas veinte líneas, y en
seis meses el mensaje de «hay un hijo repetido» diría cosas distintas en tareas y en premios sin que
nadie supiera cuál era la buena.

### 3. Las ofertas se reemplazan borrando y recreando, en una transacción

`PUT /rewards/:rewardId/assignments` recibe el conjunto completo. Dentro de una transacción:

```
   deleteMany({ rewardId })          -- se van todas
   createMany(las del conjunto)      -- entran las que manda el padre
```

Y no un `upsert` por hijo calculando la diferencia. La razón es que **una asignación no tiene nada
que conservar**: es una clave compuesta y un número. No lleva historial, nadie la referencia y
`RewardRedemption` guarda su propio precio congelado apuntando al premio y al hijo, **no a la
asignación**. Borrarla y volver a crearla es indistinguible de haberla actualizado.

La consecuencia que se acepta a conciencia: el `createdAt` de las ofertas que sobreviven se reinicia
en cada reemplazo. No se enseña en ninguna parte y nada depende de él.

**Alternativa descartada:** tres endpoints —asignar, cambiar precio, desasignar—. Obliga a la
interfaz a calcular la diferencia y deja estados a medias visibles si falla la segunda de tres
llamadas. Poner o quitar un hijo de un premio es **una** decisión del padre.

### 4. Retirar es 404 al segundo intento, no 409

La regla que `add-tasks` dejó escrita, aplicada tal cual:

> El 409 es para transiciones **con efecto secundario**.

Retirar un premio no acredita ni descuenta nada, así que quien pierde la carrera pregunta por un
premio que ya no está en el catálogo activo: es el 404 de siempre, el mismo que da la baja de un
hijo. Se escribe con `updateMany` condicionado a `isActive: true` y se comprueba que afectó
exactamente una fila.

### 5. `affordable` lo calcula el servidor, por ítem, y es una PISTA

El escaparate del niño devuelve en cada premio si su saldo alcanza. Tres cosas, y las tres son
decisiones:

- **Por ítem y no en la envoltura.** `pageOf()` tiene forma fija —`items`, `page`, `pageSize`,
  `total`, `totalPages`— y meterle un `coins` suelto la cambiaría para todos los listados del
  proyecto. El saldo se refleja donde se usa.
- **En el servidor y no en el front.** El front tendría que combinar el saldo del actor con el precio
  de cada premio, y el saldo del actor puede llevar minutos en caché. La comparación se hace donde el
  dato es fresco.
- **El saldo se lee en la MISMA transacción que la página.** Si no, un premio puede salir marcado
  como alcanzable con un saldo de hace dos consultas.

Y aun así **no es una promesa**: entre que el niño lo ve y lo pide puede haberse gastado las monedas.
Por eso `add-redemptions` valida el saldo **dos veces** —al solicitar y al aprobar—, que es una
decisión ya cerrada del producto. `affordable` sirve para pintar un botón, no para autorizar nada.

### 6. El filtro del catálogo es un estado, no un booleano

`GET /rewards?status=ACTIVE|RETIRED`, con `ACTIVE` por defecto. No `?includeRetired=true`.

Por defecto los activos porque el catálogo es una herramienta de trabajo y lo retirado es archivo: si
la primera pantalla mezcla las dos cosas, el padre tiene que leer para distinguirlas. Y un estado en
vez de un booleano porque «activo o retirado» puede crecer —un premio agotado, uno programado— y un
booleano no crece sin renombrarse.

**Alternativa descartada:** enseñarlo todo y que el front filtre. Rompe la paginación: la página 1 de
veinte premios podría traer quince retirados.

### 7. Siete rutas, y el mismo orden que salvó a `/tasks/mine`

```
   POST   /rewards                        padre   publicar
   GET    /rewards                        padre   catálogo paginado + filtro
   GET    /rewards/mine                   niño    escaparate            <-- ANTES que :rewardId
   GET    /rewards/:rewardId              ambos   detalle
   PATCH  /rewards/:rewardId              padre   título y descripción
   PUT    /rewards/:rewardId/assignments  padre   reemplazar el conjunto
   DELETE /rewards/:rewardId              padre   retirar (lógico)
```

`/rewards/mine` se registra **antes** que `/rewards/:rewardId`. Express casa por orden de registro, y
al revés «mine» entraría por el parámetro, el servicio buscaría un premio con ese identificador y el
niño recibiría un 404 en su propia pantalla. El fallo no es ruidoso, así que lleva test, igual que en
`children` y en `tasks`.

El detalle es la única ruta sin filtro de rol, como en `tasks`: sirve a los dos y **la rama por rol
vive en el servicio**, nunca en el controlador. `PUT` para el reemplazo del conjunto y no `PATCH`
porque no es una actualización parcial: lo que se manda es el estado completo de las ofertas.

### 8. Sin migración, y hay que comprobarlo

Todo lo que este change necesita está en el motor desde `add-data-model`. La comprobación no es
opcional: se corre `prisma migrate dev` y **si genera algo, es que se coló un cambio de modelo que
nadie pidió**. El test de coherencia de límites ya cubre que `reward_assignments_coins_range` siga en
su sitio.

### Se difiere a un change posterior

- **Las imágenes** (`Reward.image`) a `add-file-storage`. La columna se queda vacía y ningún endpoint
  la acepta todavía: aceptarla sin saber qué guarda sería inventarse el contrato dos veces.
- **Pedir un premio** a `add-redemptions`, con la validación doble del saldo y el doble tap del
  descuento.
- **Reactivar un premio retirado.** No se descarta como en la baja de un hijo, simplemente no hace
  falta aún.

## Risks / Trade-offs

**`affordable` puede estar obsoleto para cuando el niño toque** → Se acepta y se documenta: es una
pista de interfaz. La garantía está en la validación doble del saldo de `add-redemptions`, y este
change no promete nada que aquel no vaya a comprobar.

**Reemplazar el conjunto borra y recrea filas** → Sin consecuencias, porque una asignación no lleva
historial y los canjes no la referencian. Lo único que se pierde es su `createdAt`, que nadie lee.
Si algún día una asignación tuviera datos propios que conservar, esta decisión hay que reabrirla.

**Un premio sin ninguna oferta es un estado válido** → Es deliberado: es cómo se retira la oferta a
todos sin retirar el premio. Sale en el catálogo del padre sin asignaciones y en ningún escaparate.
El riesgo es que parezca un error; lo cubre un escenario de la spec para que la interfaz lo trate.

**Dos padres editando el mismo premio a la vez** → El último gana, sin detección de conflicto. Es un
título y una descripción, no un saldo: sobrescribir no corrompe nada y el otro padre lo ve al
recargar. Añadir control de versiones aquí sería precio sin beneficio.

**Aparecen dos listados que se parecen y no son el mismo** → El catálogo del padre y el escaparate
del niño devuelven cosas distintas —uno lleva todas las ofertas, el otro un solo precio— y la tentación
de servirlos con un parámetro es real. Se declaran como dos formas distintas en el contrato, por la
misma razón que `Task` y `OwnTask`: es lo que hace imposible que el precio del hermano se cuele.

## Migration Plan

Ninguna migración. El despliegue es el habitual: `pnpm db:generate`, lint, typecheck y tests.

Revertir es retirar el commit: no hay datos escritos por este change que otro necesite, y las tablas
que usa ya estaban vacías antes de él.

## Why

Monedín ya sabe **ganar**. Un niño completa tareas, su padre las aprueba y el saldo sube dejando su
rastro en el historial. Lo que no sabe es **para qué sirve ese saldo**.

Eso deja el producto a medias justo donde más importa. Lo que enseña es el ciclo esfuerzo → ingreso →
**decisión de gasto**, y hoy el saldo de un niño es un número que solo crece: no hay nada que mirar,
nada que desear y ninguna razón para preferir ahorrar a gastar. Sin eso, aprobar una tarea es
contabilidad, no educación financiera.

Este change construye la mitad del catálogo que falta: el padre publica premios y decide **cuánto le
cuesta a cada hijo**, y el niño ve su escaparate —qué puede pedir, a cuánto le sale a él, y si le
alcanza ya o le faltan monedas—. Canjearlos llega justo después, en `add-redemptions`.

Y es el primer módulo donde **una entidad se comparte entre hermanos** en vez de duplicarse. Una
tarea repartida entre dos hijos son dos filas con estado propio; un premio es **una sola fila** del
catálogo que se asigna a varios. Esa diferencia es la que decide toda la forma del módulo.

## What Changes

- **Módulo `rewards` nuevo**, con las cinco capas de la anatomía habitual.
- **Un padre publica un premio y lo asigna a uno o varios hijos**, cada uno con **su propio precio**.
  El alta acepta las mismas dos formas que el reparto de tareas: el mismo precio para todos, o uno
  distinto por hijo. Es todo o nada: si alguno de los hijos no existe o no es suyo, no se crea nada.
- **El premio existe una vez; lo que se multiplica es la asignación.** El mismo cine cuesta 200 al
  mayor y 150 al menor, y editar su título lo cambia para los dos a la vez. No hay reparto ni nada
  parecido a `batchId` aquí.
- **El conjunto de asignaciones se reemplaza entero**, en una sola operación: el padre decide de una
  vez quién puede pedir ese premio y por cuánto, en vez de encadenar altas y bajas por hijo.
- **El padre ve su catálogo** paginado, con las asignaciones de cada premio y un filtro para
  distinguir lo activo de lo retirado.
- **Editar un premio** cambia título y descripción. El precio no vive en el premio, así que cambiarlo
  es cambiar su asignación.
- **Retirar un premio es lógico y no destruye nada**: deja de poder pedirse y desaparece del
  escaparate, pero sigue en el catálogo del padre y los canjes que existieran se conservan.
- **El niño ve su escaparate**: solo los premios activos asignados a él, con **su** precio y con si
  le alcanza el saldo. Nunca ve el precio de su hermano ni un premio que no sea suyo.
- **Front funcional**, sin sistema de diseño: el alta y el catálogo para el padre, y el escaparate
  para el niño.
- **Sin migración.** `Reward`, `RewardAssignment`, sus índices y sus `CHECK` están desde la migración
  inicial. Este change no toca el esquema, y que no lo toque es algo que hay que comprobar.

## Capabilities

### New Capabilities

- `rewards`: el ciclo de vida de un premio del catálogo —publicarlo, asignarlo a cada hijo con su
  propio precio, editarlo y retirarlo— junto con lo que cada hijo ve de él, quién puede hacer cada
  cosa, y qué garantiza que el precio de un hermano no se filtre en la respuesta del otro.

### Modified Capabilities

Ninguna. `family-data-model` ya recoge los tres requisitos de almacén que este change necesita —el
precio propio por hijo, la unicidad de la asignación y que retirar un premio no destruya sus canjes—
y ninguno cambia. Este change no mueve una sola moneda, así que `coin-ledger` tampoco se toca.

## Impact

**Código nuevo**: `apps/api/src/modules/rewards/` (cinco capas) y
`packages/contracts/src/schemas/rewards.ts`. En el front, `apps/web/src/api/rewards.ts`,
`apps/web/src/features/rewards/` y la ruta `apps/web/src/routes/rewards.tsx`.

**Código modificado**: `apps/api/src/app.ts` para registrar el router, el catálogo de mensajes de la
API, `apps/api/prisma/seed.ts`, y en el front el catálogo de textos y la home de cada rol.

**Contrato compartido**: la regla de «las dos formas del precio» se **extrae** de `schemas/tasks.ts`
a un archivo compartido en vez de copiarse. Es el mismo problema del padre —«esto vale lo mismo para
todos» contra «al mayor le cuesta más»— y dos gramáticas distintas para lo mismo se acaban pagando en
la interfaz.

**Base de datos**: ninguna migración.

**API**: siete rutas nuevas bajo `/rewards`. Ninguna rompe un contrato existente.

**Arquitectura**: estrena el reemplazo atómico de un conjunto de filas puente, que es el patrón que
copiará cualquier módulo futuro con una relación de muchos a muchos con datos propios.

## No incluye

- **Canjear.** El escaparate se mira y no se abre: pedir un premio y que el padre lo resuelva
  —descontando— es `add-redemptions`, y es donde vuelve el doble tap.
- **Imágenes de premio.** La columna `Reward.image` existe y se queda vacía: las imágenes propias
  necesitan S3 y llegan en `add-file-storage`.
- **Reactivar un premio retirado.** A diferencia de la baja de un hijo, no se descarta para siempre;
  simplemente no hace falta todavía y no se inventa el endpoint antes de tiempo.
- **Borrado físico** de un premio, que además la clave ajena restrictiva de los canjes impide.
- **Tope de premios por familia.** Un catálogo largo es desorden, no una incoherencia de datos.
- **Categorías, etiquetas, orden manual o destacados** en el catálogo.
- **Que un premio se agote**, tenga existencias o caduque.
- **El historial de monedas visible para el padre**, que sigue aplazado y merece su propia pantalla.
- **Sistema de diseño.** El front sigue siendo el andamio con estilos en línea.

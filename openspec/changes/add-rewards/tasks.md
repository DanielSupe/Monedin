## 1. La regla compartida del precio por hijo

- [x] 1.1 Crear `packages/contracts/src/schemas/coins-per-child.ts` con los tres campos
      (`childIds`, `coins`, `assignments`), la función que aplica los dos `.refine()` —exactamente
      una forma, y ningún hijo repetido— y la normalización a una lista de `{ childId, coins }`.
- [x] 1.2 Reescribir `createTaskSchema` sobre esa pieza y mover `normalizeAssignments` de
      `tasks.service.ts` al contrato. **Los tests de contratos y de tareas tienen que pasar sin
      tocarles una línea**: es lo único que demuestra que la extracción no cambió comportamiento.
- [x] 1.3 Confirmar que `pnpm exec prisma migrate dev` **no genera ninguna migración**. Si genera
      algo, parar: se coló un cambio de modelo que este change no pidió.

## 2. Contratos de premios

- [x] 2.1 Crear `packages/contracts/src/schemas/rewards.ts` con `createRewardSchema` (sobre la pieza
      compartida), `updateRewardSchema`, `replaceAssignmentsSchema`, `rewardParamsSchema`,
      `listRewardsQuerySchema` y `listOwnRewardsQuerySchema`, todos los de entrada `.strict()`.
- [x] 2.2 Que `updateRewardSchema` **no acepte `coins`** y que `listOwnRewardsQuerySchema` **no
      acepte `childId`**. Al ser estrictos, ambas cosas son 422 y no un campo ignorado: es donde
      viven las dos garantías de este módulo.
- [x] 2.3 Definir las respuestas: `rewardSchema` (el premio con TODAS sus ofertas, para el padre) y
      `ownRewardSchema` (un solo precio, el suyo, más `affordable`), y sus páginas con `pageOf()`.
      Son dos formas distintas a propósito, no una con un parámetro.
- [x] 2.4 Extender la paginación con el filtro de estado usando `paginationQuerySchema.extend({ ... })`
      y exportar el archivo desde `src/index.ts`.
- [x] 2.5 Tests en `packages/contracts/tests/contracts.test.ts`: las dos formas del alta por
      separado, con las dos a la vez falla, un `coins` en la edición del premio falla, un `childId`
      en la query del niño falla, y el estado del filtro rechaza un valor inventado.

## 3. Módulo `rewards`: datos

- [x] 3.1 Crear `apps/api/src/modules/rewards/rewards.errors.ts` con `RewardNotFoundError`,
      `ParentRoleRequiredError` y `ChildRoleRequiredError`, y añadir la sección `rewards` al catálogo
      de mensajes de la API reutilizando `rolRequerido`.
- [x] 3.2 Crear `rewards.repository.ts` con el alta: crea el premio y sus ofertas **en una sola
      transacción**, y devuelve el premio ya con ellas.
- [x] 3.3 Implementar `findChildIdsOwnedBy()` para comprobar de una vez que todos los hijos son suyos
      y están activos. Si `children` ya expone uno equivalente, reutilizarlo en vez de duplicarlo.
- [x] 3.4 Implementar `findRewardsPage()` para el padre: filtro por estado, con las ofertas de cada
      premio, contando y leyendo **en la misma transacción** y con el desempate por `id` en el
      `orderBy`.
- [x] 3.5 Implementar `findOwnRewardsPage()` para el niño: solo activos ofrecidos a él, con **su**
      precio, y **leyendo su saldo en la misma transacción** que la página, para que `affordable` no
      se calcule contra un saldo viejo.
- [x] 3.6 Implementar `findRewardById()` devolviendo `parentId` y las ofertas, para que el servicio
      decida qué significan.
- [x] 3.7 Implementar `updateReward()` para título y descripción.
- [x] 3.8 Implementar `replaceAssignments()`: `deleteMany` de las del premio y `createMany` de las
      nuevas, **en una transacción**, con el comentario de por qué borrar y recrear es correcto aquí
      —una oferta no lleva historial y ningún canje la referencia—.
- [x] 3.9 Implementar `retireReward()` como `updateMany` condicionado a `isActive: true`, devolviendo
      cuántas filas cambió.

## 4. Módulo `rewards`: reglas y autorización

- [x] 4.1 Crear `rewards.service.ts` con `createReward(actor, input)`: normaliza las dos formas,
      comprueba **todos** los hijos antes de crear nada, y crea.
- [x] 4.2 Implementar `listRewards` y `getReward` para el padre, con el patrón de la casa: rol
      primero, pertenencia después, y **404 y no 403** para un premio ajeno.
- [x] 4.3 Implementar `listOwnRewards` y `getOwnReward` para el niño tomando el perfil de
      `actor.childProfileId`, nunca de la petición, y calculando `affordable` contra su saldo.
- [x] 4.4 Implementar `getRewardForActor`, que ramifica por rol **en el servicio** y no en el
      controlador, como hace `tasks` con su detalle.
- [x] 4.5 Implementar `updateReward` y `replaceAssignments`, este último comprobando los hijos del
      conjunto entero antes de tocar ninguna fila.
- [x] 4.6 Implementar `retireReward`, traduciendo el «cero filas afectadas» a **404** y no a
      conflicto: retirar no mueve monedas. Ver la decisión 4 del design.

## 5. Módulo `rewards`: HTTP

- [x] 5.1 Crear `rewards.controller.ts` con `validatedPart`, `actorOf`, 201 en el alta, 200 en las
      ediciones y 204 al retirar. Cero autorización.
- [x] 5.2 Crear `rewards.routes.ts` con las siete rutas y **`/rewards/mine` registrada antes que
      `/rewards/:rewardId`**, con el comentario del fallo silencioso que evita. `PUT` para el
      reemplazo del conjunto de ofertas.
- [x] 5.3 Registrar `rewardsRouter` en `apps/api/src/app.ts` y comprobar que el test de rutas de solo
      cuenta sigue en verde: ninguna de estas lo es.

## 6. Tests del catálogo del padre

- [x] 6.1 Alta: las dos formas, **un solo premio** con una oferta por hijo, y cada hijo con su precio.
- [x] 6.2 Alta, todo o nada: con un hijo ajeno, uno dado de baja o un id inexistente entre los
      indicados, se rechaza y **no queda creado ningún premio**.
- [x] 6.3 Alta, validación: las dos formas a la vez y ninguna dan 422; un hijo repetido da 422; un
      precio en 0 y en 10000 dan 422 **antes** de tocar la base; un niño publicando recibe 403.
- [x] 6.4 Catálogo: un premio ofrecido a dos hijos aparece **una vez** con las dos ofertas; uno sin
      ofertas aparece igualmente, con la lista vacía.
- [x] 6.5 Catálogo, filtro y paginación: por defecto solo activos, `RETIRED` solo retirados, el total
      cuenta premios, y una página posterior a la última devuelve lista vacía y no 404.
- [x] 6.6 Edición: cambiar el título lo cambia para los dos hijos y **no toca ningún precio**; mandar
      `coins` da 422; un niño editando recibe 403.
- [x] 6.7 Aislamiento: un padre no ve ni toca premios de otra familia, y el 404 es indistinguible del
      de un identificador inventado.

## 7. Tests de las ofertas y del escaparate

- [x] 7.1 Reemplazo: quitar un hijo del conjunto lo deja sin el premio; cambiar su precio no toca el
      de sus hermanos; un conjunto vacío deja el premio sin ofertas y sin desaparecer del catálogo.
- [x] 7.2 Reemplazo, todo o nada: con un hijo ajeno en el conjunto se rechaza y **las ofertas quedan
      exactamente como estaban**; sobre un premio ajeno, 404.
- [x] 7.3 Retirar: sale del escaparate del niño, sigue en el catálogo del padre bajo el filtro de
      retirados, el segundo intento da **404**, y un niño intentándolo recibe 403.
- [x] 7.4 Escaparate: el niño obtiene los premios ofrecidos a él con su precio; los ofrecidos solo a
      su hermano no aparecen; los retirados tampoco.
- [x] 7.5 **El precio del hermano no está en el cuerpo de la respuesta.** Es el test que justifica que
      el escaparate sea una forma distinta y no el catálogo con un parámetro: se comprueba sobre el
      JSON serializado, no sobre los campos que el test decide mirar.
- [x] 7.6 `affordable`: le alcanza, no le alcanza, y **le alcanza justo** cuando el precio coincide
      con el saldo.
- [x] 7.7 `affordable` después de cobrar: se le aprueba una tarea que le deja alcanzar un premio que
      antes no alcanzaba, y al volver a pedir el escaparate ya sale como alcanzable.
- [x] 7.8 Roles cruzados: un padre pidiendo `/rewards/mine` recibe 403 y un niño pidiendo el catálogo
      también; el detalle sirve a los dos, cada uno con su vista.
- [x] 7.9 Fugas: ninguna respuesta contiene `parentId` ni datos de otra familia.

## 8. Front

- [x] 8.1 Crear `apps/web/src/api/rewards.ts` con las llamadas y sus claves de consulta propias.
- [x] 8.2 Crear `features/rewards/use-rewards.ts` con los hooks y las invalidaciones: retirar y
      reemplazar ofertas invalidan **el catálogo y el escaparate**, porque las dos vistas leen las
      mismas filas.
- [x] 8.3 Escribir `describeRewardsError`, con el test que impide reutilizar el de `tasks`: aquí un
      404 es «ese premio ya no está», no «esa tarea ya no está pendiente».
- [x] 8.4 Añadir el bloque `rewards` a `lib/messages.ts`.
- [x] 8.5 Crear `features/rewards/RewardForm.tsx`: título, descripción, selector de varios hijos y
      precio —el mismo para todos o uno por hijo—, validando con el esquema del contrato antes de
      enviar.
- [x] 8.6 Crear `features/rewards/RewardCatalog.tsx`: los premios con sus ofertas, el filtro de
      activos y retirados, el editor del conjunto de ofertas y el botón de retirar.
- [x] 8.7 Crear la ruta `routes/rewards.tsx` envuelta en `ParentOnly` con su `fallback`, y enlazarla
      desde la home del padre.
- [x] 8.8 Crear `features/rewards/MyRewards.tsx` para el niño: su escaparate con su precio, lo que le
      alcanza destacado y **cuánto le falta** en lo que no, con entrada desde su home.
- [x] 8.9 Tests en `apps/web/tests/rewards-client.test.ts`: las rutas salen del contrato, el query
      string del filtro es el esperado, el alta no envía campos de más, la llamada del escaparate no
      lleva identificador de hijo, y una página sin `items` falla como forma inesperada.

## 9. Sembrado y cierre

- [x] 9.1 Actualizar `apps/api/prisma/seed.ts`: los premios sembrados ya tienen precios distintos por
      hijo, así que añadir **uno retirado** y **uno sin ofertas** para que el catálogo enseñe los tres
      casos desde el primer arranque.
- [x] 9.2 Actualizar `openspec/config.yaml`: mover `/rewards` a lo construido, con las siete rutas y
      el reemplazo en bloque.
- [x] 9.3 Documentar en `CLAUDE.md` el patrón de **reemplazo atómico de un conjunto de filas puente**,
      y cuándo NO aplica: en cuanto la fila puente tenga algo que conservar, hay que volver al diff.
- [x] 9.4 Corregir el estado del proyecto en `README.md`, que sigue diciendo que no hay módulos de
      dominio cuando `/children` y `/tasks` llevan dos changes construidos. Se detectó aquí, se
      arregla aquí.
- [ ] 9.5 Pasar `pnpm db:generate`, `lint`, `typecheck` y `test` en verde **desde `apps/api`** para la
      batería de la API, lanzándola en segundo plano porque tarda unos 14 minutos.
- [x] 9.6 Recorrer a mano con `pnpm dev`: publicar un premio con precio distinto para dos hijos,
      entrar como el menor y ver **su** precio y que no le alcanza, aprobarle tareas hasta que le
      alcance, volver como padre a quitarle la oferta a un hijo y comprobar que desaparece de su
      escaparate, y retirar el premio para verlo salir de los dos.
- [ ] 9.7 Sincronizar las specs y archivar el change.

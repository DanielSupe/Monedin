## 1. Mensajes y constantes

- [ ] 1.1 Añadir a `apps/web/src/lib/messages.ts` el bloque del panel: saludo del padre —hoy
      incrustado en `routes/index.tsx`—, título de lo que espera, las dos frases de bandeja en
      singular y plural, la frase de «todo al día», el título del bloque de hijos y su enlace al
      listado.
- [ ] 1.2 Retirar el literal `Hola, {actor.name}` de `apps/web/src/routes/index.tsx` y dejar esa rama
      montando el panel, sin dibujar nada. Es la regla 1 y la de que un archivo de ruta monta el
      destino.

## 2. Las cifras

- [ ] 2.1 Crear `apps/web/src/features/parents/use-parent-console.ts` con el hook que reúne las tres
      consultas, usando las claves de consulta que ya tienen los listados para que la caché sirva.
- [ ] 2.2 Contar las tareas por aprobar como **filas en `COMPLETED`** dentro de los repartos
      recibidos, con `pageSize: MAX_PAGE_SIZE`, y devolver junto a la cifra si es exacta o es un
      mínimo (`totalPages > 1`). Comentar ahí por qué no vale ni `total` ni el número de filas.
- [ ] 2.3 Contar los canjes pendientes leyendo `total` con `pageSize: 1`, y comentar al lado por qué
      esta cuenta sí puede hacerlo y la de tareas no: las dos listas tienen unidades distintas.
- [ ] 2.4 Traer los hijos con una sola página y comentar de qué relación entre constantes depende.

## 3. El panel

- [ ] 3.1 Crear `apps/web/src/features/parents/ParentConsole.tsx`: saludo, bloque de lo que espera,
      bloque de saldos y cambiar de perfil. Con las piezas del sistema y sin un solo estilo en línea.
- [ ] 3.2 Los avisos de bandeja llevan a su listado **con el filtro aplicado** —`/tasks` en
      `COMPLETED`, `/redemptions` en `PENDING`—, cada uno como un único elemento interactivo.
- [ ] 3.3 Un aviso con cero no se dibuja; con las dos bandejas vacías, una sola frase de «todo al
      día». Y la cifra que sea un mínimo se enseña con `+`.
- [ ] 3.4 Bloque de saldos con `Avatar` y `Coins` por hijo, filas NO interactivas, y un solo enlace a
      `/children` para el bloque entero.
- [ ] 3.5 Estados de carga y de error con `Skeleton` y `Alert`, como el resto de las pantallas ya
      vestidas.
- [ ] 3.6 Borrar `apps/web/src/features/auth/ParentHome.tsx`, que este panel sustituye entero.

## 4. La cuenta del padre

- [ ] 4.1 Vestir `ParentAvatarScreen`: `Card`, `Avatar`, el subidor tal cual, y `Alert` en vez del
      `<p style={{ color: "#b00020" }}>`. Sin enlace de vuelta.
- [ ] 4.2 Vestir `ChangePinScreen` con `Field`, `Input`, `Button` y `Alert`. Sin enlaces de vuelta.
- [ ] 4.3 Reescribir `routes/account.tsx` como una pantalla con dos partes, sin estilo en línea, y
      montar ahí cerrar sesión.
- [ ] 4.4 Quitar cerrar sesión del inicio; `LeaveProfile` se queda en el panel.

## 5. Hacer cumplir

- [ ] 5.1 Retirar de `apps/web/eslint.config.js` y de `apps/web/tests/ui/style-rules.test.ts` las
      entradas `ParentAvatarScreen.tsx`, `ChangePinScreen.tsx` y `routes`, y actualizar el recuento
      del comentario: de 13 a 10.
- [ ] 5.2 Test del recuento de tareas contra **un reparto de estados mezclados** —una `PENDING`, una
      `COMPLETED`, una `APPROVED`—, comprobando que sale 1 y no 1-por-reparto ni 3-por-filas. Y otro
      con dos repartos de dos completadas cada uno, que da 4.
- [ ] 5.3 Test de que una cifra que se queda corta se enseña como mínimo, y de que con las dos
      bandejas a cero aparece la frase y no aparece ningún cero.
- [ ] 5.4 Test de que cada aviso lleva a su listado con el filtro en la dirección.
- [ ] 5.5 Test que compara `MAX_CHILDREN_PER_FAMILY` con `DEFAULT_PAGE_SIZE`, para que subir el
      máximo por encima del tamaño de página falle en vez de esconder hijos.
- [ ] 5.6 `pnpm turbo run lint typecheck test build`, y si la máquina va cargada, con
      `--concurrency=1`. Mirar el panel y `/account` en escritorio y a 390 px, con datos y sin ellos.

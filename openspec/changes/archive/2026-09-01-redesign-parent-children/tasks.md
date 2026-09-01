## 1. El listado

- [x] 1.1 `ChildrenList.tsx` vestido: tarjetas con `Card`, `Avatar`, `Coins` y `Badge`, con
      `Skeleton`, `Alert` y `EmptyState` para sus estados, y `Pagination` en vez de la cuarta copia
      del bloque.
- [x] 1.2 El estado bloqueado con `Badge tone="warning"` y su texto, no con un color a mano.
- [x] 1.3 Desbloquear solo si está bloqueado; el resto de acciones siempre.
- [x] 1.4 El enlace a crear un perfil, con `buttonClasses`.

## 2. Lo que se confirma y lo que se escribe

- [x] 2.1 La baja pasa a `Dialog`, con su texto actual —que ya dice que no se deshace— y el fallo con
      `Alert` y `alertToneFor`.
- [x] 2.2 Reponer el PIN pasa a ser un `<form>` con envío, dentro de la fila.
- [x] 2.3 Añadir al catálogo de mensajes lo que falte para el título del diálogo.

## 3. El formulario y sus dos envoltorios

- [x] 3.1 `ChildForm.tsx` vestido con `Card`, `Field`, `Input`, `Button` y `Alert`, conservando la
      validación con los esquemas del contrato ANTES de enviar y el porqué de que el PIN solo salga
      en el alta.
- [x] 3.2 Conservar que solo una clave del catálogo viaja como `avatar`, y el comentario que lo
      explica: una URL es lo que YA está guardado, no un cambio que pedir.
- [x] 3.3 `CreateProfileScreen.tsx` y `EditChildScreen.tsx` vestidas, teniendo en cuenta que la
      primera se usa SIN actor y lleva `EntryShell`.
- [x] 3.4 Dejar escrito en `ChildForm` por qué subir foto solo aparece al editar, y a qué change se
      ha asignado esa deuda.

## 4. Hacer cumplir

- [x] 4.1 Retirar las cuatro entradas de las dos listas de deuda: de 5 a 1.
- [x] 4.2 Test de que la baja se confirma en un diálogo, que cerrar con Escape no da de baja a nadie,
      y que confirmar sí llama al servidor.
- [x] 4.3 Test de que un perfil bloqueado se distingue de uno que no lo está **por algo más que el
      texto**, comparando los dos, y de que desbloquear solo se ofrece al bloqueado.
- [x] 4.4 Test de que reponer el PIN se envía con Enter.
- [x] 4.5 **Inyectar las violaciones**: dar de baja sin diálogo, y poner el mismo tono en bloqueado y
      sin bloquear. Los dos tests tienen que caer. Toda sustitución de código lleva `assert`, y se
      comprueba que el test cae ANTES de darlo por bueno.
- [x] 4.6 `pnpm lint` del paquete web **antes** de lanzar la batería, que es donde cayó la anterior.
- [x] 4.7 `pnpm turbo run lint typecheck test build --concurrency=1`: **13/13** a la primera, con las
      cuatro tareas del web ejecutadas y no servidas de caché (347 tests, 37 archivos). Lanzar el
      lint ANTES —tarea 4.6— es lo que evitó repetir la pasada perdida del change anterior.
      **Queda pendiente de TI** abrir las cuatro pantallas en escritorio y a 390 px: cómo se ven no lo
      cubre ningún test.

## 5. Cerrar la deuda que se aplaza

- [x] 5.1 Actualizar en `CLAUDE.md` la anotación de «no se puede subir una foto al crear un perfil»:
      añadir el dato nuevo —que los cinco endpoints de subida cuelgan de una entidad existente, así
      que el camino de un solo momento exige API— y asignarle dueño en vez de dejarla flotando.

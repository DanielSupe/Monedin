> El grupo 1 va primero porque **arregla el desbordamiento antes de vestir nada**. Si se deja para el
> final, no hay forma de saber si una pantalla cabe por lo que se hizo o por lo que se quitó.

## 1. El subidor

- [x] 1.1 El `<input type="file">` deja de verse: se oculta detrás de un `Button` que lo dispara.
      **Ocultar visualmente no es quitar**: sigue alcanzable con el teclado y sigue anunciándose.
- [x] 1.2 El velo del recorte deja de ser `#333` y pasa a un token.
- [x] 1.3 Declarar `allowInlineStyles()` **solo para `ImageUploadField.tsx`**, con su motivo escrito:
      la librería dimensiona su lienzo en tiempo de ejecución y no hay token que exprese eso. Es la
      **tercera** excepción del proyecto, y cierra la pregunta que dejó `add-design-system`.
- [x] 1.4 Vestir el resto: el paso de subida, el de recorte, los botones y el error.
- [x] 1.5 **Comprobar con el teclado** que se llega al control y se abre el selector. Es el riesgo
      real de este grupo.
- [x] 1.6 **Medir otra vez las cuatro pantallas del niño** a 390 px, antes de vestir ninguna.

## 2. Las tareas

- [x] 2.1 Cada tarea en una `Card`, con su estado como `Badge`: pendiente neutro, esperando revisión
      información, pagada éxito. Los tonos ya existen; no se inventa paleta.
- [x] 2.2 **Solo una tarea pendiente ofrece marcarla**, que es lo que la API permite. La interfaz
      deja de poder pedir algo que acabaría en 409.
- [x] 2.3 Las monedas con `Coins`, no escritas a mano.
- [x] 2.4 El vacío con `EmptyState`, no un párrafo.
- [x] 2.5 La evidencia ya subida, dentro de la tarjeta y con su medida del sistema.
- [x] 2.6 Cero estilos en línea, cero colores literales, cero valores arbitrarios.

## 3. «Mi perfil» del niño

- [x] 3.1 Vestir `ChildSettings`: su nombre, su saldo con `Coins`, el selector de avatar y el cambio
      de PIN.
- [x] 3.2 Vestir `AvatarPicker`, que es quien contiene el subidor.
- [x] 3.3 Los textos que falten, al catálogo.

## 4. El parche del marco

- [x] 4.1 Medir las cuatro pantallas del niño otra vez.
- [x] 4.2 Si las cuatro caben, **retirar el `overflow-x-auto` de `ChildShell`** y borrar su
      comentario, que prometía justo esto.
- [x] 4.3 No hizo falta: las cinco caben. Medido antes de quitarlo y después, y el documento no se
      mueve de lado en ninguna.

## 5. La deuda declarada

- [x] 5.1 Estrechar `features/tasks`, `features/children` y `features/uploads` a lo que siga sin
      vestir. Ajustar el `toHaveLength` y explicarse ahí.
- [x] 5.2 Comprobar que los tests de estilo cazan un color literal en las pantallas nuevas.

## 6. Tests

- [x] 6.1 Los tres estados de una tarea se distinguen, y **solo la pendiente ofrece marcarla**.
- [x] 6.2 Una tarea aprobada dice cuántas monedas dio.
- [x] 6.3 El control de subir imagen **no muestra el nativo** y sigue siendo alcanzable.
- [x] 6.4 Comprobar que fallan de verdad inyectando una violación, y no pasan por vacíos.

## 7. Cierre

- [x] 7.1 **Abrir la aplicación** con Mateo —PIN `1234`— y recorrer una tarea entera: marcarla, verla
      esperando revisión, y aprobarla desde el padre para verla pagada.
- [x] 7.2 **Subir una evidencia de verdad**, con recorte, y verla en la tarjeta.
- [x] 7.3 Las **cuatro fuera de alcance** comprobadas una a una: la foto del padre en `/account`, la
      del hijo en `/children/:id/edit`, la del premio —que aparece al editar su título en el
      catálogo, no al publicarlo— y la evidencia. En las cuatro el subidor es un botón y ninguna
      desborda.
- [x] 7.4 A **390×844**: las cuatro del niño.
- [x] 7.5 Verificación completa: `pnpm turbo run lint typecheck test build --force --concurrency=1`,
      con Docker arriba, **sola y sin nada más corriendo**.
- [x] 7.6 Actualizar `README.md`, `openspec/config.yaml` y `CLAUDE.md`.
- [x] 7.7 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.

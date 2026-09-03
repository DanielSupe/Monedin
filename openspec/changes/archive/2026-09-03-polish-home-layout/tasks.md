## 1. El tope de ancho

- [x] 1.1 El `<main>` de `ChildShell.tsx` y `ParentShell.tsx` se centra con `--container-wide`, que
      ya existe. Sin tocar `min-w-0` ni el `overflow-x-auto` del padre.
- [x] 1.2 Comprobar que a 390px no cambia nada: por debajo del tope el contenido sigue usando lo que
      hay.

## 2. El inicio del niño

- [x] 2.1 `ChildHome.tsx` se ciñe a `--container-reading`, centrado.
- [x] 2.2 «Cambiar de perfil» deja de ocupar todo el ancho.
- [x] 2.3 **No** tocar el tamaño del glifo ni el relleno de la tesela: sus medidas salen de la escala
      del niño, y agrandarlas para compensar un contenedor mal puesto las dejaría desproporcionadas
      en cuanto el contenedor se arregle.

## 3. Hacer cumplir

- [x] 3.1 Test de que el contenido de los dos marcos declara un ancho máximo, y de que el valor sale
      de un token y no de una medida escrita a mano.
- [x] 3.2 **Inyectar la violación** —quitar el tope— y comprobar que cae. Con `assert` en la
      sustitución.
- [x] 3.3 `pnpm lint` del web ANTES de la batería.
- [x] 3.4 `pnpm turbo run lint typecheck test build --concurrency=1`: **13/13** (356 tests).
- [ ] 3.5 **Mirarlo — PENDIENTE DE TI**: el inicio del niño y el del padre, más un listado del padre,
      en escritorio ancho y a 390px. Es lo que este change existe para arreglar y no lo cubre ningún
      test.

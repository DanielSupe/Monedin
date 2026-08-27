## 1. El marco de entrada

- [x] 1.1 `apps/web/src/app/EntryShell.tsx`, hermano de `ChildShell` y `ParentShell`: logo arriba a
      la izquierda con la pieza `Logo`, y contenido centrado horizontal y verticalmente.
- [x] 1.2 `min-h-dvh` y **no** `h-dvh`: un formulario más alto que la pantalla tiene que crecer y
      poder desplazarse, no recortarse en silencio. Ver la decisión 3 del design.
- [x] 1.3 Conservar el ancho de lectura dentro del marco. Centrar no es ensanchar.
- [x] 1.4 En `routes/__root.tsx`, la última rama devuelve `EntryShell` en vez del `<main>` de
      lectura. **Una línea, y ninguna dirección escrita a mano**: son las rutas sin actor que no
      piden ancho completo.

## 2. Los círculos

- [x] 2.1 Talla `xlarge` en `Avatar`: 8 rem. Es la respuesta que el design de
      `redesign-profile-grid` dejó escrita para este caso.
- [x] 2.2 La rejilla la pide por su nombre, y la tesela crece para que quepa.
- [x] 2.3 La tesela de «Agregar perfil» crece igual: son la misma fila, y una más baja se lee como un
      error.
- [x] 2.4 La talla nueva, al catálogo vivo. Hay un test que lo exige.

## 3. Tests

- [x] 3.1 Con actor, se ve el marco de su rol y **no** el de entrada.
- [x] 3.2 Sin actor, las pantallas de entrada muestran la marca.
- [x] 3.3 Una ruta que pide ancho completo **no** recibe el marco de entrada, y no salen dos marcas a
      la vez en la puerta pública.
- [x] 3.4 Comprobar que fallan de verdad inyectando una violación, y no pasan por vacíos.

## 4. Cierre

- [x] 4.1 **Abrir la aplicación** y recorrer las cinco pantallas de entrada: acceso, rejilla, PIN,
      crear perfil y restablecer PIN. Que el logo no se mueva entre pasos.
- [x] 4.2 Que la puerta pública siga con **una sola** marca.
- [x] 4.3 A **390×844**: con 8 rem tienen que seguir cabiendo **dos teselas por fila**. Es lo que hay
      que mirar, no deducir.
- [x] 4.4 Una pantalla **más alta que el viewport** —crear perfil en una ventana baja— y comprobar
      que se llega al botón.
- [x] 4.5 Verificación completa: `pnpm turbo run lint typecheck test build --force --concurrency=1`,
      con Docker arriba. Si se corta por un fallo, **lo que queda detrás no es verde, es
      desconocido**.
- [x] 4.6 Actualizar `README.md`, `openspec/config.yaml` y `CLAUDE.md`.
- [x] 4.7 Si alguna decisión del design resultó equivocada al implementarla, **actualizar el design y
      decirlo**.
- [x] 4.8 Dejar anotado, donde se vea, que **subir una foto al crear un perfil sigue pendiente** y
      con qué dos caminos.

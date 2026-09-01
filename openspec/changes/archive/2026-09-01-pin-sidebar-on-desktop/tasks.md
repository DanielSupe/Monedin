## 1. Saber si hay ancho

- [x] 1.1 Crear `apps/web/src/app/use-wide.ts` sobre `matchMedia`, leyendo el valor de forma
      **síncrona** al inicializar el estado —no en un efecto— para que el primer pintado sea ya el
      correcto, y suscribiéndose a los cambios de tamaño.
- [x] 1.2 Rellenar `matchMedia` en `apps/web/tests/setup.ts`, junto a los otros huecos de jsdom, con
      **estrecho** por defecto y una forma de que un test pida ancho.

## 2. El lateral en sus dos formas

- [x] 2.1 `Sidebar.tsx`: modo contraído a solo iconos, con el texto en `sr-only` y NO borrado — un
      icono decorativo sin texto deja al destino sin nombre.
- [x] 2.2 Botón de contraer/expandir en el pie, con su nombre y su estado anunciado.
- [x] 2.3 El pie conserva la fila de perfil.

## 3. Los marcos

- [x] 3.1 `ParentShell.tsx` y `ChildShell.tsx`: montar la **columna** cuando hay ancho y el **cajón**
      cuando no. Una sola de las dos, nunca las dos con una escondida por CSS.
- [x] 3.2 El botón de menú solo existe en la forma estrecha.
- [x] 3.3 Devolver el avatar a la cabecera, a la derecha, como enlace al perfil.
- [x] 3.4 El estado de contraído vive en el marco, que no se desmonta al navegar.

## 4. Hacer cumplir

- [x] 4.1 Test en modo ancho: los destinos se ven sin abrir nada y **no hay botón de menú**.
- [x] 4.2 Test en modo estrecho: sigue habiendo botón, y el cajón se comporta como hasta ahora.
- [x] 4.3 Test de que existe **exactamente una** lista de destinos en el documento, en los dos modos.
- [x] 4.4 Test de que al contraer los destinos conservan su nombre accesible.
- [x] 4.5 Enmendar el test de destinos duplicados: todos los demás siguen apareciendo una sola vez, y
      el perfil se comprueba **por su nombre** como la excepción declarada — no se tapa.
- [x] 4.6 **Inyectar las violaciones**. Montar las dos formas a la vez: cae. Borrar el texto al
      contraer: cae — pero al primer intento la inyección era inválida (leía el DOM del render
      anterior) y hubo que rehacerla. Queda anotado el LÍMITE del test: en jsdom no hay CSS, así que
      no distingue `sr-only` de `hidden`; lo que caza es que el texto se borre del documento.
- [x] 4.7 `pnpm turbo run lint typecheck test build --concurrency=1`: **13/13**, con las cuatro
      tareas del web ejecutadas y no servidas de caché (332 tests). **Queda pendiente de TI** lo que
      no cubre ningún test: abrir padre y niño en escritorio y a 390 px, contraer, expandir y
      recorrerlo con teclado. En jsdom no hay CSS, así que cómo se VE no se puede probar aquí.

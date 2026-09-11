## 1. Traer shadcn sin traer su paleta

- [ ] 1.1 Crear `apps/web/components.json` apuntando a `src/ui` y a `src/styles/tokens.css`, con
      `cssVariables: true`. Es configuración de la CLI, no una segunda fuente de tema.
- [ ] 1.2 Traer `sidebar`, `sheet`, `checkbox`, `radio-group`, `slider`, `calendar` y `popover`, y
      moverlos a `apps/web/src/ui/`. Entran como piezas propias desde el primer minuto.
- [ ] 1.3 Quitarles lo que no cumple las reglas de aquí: colores y medidas literales fuera —salen de
      los tokens vía la capa de alias—, ningún `dark:`, y las variantes como props en vez de admitir
      `className` desde fuera. `cx` no fusiona utilidades, así que una clase impuesta gana o pierde
      según el orden del CSS generado.
- [ ] 1.4 Sustituir `ui/Drawer.tsx` por `sheet` en sus dos puntos de uso —el marco del niño y el del
      padre— y borrar el anterior. Si se deja para después quedan dos piezas para lo mismo.
- [ ] 1.5 Migrar `app/Sidebar.tsx` al `sidebar` traído, conservando lo que ya decidió
      `pin-sidebar-on-desktop`: columna fija a partir de `lg`, contraíble a iconos, cajón por debajo,
      y **una sola de las dos formas montada**, nunca las dos con una escondida por CSS.
- [ ] 1.6 Test: ningún archivo de `apps/web/src` usa la variante `dark:`. Un `dark:` significa que
      alguien copió un componente sin adaptarlo.

## 2. El panel de realce

- [ ] 2.1 `ui/HeroPanel.tsx`: degradado, los dos círculos translúcidos y el recorte. Recibe `tone`
      (`action` | `saving`), la mascota opcional y su contenido. El tono es un conjunto CERRADO: sin
      color arbitrario desde el punto de uso.
- [ ] 2.2 Test: los dos tonos no comparten superficie, y la pieza no admite un color desde fuera.
- [ ] 2.3 Test de regla: ningún archivo de `features/` ni de `routes/` declara un degradado o una
      sombra de color. Es lo que impide que vuelvan trece degradados distintos.
- [ ] 2.4 **Inyectar la violación**: escribir un `linear-gradient` en una pantalla cualquiera y ver
      caer 2.3. Revertir.

## 3. La tesela de icono y el anillo

- [ ] 3.1 `ui/IconTile.tsx`: cuadrado redondeado con el icono dentro, en los tres tintes del sistema
      y en las dos escalas. Sale en cada fila de tarea, cada destino y cada aviso.
- [ ] 3.2 `ui/ProgressRing.tsx`: dos círculos y un `stroke-dasharray`. **Recibe hechas y total**; no
      calcula nada, porque calcular exigiría conocer el estado de una tarea.
- [ ] 3.3 El anillo dice su valor a quien no lo ve: la cifra visible es un adorno para tecnologías de
      asistencia si el papel y el valor no están declarados.
- [ ] 3.4 Test del anillo con tres casos que den resultados DISTINTOS —0 de 5, 2 de 5 y 5 de 5—, para
      que un cálculo equivocado no pueda coincidir con el correcto en el caso elegido.

## 4. La mascota

- [ ] 4.1 `ui/Mascota.tsx` con su globo opcional. La ilustración es decorativa: lo que nombra lo que
      pasa es el texto que la acompaña.
- [ ] 4.2 Leer la pose del mapa que YA existe en `app/widget-lines.ts`. No se escribe un segundo mapa:
      dos mapas para lo mismo acaban separándose, y es literalmente lo que le pasó al avatar del padre
      antes de `add-file-storage`.
- [ ] 4.3 Test: la ilustración no se anuncia, y el texto que la acompaña sí.

## 5. Los doce avatares, dibujados

- [ ] 5.1 `ui/avatars.ts` pasa a `.tsx` y cada clave devuelve un SVG. Los doce están dibujados en
      `design/ui/pantallas/NuevoPerfil.dc.html`.
- [ ] 5.2 Mirar los doce JUNTOS en el catálogo, no de uno en uno: lo que hay que ver es que ninguno
      desentona con los otros once, y eso no se aprecia mirándolos por separado.
- [ ] 5.3 Comprobar que el color de cada animal NO se reasigna con el tema, y que el círculo sobre el
      que va SÍ lo hace. Un avatar es contenido, como una foto.
- [ ] 5.4 Test: cada clave de `AVATAR_KEYS` tiene ilustración, **y falla si falta una**. Sin la
      segunda mitad, añadir una clave al contrato sin dibujarla pasaría en verde.
- [ ] 5.5 Confirmar que no cambian `AVATAR_KEYS`, ni la validación, ni el almacenamiento. Si algo de
      eso se toca, la pieza está sabiendo más de lo que debe.

## 6. Catálogo y cierre

- [ ] 6.1 Añadir al catálogo vivo las cuatro piezas nuevas y los siete componentes traídos, **en sus
      estados y en las dos escalas**. Una pieza sin entrada hace fallar un test, y además el catálogo
      es de donde copian las pantallas de los tres changes siguientes.
- [ ] 6.2 Repasar que ninguna pieza nueva importa de `features/` ni de `api/`, y que las once se
      montan en una prueba sin proveedores.
- [ ] 6.3 Abrir el catálogo en los dos temas y en las dos escalas. Es lo único que enseña las once
      juntas, y mirarlas juntas es la mitad del trabajo.
- [ ] 6.4 `pnpm verify`. Si muere con `allocation failure`, es la contención conocida:
      `pnpm turbo run lint typecheck test build --force --concurrency=1`.

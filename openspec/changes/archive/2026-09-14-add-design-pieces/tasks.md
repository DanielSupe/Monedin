## 1. Traer shadcn sin traer su paleta

- [x] 1.1 **La CLI de shadcn no encaja aquí, y se descarta.** Se probó: sin alias `@/` crea un
      directorio literal `@`, instala un paquete `cn` aleatorio de npm y trae el `radix-ui`
      monolítico cuando el proyecto usa los individuales. El código que genera viola cuatro reglas de
      aquí —`dark:`, `cn()`, valores arbitrarios y pasos de escala ajenos—, así que cada componente
      hay que reescribirlo entero: el ahorro real es cero. Lo que SÍ vale son las primitivas de Radix,
      y esas se instalan a mano.
- [x] 1.2 Instalar `@radix-ui/react-checkbox`, `-radio-group` y `-slider`, y escribir `Checkbox`,
      `RadioGroup` y `Slider` con su estructura. De shadcn se toma QUÉ primitiva usar y cómo
      componerla; el aspecto es entero de aquí.
- [x] 1.3 Quitarles lo que no cumple las reglas de aquí: colores y medidas literales fuera —salen de
      los tokens vía la capa de alias—, ningún `dark:`, y las variantes como props en vez de admitir
      `className` desde fuera. `cx` no fusiona utilidades, así que una clase impuesta gana o pierde
      según el orden del CSS generado.
- [x] 1.4 **Se descarta: `Drawer` YA es lo que `sheet` sería.** Las dos son el mismo diálogo de Radix
      pegado a un borde, y la de aquí ya cumple lo que este proyecto pide —sin estilos en línea, con
      su entrada en el catálogo y con la lección de `pin-sidebar-on-desktop` dentro—. Sustituirla
      sería cambiar código probado por una copia ajena que hay que volver a adaptar entera.
- [x] 1.5 **Se descarta, y es la que más se pensó.** El `sidebar` de shadcn trae su propio contexto,
      persistencia en cookies y una docena de subcomponentes; el de aquí ya monta UNA sola de las dos
      formas según `useIsWide()`, que es justo lo que `pin-sidebar-on-desktop` pagó con dos capturas
      de pantalla. Migrarlo cambiaría comportamiento probado por otro que habría que volver a
      demostrar, y el proyecto no usa almacenamiento del navegador para nada.
- [x] 1.6 Test: ningún archivo de `apps/web/src` usa la variante `dark:`. Un `dark:` significa que
      alguien copió un componente sin adaptarlo.

## 2. El panel de realce

- [x] 2.1 `ui/HeroPanel.tsx`: degradado, los dos círculos translúcidos y el recorte. Recibe `tone`
      (`action` | `saving`), la mascota opcional y su contenido. El tono es un conjunto CERRADO: sin
      color arbitrario desde el punto de uso.
- [x] 2.2 Test: los dos tonos no comparten superficie, y la pieza no admite un color desde fuera.
- [x] 2.3 Test de regla: ningún archivo de `features/` ni de `routes/` declara un degradado o una
      sombra de color. Es lo que impide que vuelvan trece degradados distintos.
- [x] 2.4 **Inyectar la violación**: escribir un `linear-gradient` en una pantalla cualquiera y ver
      caer 2.3. Revertir.

## 3. La tesela de icono y el anillo

- [x] 3.1 `ui/IconTile.tsx`: cuadrado redondeado con el icono dentro, en los tres tintes del sistema
      y en las dos escalas. Sale en cada fila de tarea, cada destino y cada aviso.
- [x] 3.2 `ui/ProgressRing.tsx`: dos círculos y un `stroke-dasharray`. **Recibe hechas y total**; no
      calcula nada, porque calcular exigiría conocer el estado de una tarea.
- [x] 3.3 El anillo dice su valor a quien no lo ve: la cifra visible es un adorno para tecnologías de
      asistencia si el papel y el valor no están declarados.
- [x] 3.4 Test del anillo con tres casos que den resultados DISTINTOS —0 de 5, 2 de 5 y 5 de 5—, para
      que un cálculo equivocado no pueda coincidir con el correcto en el caso elegido.

## 4. La mascota

- [x] 4.1 `ui/Mascota.tsx` con su globo opcional. La ilustración es decorativa: lo que nombra lo que
      pasa es el texto que la acompaña.
- [x] 4.2 **Corregido sobre el design**: el mapa no se lee de `app/widget-lines.ts`, porque ese
      archivo sabe de roles y de áreas y una pieza no puede depender del dominio. El catálogo de poses
      baja a `ui/mascot-poses.ts`, que es el único que sabe qué imagen es cada pose — mismo criterio
      que `avatars.ts`. Los CUATRO archivos que importaban los PNG por su ruta pasan a pedirlas por su
      nombre.
- [x] 4.3 Test: la ilustración no se anuncia, y el texto que la acompaña sí.

## 5. Los doce avatares, dibujados

- [x] 5.1 `ui/avatars.ts` pasa a `.tsx` y cada clave devuelve un SVG. Los doce están dibujados en
      `design/ui/pantallas/NuevoPerfil.dc.html`.
- [x] 5.2 Mirar los doce JUNTOS en el catálogo, no de uno en uno: lo que hay que ver es que ninguno
      desentona con los otros once, y eso no se aprecia mirándolos por separado. **Dibujados y en el
      catálogo; falta abrirlo.**
      **Los doce no estaban en el catálogo**: enseñaba cuatro de muestra. Puestos, y mirados juntos.
- [x] 5.3 Comprobar que el color de cada animal NO se reasigna con el tema, y que el círculo sobre el
      que va SÍ lo hace. Un avatar es contenido, como una foto.
      **Confirmado en pantalla**: los animales conservan su color en oscuro y el círculo de debajo
      sí cambia. Y destapó que el TUCÁN se disolvía: era el único cuyo cuerpo usaba la tinta de
      los ojos, el mismo valor que el círculo oscuro. Corregido en la pieza y en la maqueta.
- [x] 5.4 Test: cada clave de `AVATAR_KEYS` tiene ilustración, **y falla si falta una**. Sin la
      segunda mitad, añadir una clave al contrato sin dibujarla pasaría en verde.
- [x] 5.5 Confirmar que no cambian `AVATAR_KEYS`, ni la validación, ni el almacenamiento. Si algo de
      eso se toca, la pieza está sabiendo más de lo que debe.

## 6. Catálogo y cierre

- [x] 6.1 Añadir al catálogo vivo las cuatro piezas nuevas y los siete componentes traídos, **en sus
      estados y en las dos escalas**. Una pieza sin entrada hace fallar un test, y además el catálogo
      es de donde copian las pantallas de los tres changes siguientes.
- [x] 6.2 Repasar que ninguna pieza nueva importa de `features/` ni de `api/`, y que las once se
      montan en una prueba sin proveedores.
- [x] 6.3 Abrir el catálogo en los dos temas y en las dos escalas. Es lo único que enseña las once
      juntas, y mirarlas juntas es la mitad del trabajo.
- [x] 6.4 Lint, typecheck y batería del front, en verde con `--no-file-parallelism`. La pasada en
      paralelo hace caer un test distinto cada vez y todos pasan aislados: es la contención que
      `CLAUDE.md` ya documenta.

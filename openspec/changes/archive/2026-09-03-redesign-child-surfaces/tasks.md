## 1. La pieza de tabla en el sistema

- [x] 1.1 `ui/DataTable.tsx`: recibe encabezados y filas ya compuestas, con `caption` para su nombre y
      `scope` en cada encabezado. Sin importar nada de `features/` ni de `api/`.
- [x] 1.2 Sin filas no dibuja encabezados con nada debajo: quien la usa pone el estado vacío.
- [x] 1.3 Contenido ancho que se desplaza **dentro de la pieza**, sin arrastrar la página.
- [x] 1.4 Exportarla en `ui/index.ts` y darle su entrada en `ui.html` — sin ella falla un test.
- [x] 1.5 Tests de montaje: se anuncia como tabla con nombre, cada valor queda asociado a su
      encabezado, y sin filas no hay tabla.
- [x] 1.6 Test de que no importa de `features/` ni de `api/` — el que ya existe debería cubrirla sola;
      comprobar que así es en vez de darlo por hecho.

## 2. El historial de canjes

- [x] 2.1 `MyRedemptions` pasa a `DataTable`: premio, monedas, estado y cuándo, en ese orden.
- [x] 2.2 El estado sigue siendo un `Badge` con los tonos que ya tenía. **Rechazado en advertencia**,
      no en peligro: eso no se toca.
- [x] 2.3 Las cantidades con las cifras de ancho fijo del sistema, para que la columna alinee.
- [x] 2.4 La fecha corta —día y mes—, compuesta en el punto de uso.
- [x] 2.5 El estado vacío se queda como está, y la tabla no se monta cuando no hay filas.
- [x] 2.6 Tests: una fila por canje, orden del más reciente al más antiguo, los tres estados se
      distinguen **entre sí** comparando sus tonos, y ninguna fila ofrece acciones.

## 3. El escaparate como rejilla

- [x] 3.1 `MyRewards` pasa a rejilla de dos columnas, **siguiendo siendo `<ul>`/`<li>`**.
- [x] 3.2 Cada tesela: imagen o respaldo, título, precio, si le alcanza y su acción, como unidad.
- [x] 3.3 `ProgressBar` y «ya lo pediste» se quedan tal cual dentro de la tesela.
- [x] 3.4 Tests: cada premio sigue siendo un elemento de lista con sus partes, y uno con foto y otro
      sin ella conviven sin que el segundo deje hueco.

## 4. Las cuentas de las tres pantallas

- [x] 4.1 Escaparate: cuántos premios, de las filas recibidas.
- [x] 4.2 Tareas: cuántas **PENDIENTES**, contando filas con ese estado y no el total.
- [x] 4.3 Canjes: cuántos, del `total` del listado — que aquí sí es la cifra porque pagina por fila.
- [x] 4.4 Los textos al catálogo, **sin ninguna cifra dentro de la cadena**.
- [x] 4.5 Test de la cuenta de tareas con un caso donde las tres cuentas posibles den números
      DISTINTOS —total, pendientes y otra cosa—, o el test no distingue nada.
- [x] 4.6 Test de que ninguna cadena nueva del catálogo lleva cifra: el que ya existe debería cazarlo;
      comprobar que lo hace inyectando una.

## 5. Que las tres se distingan

- [x] 5.1 Test que monta **las tres** pantallas y compara la estructura que cada una produce. Mirar
      solo una pasaría con las tres iguales otra vez, que es el defecto que este change arregla.
- [x] 5.2 **Inyectar las violaciones**, y las cuatro tienen que caer: el historial como lista de
      tarjetas; el escaparate en una columna; la cuenta de tareas leída del total; y los tres estados
      de un canje con el mismo tono. Toda sustitución con `assert`.

## 6. Lo que ningún test cubre

- [x] 6.1 **Abrir la aplicación** en el ancho más estrecho que el producto admite y confirmar que la
      tabla no desborda y que la rejilla no parte una tesela. jsdom no aplica CSS: esto no lo prueba
      nadie por nosotros.
- [x] 6.2 Mirar las tres pantallas seguidas, como las ve un niño, y confirmar que se distinguen.

## 7. Cerrar

- [x] 7.1 `pnpm lint` del web ANTES de la batería.
- [x] 7.2 Batería del web, y la de la API **sola y una sola pasada** si algo la tocara —no debería:
      este change no toca la API—.
- [x] 7.3 `config.yaml` y `CLAUDE.md` con lo que salga que valga para el siguiente.

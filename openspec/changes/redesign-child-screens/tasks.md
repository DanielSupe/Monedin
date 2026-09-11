## 1. El inicio del niño

- [x] 1.1 Devolver el saldo a su sitio: el elemento más grande de la pantalla, con la pieza de
      cantidades y con su unidad anunciada. Quitar la píldora de la cabecera.
- [x] 1.2 **El marco nunca lo tuvo**: lo proponían las referencias visuales, no el código. Lo que
      faltaba era ESCRIBIRLO, y ya está en el delta de `app-navigation` — con un test que lo fija, o
      la próxima referencia volvería a subirlo.
- [x] 1.3 Traer al inicio las tareas pendientes con su acción, y el panel de la meta más cercana.
- [x] 1.4 Montar el realce con la mascota usando `HeroPanel`, sin declarar un solo color.
- [x] 1.5 Test: el saldo sigue siendo el elemento de mayor tamaño del inicio **después** de añadir el
      contenido nuevo. Es el requisito que este change casi rompe, así que es el que hay que fijar.

## 2. Las tareas del niño

- [x] 2.1 Agrupar por etapa, en el orden del ciclo, con la cuenta de cada grupo.
- [x] 2.2 No dibujar los grupos vacíos.
- [x] 2.3 El anillo con `ProgressRing`, alimentado con las hechas y las que esperan revisión sobre el
      total. **Sin la palabra «hoy»** en ningún texto.
- [x] 2.4 Test del agrupado con un caso que DISTINGA: tres etapas con cantidades distintas —por
      ejemplo 2, 1 y 2— de modo que contar mal dé un número distinto en cada grupo. Con 1, 1 y 1 un
      error de agrupación pasaría en verde.
- [x] 2.5 Test: con una etapa vacía, su grupo no está en el documento. No basta con que no se vea.
- [x] 2.6 Test: ningún texto de la pantalla ni del catálogo de mensajes dice «hoy» sobre las tareas.

## 3. El escaparate

- [x] 3.1 La meta más cercana. **En el inicio como panel y en el escaparate marcando SU tesela**: un
      panel encima de la rejilla repetiría el título de un premio que ya está ahí.
- [x] 3.2 Desempatar por identificador cuando dos cuesten lo mismo.
- [x] 3.3 Los dos casos sin meta, distintos entre sí: le alcanzan todos → se celebra; no tiene premios
      → no se destaca nada.
- [x] 3.4 Las cintas de estado sobre la foto, con contraste sobre las tres teselas de color y no solo
      sobre la clara.
- [x] 3.5 Test del desempate: dos premios al mismo precio dan el mismo destacado en dos montajes.
- [x] 3.6 Test que distinga los tres casos: con meta, sin meta por alcance y sin meta por vacío. Los
      tres tienen que dar pantallas distintas.

## 4. Canjes, monedas, perfil y ayuda

- [x] 4.1 La tabla de canjes con sus estados y los tonos nuevos, sin reordenar: el servidor ya ordena,
      y lo que hay que garantizar es que la pantalla NO reordene.
- [x] 4.2 Test de no-reordenación con datos elegidos para que un orden accidental por cualquier
      columna dé una lista distinta.
- [x] 4.3 El historial de monedas: ganar en el color de la moneda, gastar en el del ahorro. Hasta hoy
      salían idénticos y son lo contrario.
- [x] 4.4 «Mi perfil» con los doce animales dibujados y el cambio de PIN.
- [x] 4.5 Las preguntas frecuentes del niño con el acordeón del sistema.

## 5. El chat y el recorrido

- [ ] 5.1 Llevar el chat a las piezas nuevas sin tocar su comportamiento: lo que cambia es el marco,
      no la conversación.
- [ ] 5.2 Repasar el recorrido de bienvenida con los tokens nuevos: el velo, el agujero y el globo.
- [ ] 5.3 Comprobar que terminar y saltar siguen haciendo lo mismo, y que Escape y pulsar fuera
      cuentan como salida. Una salida que no se recuerda devuelve el recorrido en la siguiente visita.

## 6. Cierre

- [ ] 6.1 Ni un estilo en línea, ni un color literal, ni un valor arbitrario en las ocho pantallas.
- [ ] 6.2 Abrir las ocho en los dos temas y a ancho estrecho. El estrecho no está dibujado en las
      maquetas y es el escenario más probable: tablet compartida.
- [ ] 6.3 Comprobar que las cuatro columnas de la tabla de canjes caben en la escala del niño a
      390 px. Eso no lo prueba jsdom, que no aplica CSS.
- [ ] 6.4 `pnpm verify`, y si muere con `allocation failure`, con `--concurrency=1`.

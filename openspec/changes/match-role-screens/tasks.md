# Tareas

## 1. Lo que es de todas las pantallas

- [x] 1.1 Una función en `lib/` que escriba una fecha como la escribe el producto, con el idioma
      DECLARADO y no el del dispositivo. Son DOS formas, no una, y por un papel cada una: la larga
      —«8 de septiembre»— para una línea de texto, y la corta —«8 sept»— para una CELDA, que es lo
      que una pantalla ya necesitaba porque su tabla son cuatro columnas en 390px. Ninguna lleva año.
- [x] 1.2 Usarla en los cuatro sitios que hoy deciden su formato por separado.
- [x] 1.3 Un test que falle si una pantalla vuelve a llamar a `toLocaleDateString` por su cuenta. Una
      regla que solo vive en un documento está muerta al tercer mes. Y mira las DOS mitades: que
      nadie más decida el formato, y —por el RESULTADO— que el idioma esté declarado. Sin la segunda,
      un `toLocaleDateString(undefined, …)` dentro de la propia función pasaría cualquier revisión,
      porque a quien desarrolla en español le sale en español. Violación inyectada y cazada.
- [x] 1.4 Mover la ayuda al lateral con su nombre, y QUITARLA de la cabecera: dejarla en los dos
      sitios sería una segunda excepción a «ningún destino dos veces». Va al PIE, separada de los
      destinos por el mismo borde que separa el perfil, que es lo que dibujan las maquetas — y así se
      respeta el argumento que ya estaba escrito: la ayuda no es un destino de TRABAJO.
      **Y su pieza afirmaba en su cabecera «lleva nombre y no solo un símbolo»** cuando lo que había
      era un interrogante mudo con el nombre en `aria-label`. Corregida.
- [x] 1.5 Actualizar el test que enumera los destinos de cada rol, y comprobar que sigue cazando el
      duplicado. El bloque que decía «el acceso a la ayuda vive en la cabecera» tenía sus dos mitades
      desiguales: la que comprobaba que NO se mezcla con los destinos sostenía un argumento y se
      queda; la que comprobaba que se encuentra sin abrir el cajón solo describía dónde estaba
      entonces, y se sustituye por que está en el pie. Hay además un caso nuevo que exige su nombre
      EN PANTALLA —con el interrogante mudo, `getByRole` lo encontraba igual—. Cinco casos caen al
      quitar la ayuda del pie.

## 2. Las quince del padre

- [x] 2.1 Panel. **Cuadra**: con las fechas y la ayuda arregladas, lo único que difiere de su maqueta
      son las cifras de la siembra, el nombre partido en dos nodos, el singular que la aplicación
      declina bien, y la línea del asistente — que la maqueta no dibuja y es de la aplicación.
- [x] 2.2 Tareas. **Cuadra**, y de paso deshizo una diferencia que no lo era: la nota del filtro
      parecía faltar y lo que pasaba es que la maqueta está capturada CON el filtro «Por aprobar»
      puesto y yo comparaba contra la aplicación sin filtrar. La regla de las dos coincide.
      Lo que sí faltaba es la segunda mitad de esa nota: decía que el reparto se muestra completo
      —el qué— y no que lo que se filtra son los REPARTOS y no las filas —el por qué—. Sin eso se
      lee como una disculpa por un filtro roto.
- [x] 2.2b El formulario de reparto. Le faltaba lo más importante que esa pantalla puede decir: **que
      marcar una tarea NO paga nada y que aprobar es lo que acredita**. Es el mecanismo central del
      producto y no estaba explicado en ninguna parte de la interfaz. Va como lista ORDENADA, porque
      los tres pasos ocurren en ese orden y el orden es lo que hay que entender.
      Y dos defectos de los controles, los dos de la misma familia —un nombre que solo existe para
      quien no ve la pantalla—: el grupo del valor se anunciaba con «¿Para quién?», que es de lo que
      NO va, y su pregunta real vivía solo en un `aria-label`; y el valor no decía a cuántos va, que
      es la duda que cuesta dinero al entenderse al revés.
- [x] 2.3 Canjes. **Cuadra.** Su explicación del precio congelado y del descuento al aprobar dice lo
      mismo que la maqueta, repartida en tres frases en vez de un párrafo.
- [x] 2.4 Premios (el catálogo). **Cuadra**, salvo su antetítulo: decía «lo que tus hijos pueden
      pedir» y la maqueta nombra también el PRECIO, que es la otra mitad de esa pantalla y la que
      cambia de un hijo a otro.
- [x] 2.4b El formulario de alta. Mismo caso: la API congela el precio al pedir un premio y un hijo ve
      lo que no puede pagar con cuánto le falta — las dos cosas de las que va el producto, y ninguna
      dicha en pantalla. Además el conjunto pregunta ya «¿a quién se lo ofreces, y por cuánto?», así
      que el precio no repite la pregunta dentro; y se explica por qué el recorte es cuadrado, cuya
      razón vive en OTRA pantalla —el escaparate en rejilla—.
      **Y un comentario que afirmaba lo contrario del código de debajo**: decía «sin `aspect`» encima
      de un `aspect={1}`. Era cierto hasta `crop-reward-images`; se quedó mintiendo.
- [x] 2.5 Hijos. **Cuadra**, y de paso corrigió mi propia lectura: la maqueta NO mueve las acciones a
      la pantalla del hijo —dibuja «Editar», «Historial» y «Dar de baja» en la FILA, igual que la
      aplicación—, así que la única diferencia de controles es «Cambiar su PIN», uno. Lo arreglado:
      la edad pasa a «8 años» declinada con `contar` —se escribía «Edad: 8» aquí y «8 años» en el
      perfil del niño, el mismo dato de dos maneras—, y la nota que distingue dar de baja de
      desbloquear, que la maqueta lleva y la aplicación no. Dos violaciones inyectadas y cazadas.
      Queda dicho lo que NO se copia: el paginador de una sola página. Ver las decisiones 4 y 5.
- [x] 2.5b La edición de un hijo. No decía a QUIÉN se estaba editando: se llega desde una lista de
      caras y el formulario solo ponía «Editar perfil». Ahora lleva debajo su avatar, su nombre, su
      edad y su saldo, más «Bloqueado» cuando toca — que explica por qué alguien ha llegado ahí.
      **Y un intento mío antes de ese**: puse el nombre del hijo DE TÍTULO, y el artboard lo corrigió.
      Su `h1` es «Editar perfil» con un antetítulo que dice qué se cambia, y la identidad va debajo.
      El título de una pantalla nombra la operación, no su argumento.
- [x] 2.6 Historial de un hijo. **No enseñaba NINGUNA fecha**, y esta pantalla existe para contestar
      «este saldo no me cuadra»: una fila que dice cuánto y por qué pero no cuándo no se puede cruzar
      con nada de lo que pasó en casa. El dato venía en la respuesta desde el principio. Va en su
      columna, entre la frase y el saldo, y en la forma corta. Dos casos con fechas DISTINTAS, para
      que una pantalla que pintara una sola no pasara, y violación inyectada.
- [x] 2.7 Cuenta. Le faltaban las dos explicaciones que su maqueta lleva y que no son adorno: qué
      cuesta cerrar sesión —que este dispositivo se desvincula— y para qué sirve cada credencial,
      junto a donde se cambia el PIN. Lo primero lo insinuaba el ASISTENTE, y eso no cuenta: vive
      dentro de un globo que hay que abrir. Al quedar dicho en la pantalla, ese turno del asistente
      se cambió por lo que la pantalla no puede contestar. Además el antetítulo pasa a «Lo tuyo, no
      lo de tus hijos» —enumeraba el contenido sin avisar de la confusión real en una tablet
      compartida— y la oferta de repetir el recorrido dice por fin qué es el recorrido.
- [x] 2.8 Chat. Tres cosas, y las tres del mismo defecto: la pantalla es UNA para los dos roles y su CONTENIDO no puede serlo. Al padre se le ofrecían las preguntas del niño —«¿qué me falta por hacer?»— y se le decía que Monedín conoce «tus monedas», cuando son de sus hijos. Y el hilo vacío era una frase gris; ahora abre con Monedín saludando **con lo que hay**, que es lo que la maqueta hace y lo que da de dónde sacar la primera pregunta.
- [x] 2.9 Ayuda. **Se dividió**, con el argumento escrito: «subí el precio de un premio que ya me
      habían pedido» no es una duda que un niño pueda tener, y las nueve estaban redactadas en
      tercera persona —un manual para quien administra—. Una lista de preguntas sirve para encontrar
      la propia; la mitad que no puede ser tuya estorba, y a los siete años estorba el doble.
      Once para el padre —con las dos que faltaban, sobre dinero ya movido— y seis para el niño, en
      su voz. El test que decía «los dos roles leen la misma lista» ahora comprueba las dos
      direcciones: sin la segunda, una lista de niño que fuera un subconjunto pasaría igual.
- [x] 2.10 Los tres diálogos. El de retirar no decía que **los canjes ya pedidos siguen su curso**, y
      el del recorte no decía por qué el marco es cuadrado —su razón vive en otra pantalla—.
      **Y el de la baja decía algo FALSO que copié de la maqueta**: que el saldo y el historial «se
      van con el perfil». La baja es lógica y el historial ni siquiera se puede borrar —lo impide un
      disparador—. Una maqueta manda en el aspecto, no en los hechos del modelo de datos.

## 3. Las nueve del niño

Comparadas las nueve, esto es lo que falta. Se anota antes de tocar nada porque cuatro de ellas
piden lo MISMO —decirle al niño cuánto le falta para algo— y resolverlo pantalla por pantalla
escribiría esa cuenta cuatro veces.

- [x] 3.1 Inicio. **LA NOTA ANTERIOR ESTABA MAL Y SE CORRIGIÓ**: la escribí leyendo solo la lista de
      diferencias, donde el saludo, la cuenta de hechas y el panel de meta salían como «solo en la
      maqueta» — y están las tres en la aplicación, dichas con otras palabras. Abrir la pantalla y
      leerla entera es lo que lo destapó; comparar dos listas dice qué texto no coincide, no qué
      falta. Lo que falta de verdad son tres cosas:
      el botón **«¡Ya la hice!»** en cada fila de tarea —hoy hay que ir a «Tareas» para marcarla—,
      el bloque de lo **recién ganado**, y que el panel de meta enseñe la **fracción** («128/300»)
      además de la barra. **Hechas las tres**, y una cuarta que la comparación destapó: la lista
      enseñaba solo las pendientes, así que el paso que da sentido a los otros tres —cobrar— no se
      veía en el inicio. Ahora van los tres estados en el orden del ciclo, cada uno con lo suyo.
      Además la fecha de hoy encabeza —que sí se puede decir, al contrario que «hoy te esperan dos
      tareas»— y el bloque de los tres últimos movimientos cierra la pantalla.
- [x] 3.2 Tareas. **Cuadra.** Tenía ya lo que creí que le faltaba —el botón por fila, el aviso de lo
      ganado, los grupos con su cuenta— y lo que sí faltaba era su «Cómo funciona»: el mismo ciclo
      que ahora explica el formulario del padre, contado del lado del niño. Van los DOS a propósito:
      el que reparte necesita saber que marcar no paga, y el que marca necesita saber que lo revisan
      antes. Contárselo a uno solo deja al otro suponiendo, y es donde un niño se lleva el chasco:
      marca, no ve subir sus monedas, y cree que se perdieron.
      Va al FINAL y no arriba: lo primero que quiere ver es qué tiene por hacer.
- [x] 3.3 Premios. La barra de «te faltan N monedas» **ya estaba** —`ProgressBar` se estrenó ahí—. Lo
      que faltaba era verlo: el único premio que el hijo de ejemplo podía pagar ya estaba pedido, así
      que la insignia no salía en ninguna pantalla. **Es un defecto de la SIEMBRA y no del código** —y
      es justo lo que la siembra existe para evitar—: ahora hay un premio barato sin canjear. Y su
      antetítulo, que faltaba.
- [x] 3.4 Canjes. **Cuadra**: solo difieren las cifras y las fechas de la siembra.
- [x] 3.5 Monedas. **Cuadra** desde que el historial enseña fechas (tarea 2.6).
- [x] 3.6 Perfil. La identidad y el subidor ya estaban; faltaba su antetítulo y, sobre todo, que la
      foto se ofreciera como LO QUE ES: encima hay una rejilla de animales y debajo un botón de
      archivo, separados por una línea, y sin una frase en medio el segundo parecía otro paso del
      primero en vez de la otra opción.
- [x] 3.7 Chat. Cubierto con el del padre: la pantalla es una y lo que se separó —la frase de la cabecera, las ideas y el saludo— es justo lo que cada rol necesita distinto.
- [x] 3.8 Ayuda. Sus seis preguntas, en su voz. Y el pie pasa a decir QUIÉN va a contestar —«conozco tus tareas, tus premios y tus monedas»—, que es lo que convence de pulsar ahí; decía el nombre del destino y nada más.
- [x] 3.9 Recorrido. **Cuadra**: lo único que difiere de su maqueta son las cifras de la siembra y el «hoy», que no se puede decir.

## 4. Cierre

- [x] 4.1 Volver a comparar las veinticuatro y dejar escrito lo que sigue sin cuadrar. Lo que queda,
      y en los tres casos por una razón y no por un olvido:
      **Las cifras y las fechas** de cada maqueta, que son sus datos de ejemplo y no los de la
      siembra.
      **El «hoy»** de «hoy te esperan 2 tareas» y «2/5 hechas hoy»: el modelo no tiene jornada, así
      que sería un dato inventado. La cuenta sí se dice; la jornada no.
      **El teclado del PIN de colores**, que pide imponerle color a `Button` desde fuera o nombrar
      una variante por su color. Ver la decisión 10.
- [x] 4.2 Los dos temas. Comprobado en el navegador sobre la rejilla rehecha —el panel de marca, los
      bordes por rol y la insignia de bloqueado se reasignan solos— y antes con la sonda de
      contraste en las ocho compartidas. Lo único por debajo de AA sigue siendo el coral, que es
      **decisión tomada** y no deuda.
- [x] 4.3 `pnpm verify` entero. **13 de 13 tareas**, con las dos baterías: 48 archivos de API y 59
      del front. Es la primera pasada completa desde que el sistema mató la anterior por falta de
      memoria, y esta vez no hizo falta el `--concurrency=1` de emergencia — se lanzó así de entrada.

# Las pantallas que la maqueta parte en dos, partidas en dos

## Por qué

Cinco pantallas se ven como una columna estrecha en un monitor y su maqueta las
reparte en dos. Está comprobado abriendo cada una y su maqueta en el navegador, a
1600 × 950, no leyendo el HTML.

En cuatro de las cinco **el contenido ya está**: el panel que la maqueta pone a la
derecha existe y se dibuja debajo. Lo que falta es la banda.

| Pantalla | La maqueta | Hoy |
| --- | --- | --- |
| Inicio del niño | Tareas a la izquierda; próximo premio, últimas monedas y salir a la derecha | Una columna de 640 px |
| Mis tareas del niño | Lista agrupada a la izquierda; avance y «Cómo funciona» a la derecha | Apilado |
| Nueva tarea | Formulario a la izquierda; «Qué pasa al repartir» a la derecha | Apilado |
| Nuevo premio | Formulario a la izquierda; «Qué pasa al publicar» a la derecha | Apilado |
| Mis canjes del niño | Monedín explicando y tres contadores de estado sobre la tabla | **No existen** |

## Cómo se escapó

El repaso que cuadró las treinta y dos pantallas comparaba el **texto visible y los
pasos de escala**. Ese método no ve la FORMA: apilado y en dos columnas llevan el
mismo texto y la misma escala, así que daba coincidencia. Ya está escrito en
`CLAUDE.md` desde `match-remaining-screens`, y esto es el resto de la factura.

## Qué cambia

- Una pieza, `SplitLayout`, declara la banda: contenido a la izquierda y panel de
  apoyo a la derecha desde que hay ancho, apilados cuando no lo hay. Cinco
  pantallas usándola es exactamente lo que una pieza existe para evitar que se
  escriba cinco veces.
- Las cuatro que ya tienen su panel pasan a colocarlo al lado.
- El inicio del niño además **deja de estar topado a ancho de lectura**: con dos
  columnas, 640 px no es un tope, es una jaula.
- Los canjes del niño reciben lo que les falta: la explicación de Monedín y los
  tres contadores por estado.

## No incluye

- **El saldo sigue donde está.** Las maquetas lo suben a una píldora de la
  cabecera; hay un requisito vigente que dice que es el elemento más grande del
  inicio del niño, y eso ya se decidió en `match-role-screens`. Una referencia
  visual no revoca una decisión de producto.
- **Las teselas de destino del inicio del niño se quedan.** La maqueta no las
  lleva —su lateral ya enumera los destinos— pero son las anclas del recorrido de
  bienvenida. Quitarlas es otro change, con el recorrido delante.
- No se tocan las pantallas cuya maqueta SÍ es de una columna, y son varias:
  tareas del padre, canjes del padre e hijos. Comprobadas una a una.
- El perfil del niño, el panel del padre, mi cuenta y los dos escaparates ya
  tienen sus columnas. Comprobados.

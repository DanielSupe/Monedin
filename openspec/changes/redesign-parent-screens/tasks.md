## 1. El marco y el panel

- [x] 1.1 Llevar el marco del padre al lateral traído en `add-design-pieces`, conservando lo que
      decidió `pin-sidebar-on-desktop`: columna fija a partir de `lg`, contraíble, cajón por debajo, y
      **una sola de las dos formas montada**.
- [x] 1.2 Los dos avisos del panel con `HeroPanel`: el de tareas en el tono de la acción, el de canjes
      en el del ahorro. La cifra grande y el destino con el filtro ya puesto.
- [x] 1.3 Comprobar que la insignia del lateral sigue contando **filas con el estado buscado** y no el
      total del listado. El de tareas pagina por reparto: un reparto con dos hermanos esperando da 1
      por total y 2 de verdad.
- [x] 1.4 Test de la cuenta con un reparto de estados mezclados y **dos** tareas por aprobar, para que
      la cuenta correcta y las dos equivocadas den números distintos. Con una sola, las tres coinciden.

## 2. La bandeja de tareas

- [ ] 2.1 Los repartos como tarjetas con sus filas por hijo, con `IconTile` y los tonos nuevos.
- [ ] 2.2 Aprobar como acción principal; rechazar acompañando, sin tono de peligro.
- [ ] 2.3 Cada acción dice sobre qué tarea y qué hijo actúa, para quien no ve la pantalla. Cuatro
      botones «Aprobar» seguidos no se distinguen por el orden.
- [ ] 2.4 Conservar la nota de que un reparto filtrado se enseña entero, que ya existe.
- [ ] 2.5 Test: las dos acciones no comparten forma, y rechazar no usa el tono del peligro.

## 3. La bandeja de canjes

- [ ] 3.1 Las filas con el hijo, el premio, el precio y la fecha; estados con los tonos nuevos.
- [ ] 3.2 **Las tres reglas, en la propia bandeja**: se descuenta al aprobar, el precio se congeló al
      pedir, rechazar no descuenta. Textos al catálogo de mensajes, no incrustados.
- [ ] 3.3 Aprobar principal y rechazar acompañando, igual que en tareas.
- [ ] 3.4 Test: con solicitudes pendientes, las tres afirmaciones están en la pantalla. Que falle si
      falta una, no si faltan todas.

## 4. Premios, hijos y sus formularios

- [ ] 4.1 El catálogo con el precio por hijo en cada tarjeta y las tres acciones.
- [ ] 4.2 «Nuevo premio» y «Nueva tarea» con los controles traídos: la casilla de a quién, el grupo de
      opción del valor y el calendario de la fecha límite.
- [ ] 4.3 El recorte de foto con el deslizador traído, que hoy en las maquetas es una barra dibujada.
- [ ] 4.4 El listado de perfiles: acciones con etiqueta corta para que la fila de un perfil bloqueado
      quepa. Ese caso lleva un control más y es el que se sale.
- [ ] 4.5 «Editar perfil» y el historial de un hijo, con los tonos del historial: ganar en el color de
      la moneda, gastar en el del ahorro.
- [ ] 4.6 «Mi cuenta» y las preguntas frecuentes del padre.

## 5. Los tres diálogos

- [ ] 5.1 Retirar un premio: diálogo corto que dice que se revierte publicándolo otra vez.
- [ ] 5.2 Dar de baja: dice que **no se deshace**, qué se pierde, y **ofrece desbloquear** para el
      perfil que solo falló el PIN.
- [ ] 5.3 Recortar una foto: el diálogo con el deslizador y el encuadre.
- [ ] 5.4 Comprobar que ninguna acción irreversible se confirma dentro de la fila.
- [ ] 5.5 Test del diálogo de baja: dice que es irreversible **y** nombra desbloquear. Sin la segunda
      mitad, un diálogo que solo avisa pasaría igual y no ataja el error real.

## 6. Cierre

- [ ] 6.1 Ni un estilo en línea, ni un color literal, ni un valor arbitrario en las doce pantallas.
- [ ] 6.2 Los objetivos de toque en 40 px, que es la escala del padre. No «corregirlos» a 44.
- [ ] 6.3 Abrir las doce en los dos temas y a ancho estrecho.
- [ ] 6.4 Probar con teclado el envío de los cuatro formularios tocados. Los controles traídos cambian
      el comportamiento de lo que hoy funciona, y eso no lo ve ningún test de aspecto.
- [ ] 6.5 `pnpm verify`, y si muere con `allocation failure`, con `--concurrency=1`.

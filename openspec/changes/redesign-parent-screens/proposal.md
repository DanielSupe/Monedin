## Why

Las doce pantallas del padre pasan a la forma de `design/ui/`. Su rediseño es más sobrio que el del
niño a propósito: lo que un padre abre a diario es «qué me está esperando», no un tablero.

Pero el rediseño destapa algo que no es estético, y es el motivo real de este change: **las dos
bandejas piden decisiones sin dar la información para tomarlas.**

Un padre que mira una solicitud de canje ve un nombre, un premio, un precio y dos botones. Lo que no
ve, y no puede deducir de ahí, es lo que la API lleva construido desde el primer día:

- que las monedas **se descuentan al aprobar y no al pedir**, así que una solicitud pendiente no ha
  costado nada todavía;
- que el precio **se congeló el día de la solicitud**, así que subir el precio del premio no cambia lo
  que ese canje va a costar;
- que **rechazar no descuenta nada**, así que decir que no no le quita monedas al niño.

Las tres están en la spec y ninguna llega a la pantalla. El resultado es un padre que aprueba con
dudas, o que no rechaza por miedo a quitarle algo a su hijo.

Y hay una segunda cosa que solo se ve al dibujarla: **aprobar y rechazar salían con el mismo peso**.
Aprobar es lo único que mueve monedas; es la acción principal y la única que debería parecerlo.

## What Changes

- **Las doce pantallas pasan a las piezas del sistema**: el panel de realce, la tesela de icono y los
  tonos renombrados. Escala normal, sin mascota y sin adornos: el padre no necesita que le animen.
- **La bandeja de canjes explica las tres reglas** que una fila no puede decir. No como un texto de
  ayuda escondido: en la propia bandeja, donde se toma la decisión.
- **Aprobar deja de pesar lo mismo que rechazar.** Aprobar es la acción principal; rechazar acompaña,
  y ni compite ni se disfraza de peligro — un rechazo no es un error de nadie.
- **El diálogo de dar de baja desvía a quien se confundió de acción.** Es irreversible y se parece
  demasiado a «desbloquear», que es lo que se busca la mayoría de las veces: alguien falló el PIN.
- **Tres diálogos con la ceremonia que les corresponde**: retirar un premio se revierte publicándolo
  otra vez y se pregunta en corto; dar de baja no se deshace y se dice con todas las letras.
- **Los cuatro controles que en las maquetas estaban dibujados pasan a funcionar**: la casilla de a
  quién se le reparte, el grupo de opción del valor, el deslizador del recorte y la fecha límite.

## Capabilities

### Modified Capabilities

- `redemptions`: la bandeja gana el deber de explicar lo que una fila no puede decir.
- `tasks`: aprobar y rechazar dejan de pesar lo mismo en la bandeja.
- `child-profiles`: el diálogo de una acción irreversible desvía a quien se confundió de acción.

## No incluye

- **Cambiar ninguna regla de negocio.** Las tres cosas que la bandeja pasa a explicar ya son ciertas
  desde `add-redemptions`; lo único que cambia es que se digan.
- **Un editor de ofertas como pantalla propia.** Sigue siendo una acción dentro del catálogo, que es
  donde se ve el premio al que afecta.
- **Las pantallas del niño y las de entrada**, que van en los otros dos changes.
- **La cuenta de la insignia del lateral.** Se arrastra tal cual está: cuenta FILAS con el estado
  buscado y nunca el total del listado, porque el de tareas pagina por reparto.

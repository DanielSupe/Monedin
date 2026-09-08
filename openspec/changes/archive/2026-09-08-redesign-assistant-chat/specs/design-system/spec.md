## ADDED Requirements

### Requirement: El color de la moneda está reservado, y la reserva se hace cumplir

El color de la moneda SHALL usarse únicamente para **el dinero del producto y para la mascota**, y
NO SHALL pintar superficies, botones ni avisos genéricos. Un color que lo pinta todo deja de
significar algo, y este significa «monedas».

La mascota entra en la reserva y no la diluye, porque **Monedín ES una moneda**: no son dos cosas que
comparten color por casualidad, son la misma cosa. Que su voz lleve el color del dinero refuerza lo
que el color quiere decir en vez de gastarlo. Lo que sigue prohibido es exactamente lo que la reserva
existía para impedir: un botón cualquiera, una tarjeta cualquiera, un aviso cualquiera.

La reserva SHALL comprobarse automáticamente, con una lista cerrada de los archivos autorizados a
usarla. Hasta ahora vivía en un comentario del archivo de tokens, y un comentario no lo lee ninguna
verificación: nada impedía pintar un botón de ámbar salvo que alguien se acordara.

#### Scenario: Un componente cualquiera usa el color de la moneda

- **WHEN** un archivo que no está en la lista autorizada usa una utilidad del color de la moneda
- **THEN** la verificación del proyecto falla nombrando el archivo

#### Scenario: Se añade una pieza que sí habla de dinero

- **WHEN** una pieza nueva necesita legítimamente el color de la moneda
- **THEN** se añade a la lista, que es una decisión visible en la revisión y no un descuido

#### Scenario: La lista no puede quedarse vacía sin querer

- **WHEN** se comprueba la lista de archivos autorizados
- **THEN** contiene al menos uno
- **AND** así una lista vaciada por accidente no hace pasar la comprobación por no encontrar nada

## ADDED Requirements

### Requirement: La bandeja explica lo que una fila no puede decir

La bandeja de canjes SHALL explicar, en la propia pantalla donde se decide, las tres cosas que
determinan lo que cuesta una decisión y que no se pueden deducir de una fila:

- que las monedas se descuentan **al aprobar** y no al pedir, así que una solicitud pendiente todavía
  no le ha costado nada al niño;
- que el precio quedó **congelado el día de la solicitud**, así que cambiar el precio del premio
  después no cambia lo que ese canje va a costar;
- que **rechazar no descuenta nada**, así que decir que no no le quita monedas a nadie.

Las tres son ciertas desde que existen los canjes y ninguna llega a la interfaz. El resultado es un
padre que aprueba con dudas o que no rechaza por miedo a quitarle algo a su hijo — y el producto
entero se apoya en que ese padre decida con tranquilidad.

Esa explicación SHALL estar donde se decide y NO SHALL delegarse a una ayuda aparte. Una regla que
hay que ir a buscar no está disponible en el momento en que hace falta.

#### Scenario: Un padre abre la bandeja con canjes pendientes

- **WHEN** se muestran solicitudes por resolver
- **THEN** la pantalla dice que aprobar es lo que descuenta, que el precio está congelado y que
  rechazar no cuesta nada

#### Scenario: El padre duda de si rechazar le quita monedas al niño

- **WHEN** va a rechazar una solicitud
- **THEN** puede leer en la misma pantalla que rechazar no mueve el saldo

#### Scenario: Un premio subió de precio después de pedirse

- **WHEN** una solicitud pendiente corresponde a un premio cuyo precio cambió después
- **THEN** la pantalla deja claro que se cobrará el precio del día en que se pidió

## ADDED Requirements

### Requirement: El PIN se teclea con el teclado además de con la pantalla

Cuando se pide el PIN de un perfil, el sistema SHALL aceptar los dígitos escritos con el teclado del
dispositivo, y SHALL aceptar la tecla de retroceso para corregir. El teclado en pantalla SHALL seguir
existiendo sin perder nada: en una tablet es la vía principal, y esto se añade, no lo sustituye.

Escribir un dígito con el teclado SHALL tener exactamente el mismo efecto que pulsar su tecla en
pantalla, incluido completar el PIN y enviarlo al llegar a su longitud.

Borrar con el teclado SHALL costar lo mismo que borrar en pantalla, es decir **nada**: corregir antes
de completar el PIN no SHALL gastar un intento, porque los intentos bloquean el perfil.

Mientras el PIN ya completado se está comprobando, el teclado NO SHALL admitir más dígitos, igual que
las teclas de la pantalla quedan inertes. Un PIN completo NO SHALL enviarse dos veces por haberse
tecleado el último dígito por dos vías.

Las teclas que no son un dígito ni un retroceso NO SHALL alterar el PIN escrito.

#### Scenario: Se teclea el PIN entero con el teclado

- **WHEN** se escribe con el teclado un PIN correcto de la longitud exigida
- **THEN** el perfil queda activo, igual que pulsando las teclas de la pantalla

#### Scenario: Se corrige con el retroceso

- **WHEN** se escriben unos dígitos con el teclado y se borra el último con el retroceso
- **THEN** el PIN escrito pierde ese dígito
- **AND** no se ha consumido ningún intento

#### Scenario: Las dos vías son la misma

- **WHEN** se empieza el PIN pulsando en pantalla y se termina con el teclado
- **THEN** el PIN vale igual que si se hubiera escrito entero por una sola vía

#### Scenario: Una tecla que no es un dígito no hace nada

- **WHEN** se pulsan letras u otras teclas mientras se pide el PIN
- **THEN** el PIN escrito no cambia

#### Scenario: No se envía dos veces

- **WHEN** se completa el PIN y se sigue tecleando mientras se comprueba
- **THEN** el PIN se envía una sola vez

#### Scenario: Un PIN equivocado tecleado se trata igual

- **WHEN** se escribe con el teclado un PIN equivocado
- **THEN** se rechaza igual que si se hubiera pulsado en pantalla
- **AND** el teclado queda limpio para volver a intentarlo

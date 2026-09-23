# child-profiles

## MODIFIED Requirements

### Requirement: El saldo es lo principal del inicio del niño

En el inicio de un niño, su saldo SHALL tener un sitio propio y constante en la cabecera de la
pantalla, y SHALL leerse de un vistazo sin buscarlo. NO SHALL presentarse como un dato dentro de una
frase.

Es lo que el producto entero existe para enseñar: que las tareas valen monedas y los premios cuestan
monedas. Un número en negrita dentro de un párrafo, al mismo tamaño que los enlaces de al lado, no
enseña nada.

Este requisito DECÍA que el saldo tenía que ser el elemento más grande de la pantalla, y se revierte
a conciencia. Nació de ese defecto —la cifra dentro de un párrafo— y la cura fue el extremo
contrario: una tarjeta que ocupa el tercio superior y empuja las tareas por debajo del pliegue, de
modo que lo primero que ve un niño al entrar es cuánto tiene y lo que viene a hacer hay que buscarlo.
Lo que sustituye al tamaño es el SITIO: siempre la misma esquina, con su moneda al lado. Se encuentra
por posición en vez de por tamaño.

El saldo SHALL dibujarse con la pieza que el sistema tiene para las cantidades, de modo que se escriba
igual que en el resto del producto.

Desde el saldo SHALL poder abrirse el historial: es el gesto natural sobre la cifra, y el historial de
un niño no tiene destino propio en su navegación.

#### Scenario: Un niño entra a su perfil

- **WHEN** se muestra su inicio
- **THEN** su saldo está en la cabecera, con su moneda al lado
- **AND** no se presenta como un dato dentro de una frase

#### Scenario: El saldo se anuncia con su unidad

- **WHEN** se recorre el inicio con un lector de pantalla
- **THEN** el saldo se anuncia con su unidad y no como un número suelto

#### Scenario: Desde el saldo se llega a de dónde salió

- **WHEN** se toca el saldo del inicio
- **THEN** se abre el historial de sus monedas

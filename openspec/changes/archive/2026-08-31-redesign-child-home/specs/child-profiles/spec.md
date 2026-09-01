## ADDED Requirements

### Requirement: El saldo es lo principal del inicio del niño

En el inicio de un niño, su saldo SHALL ser el elemento más grande y lo primero que se lee. NO SHALL
presentarse como un dato dentro de una frase.

Es lo que el producto entero existe para enseñar: que las tareas valen monedas y los premios cuestan
monedas. Un número en negrita dentro de un párrafo, al mismo tamaño que los enlaces de al lado, no
enseña nada.

El saldo SHALL dibujarse con la pieza que el sistema tiene para las cantidades, de modo que se escriba
igual que en el resto del producto.

#### Scenario: Un niño entra a su perfil

- **WHEN** se muestra su inicio
- **THEN** su saldo es el elemento de mayor tamaño de la pantalla
- **AND** se lee antes que cualquier otra cosa

#### Scenario: El saldo se anuncia con su unidad

- **WHEN** se recorre el inicio con un lector de pantalla
- **THEN** el saldo se anuncia con su unidad y no como un número suelto

### Requirement: Los destinos del niño se tocan con el dedo

Los accesos a las áreas del niño desde su inicio SHALL presentarse como objetivos amplios, y NO SHALL
ser enlaces de texto en una lista.

Quien usa esta pantalla tiene entre seis y once años y la abre en una tablet compartida. Un enlace
subrayado de una línea es un objetivo de la altura de una letra.

#### Scenario: Se abre el inicio en una tablet

- **WHEN** se muestran los accesos a las áreas del niño
- **THEN** cada uno ofrece un área tocable holgada, mayor que el mínimo del sistema

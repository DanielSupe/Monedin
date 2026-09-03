## MODIFIED Requirements

### Requirement: La cuenta del padre es un destino vestido, no dos pantallas apiladas

`/account` SHALL presentar **de quién es la cuenta**, la foto y el PIN del padre como **un** destino
con sus partes, usando las piezas del sistema de diseño. NO SHALL usar estilos en línea, colores
literales ni repetir un enlace de vuelta por cada parte que contenga.

Eran dos componentes montados uno debajo del otro, cada uno con su propio «Volver» y su propio
`color: "#b00020"` para los errores. Tres enlaces de vuelta en una pantalla no son tres salidas: son
la señal de que nadie miró la pantalla entera.

Y le faltaba lo primero que una cuenta tiene que decir: **de quién es**. El niño tiene su tarjeta de
identidad en «Mi perfil» —su avatar, su nombre y su saldo— y el padre no tenía la suya, así que
llegaba a una pantalla donde se cambia una credencial sin nada que confirmase en qué cuenta estaba.
En una tablet compartida eso importa más que en un dispositivo personal.

#### Scenario: Se abre la cuenta

- **WHEN** el padre abre `/account`
- **THEN** ve de quién es la cuenta, su foto y el cambio de PIN como partes de una misma pantalla
- **AND** ningún módulo de esa pantalla figura en la lista de deuda de estilos

#### Scenario: La cuenta dice de quién es

- **WHEN** el padre abre `/account`
- **THEN** ve su nombre y el correo con el que entra
- **AND** los ve antes de cualquier control que cambie una credencial

#### Scenario: El correo que se enseña es el de quien está dentro

- **WHEN** dos familias distintas abren cada una su cuenta
- **THEN** cada una ve su propio nombre y su propio correo

#### Scenario: Falla el cambio de PIN

- **WHEN** el cambio de PIN devuelve un error
- **THEN** el error se anuncia con la pieza de aviso del sistema
- **AND** su color sale de un token, no de un literal

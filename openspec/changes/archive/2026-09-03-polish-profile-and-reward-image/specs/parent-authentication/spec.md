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


## ADDED Requirements

### Requirement: El padre elige su avatar del catálogo o sube una foto

El padre SHALL poder cambiar su avatar eligiendo una ilustración del catálogo o subiendo una foto
propia. Las dos SHALL ser formas EXCLUYENTES del mismo campo: mandar las dos a la vez SHALL
rechazarse como entrada inválida, y no mandar ninguna también.

Ofrecía **solo** la foto. No era una decisión de producto: no existía la pantalla donde el padre
eligiera ilustración, y el contrato dejó escrito que ganaría el campo del catálogo cuando existiera.
Existe, y es el mismo selector que el niño ya usa en «Mi perfil» — la misma pieza y no una copia,
porque elegir avatar es lo mismo lo elija quien lo elija.

Una clave de ilustración fuera del catálogo SHALL rechazarse. Una foto SHALL seguir confirmándose
como hasta ahora, con su prefijo y su existencia.

La pantalla NO SHALL repetir el avatar del padre: la tarjeta que dice de quién es la cuenta ya lo
muestra, y enseñarlo dos veces separadas por nada es lo que pasa al añadir una parte sin mirar la
pantalla entera.

#### Scenario: El padre elige una ilustración

- **WHEN** el padre elige una ilustración del catálogo
- **THEN** su avatar pasa a ser esa ilustración
- **AND** viaja así en su sesión y en la rejilla

#### Scenario: El padre elige otra ilustración distinta

- **WHEN** el padre elige una ilustración distinta de la anterior
- **THEN** su avatar es la que acaba de elegir y no la de antes

#### Scenario: Una ilustración que no está en el catálogo

- **WHEN** el padre indica una ilustración que no existe en el catálogo
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Las dos formas a la vez

- **WHEN** el padre manda una ilustración y una foto en la misma operación
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Ninguna de las dos formas

- **WHEN** el padre pide cambiar su avatar sin indicar ilustración ni foto
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: Una foto que no se subió

- **WHEN** el padre confirma una clave de foto que no tiene ningún objeto detrás
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: El avatar no se enseña dos veces

- **WHEN** el padre abre su cuenta
- **THEN** su avatar aparece una sola vez en la pantalla

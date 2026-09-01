## ADDED Requirements

### Requirement: La cuenta del padre es un destino vestido, no dos pantallas apiladas

`/account` SHALL presentar la foto y el PIN del padre como **un** destino con dos partes, usando las
piezas del sistema de diseño. NO SHALL usar estilos en línea, colores literales ni repetir un enlace
de vuelta por cada parte que contenga.

Hoy son dos componentes montados uno debajo del otro, cada uno con su propio «Volver» y su propio
`color: "#b00020"` para los errores. Tres enlaces de vuelta en una pantalla no son tres salidas: son
la señal de que nadie miró la pantalla entera.

#### Scenario: Se abre la cuenta

- **WHEN** el padre abre `/account`
- **THEN** ve su foto y el cambio de PIN como partes de una misma pantalla
- **AND** ningún módulo de esa pantalla figura en la lista de deuda de estilos

#### Scenario: Falla el cambio de PIN

- **WHEN** el cambio de PIN devuelve un error
- **THEN** el error se anuncia con la pieza de aviso del sistema
- **AND** su color sale de un token, no de un literal

### Requirement: Cerrar sesión vive en la cuenta, no en el inicio

Cerrar sesión SHALL ofrecerse desde la cuenta del padre. NO SHALL ofrecerse en su inicio junto a los
atajos de uso diario.

Cerrar sesión y cambiar de perfil se parecen y no lo son: cambiar de perfil devuelve a la rejilla
—varias veces al día, y sin credenciales para volver—, y cerrar sesión obliga a teclear correo y
contraseña otra vez. Ponerlas del mismo tamaño y una al lado de la otra es cómo un padre acaba
tecleando su contraseña porque quería pasarle la tablet a su hijo.

Cambiar de perfil SHALL seguir en el inicio, que es donde está su gemela en el inicio del niño.

#### Scenario: El inicio del padre

- **WHEN** el padre mira su inicio
- **THEN** puede cambiar de perfil
- **AND** no puede cerrar sesión desde ahí

#### Scenario: La cuenta del padre

- **WHEN** el padre abre su cuenta
- **THEN** puede cerrar sesión

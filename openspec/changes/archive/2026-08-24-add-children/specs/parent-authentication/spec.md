## MODIFIED Requirements

### Requirement: Registro público de un padre

El sistema SHALL permitir que cualquier persona cree una cuenta de padre indicando nombre, correo y
contraseña. NO SHALL existir ninguna vía pública de registro para un niño.

#### Scenario: Registro con datos válidos

- **WHEN** alguien se registra con un nombre, un correo no usado y una contraseña que cumple la política
- **THEN** queda creada su cuenta de padre
- **AND** queda con la sesión iniciada, sin tener que acceder acto seguido

#### Scenario: El correo ya está registrado

- **WHEN** alguien intenta registrarse con un correo que ya existe
- **THEN** el registro se rechaza
- **AND** la comprobación la garantiza el almacén, de modo que dos registros simultáneos del mismo
  correo no crean dos cuentas

#### Scenario: La contraseña no cumple la política

- **WHEN** alguien se registra con una contraseña más corta que el mínimo exigido
- **THEN** el registro se rechaza indicando el campo que falla
- **AND** no queda ninguna cuenta a medio crear

#### Scenario: No hay registro de niños

- **WHEN** se recorren los puntos de entrada públicos del sistema
- **THEN** ninguno permite crear un perfil de niño
- **AND** crear uno exige una sesión de cuenta ya acreditada, es decir, un dispositivo previamente
  vinculado a una familia con la contraseña de su padre
- **AND** el perfil creado queda siempre dentro de esa cuenta, porque el padre dueño sale de la
  sesión y nunca del cuerpo de la petición

### Requirement: El padre puede cambiar su PIN de adulto

Con su perfil activo, un padre SHALL poder cambiar su PIN indicando el actual. Cambiarlo NO SHALL
cerrar su sesión de cuenta ni desactivar ningún perfil activo, ni el suyo en este dispositivo ni el
de ningún otro. Lo único que cambia es cuál es el PIN que sirve la próxima vez que haya que teclearlo.

El requisito prometía antes desactivar los perfiles activos en otros dispositivos. Nunca se
implementó, y al escribir el cambio de PIN del niño hubo que fijar la regla para ambos. Se elige
describir lo que el sistema hace: un PIN abre un perfil, y un perfil ya abierto en otro dispositivo
sigue siendo el mismo perfil de la misma persona. Quien quiera echar a alguien de otro dispositivo
tiene la vía que sí existe y sí revoca, que es cerrar la sesión de cuenta.

#### Scenario: Cambio con el PIN actual correcto

- **WHEN** un padre cambia su PIN indicando correctamente el actual
- **THEN** el nuevo queda en vigor y el anterior deja de servir
- **AND** su perfil sigue activo en el dispositivo desde el que lo cambió

#### Scenario: Un perfil abierto en otro dispositivo sigue abierto

- **WHEN** un padre cambia su PIN teniendo su perfil activo en otro dispositivo
- **THEN** ese otro perfil sigue activo
- **AND** volver a entrar allí, una vez salga, exigirá el PIN nuevo

#### Scenario: El PIN actual no coincide

- **WHEN** lo intenta indicando mal el actual
- **THEN** el cambio se rechaza y el PIN anterior sigue siendo el válido

#### Scenario: Un niño no puede cambiar el PIN del padre

- **WHEN** el perfil activo es el de un niño e intenta cambiar el PIN de adulto
- **THEN** la operación se rechaza por falta de permiso

## ADDED Requirements

### Requirement: El formulario dice lo que exige antes de rechazarlo

Los requisitos de una credencial SHALL mostrarse **antes** de intentar enviarla, junto al campo que
los pide.

Hoy la longitud mínima de la contraseña solo se descubre fallando, y de uno en uno, porque el
formulario muestra un único problema. Quien elige una contraseña corta se entera después de
escribirla entera.

#### Scenario: Se abre el formulario de crear cuenta

- **WHEN** se muestra el formulario por primera vez, sin haber escrito nada
- **THEN** junto al campo de la contraseña se indica su longitud mínima

### Requirement: Se explica por qué hacen falta dos credenciales

El formulario de crear cuenta SHALL explicar **para qué sirve cada una** de las dos credenciales que
pide: la contraseña y el PIN.

Sin esa explicación, pedir dos claves distintas en la misma pantalla parece un error del producto.
Son cosas distintas: la contraseña vincula un dispositivo nuevo y se usa muy de vez en cuando; el PIN
se teclea cada vez que alguien entra a su perfil.

#### Scenario: Se muestra el formulario de crear cuenta

- **WHEN** se pide la contraseña y el PIN en la misma pantalla
- **THEN** se dice para qué se usa cada uno

## ADDED Requirements

### Requirement: El diálogo de una baja desvía a quien se confundió de acción

El diálogo que confirma dar de baja un perfil SHALL decir que la baja **no se puede deshacer** y qué
se pierde con ella —el saldo y el historial del niño—, y SHALL ofrecer la salida a quien en realidad
buscaba otra cosa: desbloquear un perfil que solo falló el PIN.

Las dos acciones se parecen desde fuera —un perfil al que no se puede entrar— y solo una es
reversible. Un padre cuyo hijo lleva tres intentos fallidos busca «recuperar su perfil», y lo que
encuentra primero puede ser el que lo borra.

Confirmar NO SHALL bastar con un botón junto a la fila. Una acción irreversible sobre una lista de
hermanos, en una tablet que se usa con el dedo, está a un toque de la fila de al lado.

#### Scenario: Un padre va a dar de baja un perfil

- **WHEN** se pide confirmación
- **THEN** el diálogo dice que no se puede deshacer y qué se pierde
- **AND** ofrece desbloquear como la alternativa para un perfil bloqueado

#### Scenario: El perfil solo está bloqueado

- **WHEN** el perfil sobre el que se va a actuar está bloqueado por intentos fallidos
- **THEN** la alternativa de desbloquear se ofrece antes que la baja

#### Scenario: La confirmación no cuelga de la fila

- **WHEN** se inicia la baja desde el listado de perfiles
- **THEN** la confirmación ocurre fuera de la fila, y no a un toque de la del hermano siguiente

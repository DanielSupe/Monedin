## MODIFIED Requirements

### Requirement: La navegación no se cablea a mano entre componentes

Una pantalla NO SHALL recibir una función cuyo cometido sea cerrarla o devolver a quien la abrió,
**se llame como se llame**. Navegar es trabajo del router.

Un evento de DOMINIO sí es legítimo: `onSaved` dice «esto ocurrió», y quien lo escucha decide a dónde
ir — el mismo formulario se usa desde dos sitios que navegan a destinos distintos. Lo que no vale es
`onDone`, `onCancel`, `onClose`, `onBack` o cualquier otro que signifique «ciérrame»: eso empuja la
navegación a quien llama y ata la pantalla a su punto de uso.

La regla SHALL comprobarse por la FORMA y no por una lista de nombres. `add-app-shell` la dejó atada
a `onDone`, y `onCancel` —que es lo mismo con otra palabra— pasó por delante del test en cinco
archivos sin que saltara. Una convención que se comprueba por su nombre está a un sinónimo de morirse.

#### Scenario: Una pantalla que se abre desde dos sitios distintos

- **WHEN** un formulario se usa desde dos destinos que van a sitios distintos al terminar
- **THEN** avisa de que guardó
- **AND** no recibe ninguna función para cerrarse

#### Scenario: Aparece un sinónimo

- **WHEN** una pantalla recibe una función que significa «ciérrame», con el nombre que sea
- **THEN** falla un test

#### Scenario: Cancelar

- **WHEN** alguien abandona un formulario sin guardar
- **THEN** navega a un destino, como cualquier otra navegación

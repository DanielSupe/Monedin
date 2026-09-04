## REMOVED Requirements

### Requirement: Las imágenes se reducen antes de salir del dispositivo

**Reason**: Ataba dos decisiones que son independientes —recortar y cuánto detalle guardar— y hacía
del recorte una propiedad del avatar en vez de una elección por caso. Su escenario «Una foto de
premio no se recorta a la fuerza» cubría el premio **y** la evidencia con la misma frase, y solo la
mitad sigue siendo cierta, así que no es un requisito que se reescriba: es uno que hay que partir.

El argumento que lo tumba es nuevo y no existía cuando se escribió: desde `redesign-child-surfaces`
los premios se presentan en **rejilla**, y una rejilla con imágenes de proporciones distintas queda
dentada. La objeción original —«recortar a cuadrado quitaría justo lo que hay que ver, el juguete
entero»— suponía un recorte automático; el recortador es interactivo, así que quien sube encuadra y
acerca hasta que el juguete cabe.

**Migration**: Ninguna para lo ya subido. Las fotos existentes se quedan como están y la caja de
proporción fija las encuadra al mostrarlas, sin tocar el archivo del almacén. Nada cambia en la API
ni en los contratos: el servidor firma una clave y nunca ha sabido qué forma tiene el binario.

## ADDED Requirements

### Requirement: Recortar y redimensionar son dos decisiones distintas

El cliente SHALL comprimir y redimensionar una imagen antes de subirla, para que lo que viaja y lo
que se guarda sea proporcionado a cómo se va a mostrar.

Ofrecer recorte y elegir cuánto detalle se guarda SHALL decidirse **por separado**. Una imagen SHALL
poder recortarse y conservar aun así la resolución de una foto: son preguntas independientes —qué
forma tiene y cuánto detalle guarda— y atarlas hace que pedir una arrastre la otra sin quererlo.

Un avatar SHALL guardarse a la medida de un avatar y una foto a la de una foto, aunque las dos se
recorten.

#### Scenario: Una foto grande se sube reducida

- **WHEN** alguien elige una foto tomada con la cámara del dispositivo
- **THEN** lo que se sube pesa sensiblemente menos que el archivo original
- **AND** sigue siendo suficiente para mostrarse donde se va a mostrar

#### Scenario: Recortar no encoge a tamaño de avatar

- **WHEN** se elige una imagen que se recorta pero no es un avatar
- **THEN** se guarda con el detalle de una foto y no con el de un avatar

#### Scenario: Un avatar sigue guardándose como avatar

- **WHEN** alguien elige una foto para usarla como avatar
- **THEN** se guarda a la medida de un avatar

### Requirement: Se recorta lo que se va a presentar en rejilla

El cliente SHALL ofrecer recortar en cuadrado, antes de subir, las imágenes que se presentan **junto
a otras y del mismo tamaño**: los avatares y la foto de un premio.

Un encuadre elegido por quien sube es lo que hace que una rejilla sea una rejilla. Sin él, cada
casilla se estira o se encoge según la foto que le tocó y la fila queda dentada — y quien sube no
tiene forma de arreglarlo, porque el problema no está en su foto sino en que ninguna coincide con
las demás.

El recorte SHALL ser **interactivo**: quien sube ajusta el encuadre y el acercamiento antes de
confirmar. NO SHALL recortarse por el centro sin intervención, que es lo que dejaría fuera la mitad
del juguete.

La evidencia de una tarea NO SHALL recortarse: lo que hay que ver en ella es el conjunto —la cama
hecha, la mesa recogida— y no se presenta junto a otras del mismo tamaño, sino de una en una.

#### Scenario: Encuadrar un avatar

- **WHEN** alguien elige una foto para usarla como avatar
- **THEN** puede ajustar el encuadre cuadrado antes de subirla

#### Scenario: Encuadrar la foto de un premio

- **WHEN** un padre elige una foto para un premio, al publicarlo o al editarlo
- **THEN** puede ajustar el encuadre cuadrado antes de subirla

#### Scenario: El encuadre lo elige quien sube

- **WHEN** alguien recorta una imagen apaisada
- **THEN** puede desplazar y acercar hasta encuadrar lo que quiere conservar
- **AND** no se recorta por el centro sin que intervenga

#### Scenario: Una evidencia no se recorta

- **WHEN** un niño elige una foto como evidencia de una tarea
- **THEN** se sube completa, sin obligar a recortarla en cuadrado

#### Scenario: Se puede desistir del recorte

- **WHEN** alguien abre el recortador y cambia de idea
- **THEN** puede cancelar sin que se suba nada

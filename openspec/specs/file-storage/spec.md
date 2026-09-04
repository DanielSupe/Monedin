## Purpose

Define cómo entra una imagen en Monedín y cómo sale: quién puede subir qué, por qué el archivo nunca
pasa por la API, qué tiene que ser cierto antes de que una referencia se guarde en la base, y cómo se
entrega después para que se pueda pintar sin exponer el almacén. Es la pieza que convierte «avatar» y
«foto» de una promesa escrita en los comentarios del código en algo que un padre y un niño pueden
usar.
## Requirements
### Requirement: Subir una imagen no pasa por la API

El sistema SHALL entregar a quien va a subir una imagen una URL de subida firmada y de vida corta,
contra la que el cliente sube el archivo **directamente al almacén**. La API NO SHALL recibir, cargar
en memoria ni reenviar el contenido del archivo en ningún momento.

La firma SHALL quedar atada al tipo de contenido declarado, de modo que una subida con un tipo
distinto del que se firmó sea rechazada por el propio almacén y no solo por la aplicación.

#### Scenario: Se pide una URL para subir

- **WHEN** alguien autorizado pide subir una imagen de un tipo admitido
- **THEN** recibe una URL de subida, la clave con la que quedará guardada, y cuándo caduca esa URL
- **AND** puede subir el archivo directamente al almacén con esa URL

#### Scenario: Un tipo de archivo que no se admite

- **WHEN** se pide subir algo cuyo tipo no está entre los admitidos
- **THEN** la petición se rechaza como entrada inválida
- **AND** no se entrega ninguna URL de subida

#### Scenario: Subir con un tipo distinto del firmado

- **WHEN** se obtiene una URL firmada para un tipo y se intenta subir otro distinto
- **THEN** el almacén rechaza la subida

#### Scenario: La URL de subida caduca

- **WHEN** se intenta usar una URL de subida después de su caducidad
- **THEN** el almacén la rechaza
- **AND** obtener una nueva es pedirla otra vez

### Requirement: La clave la decide el servidor y lleva a su dueño dentro

El sistema SHALL generar la clave con la que se guarda cada imagen, incluyendo en ella el recurso al
que pertenece. El cliente NO SHALL poder elegirla ni inventarla: solo devuelve la que recibió al pedir
la URL de subida.

#### Scenario: La clave identifica al dueño

- **WHEN** se pide una URL para subir la imagen de un recurso concreto
- **THEN** la clave devuelta corresponde a ese recurso y no a otro

#### Scenario: Dos subidas del mismo recurso no se pisan

- **WHEN** se piden dos URLs de subida seguidas para el mismo recurso
- **THEN** las dos claves son distintas
- **AND** subir la segunda no destruye lo que subió la primera

### Requirement: Una referencia solo se guarda si es de quien dice y existe de verdad

Antes de guardar una clave de imagen contra un recurso, el sistema SHALL comprobar **las dos cosas**:
que la clave corresponde al recurso sobre el que se está confirmando, y que el objeto existe
realmente en el almacén.

Comprobar solo lo primero dejaría guardar referencias a imágenes que nunca llegaron a subirse;
comprobar solo lo segundo dejaría apuntar a la imagen de otro, que sí existe. Ninguna de las dos
comprobaciones basta sola.

#### Scenario: Se confirma una subida completada

- **WHEN** se confirma una clave propia cuyo archivo se subió correctamente
- **THEN** la referencia queda guardada contra el recurso
- **AND** las lecturas posteriores del recurso devuelven esa imagen

#### Scenario: Se confirma una clave que nunca se subió

- **WHEN** se confirma una clave con el prefijo correcto pero cuyo archivo nunca llegó al almacén
- **THEN** la operación se rechaza como entrada inválida
- **AND** el recurso conserva la imagen que tuviera antes, o ninguna

#### Scenario: Se confirma la clave de otro recurso

- **WHEN** se confirma una clave que pertenece a un recurso distinto, aunque su archivo exista
- **THEN** la operación se rechaza como entrada inválida
- **AND** no se guarda ninguna referencia

### Requirement: Las imágenes se entregan como URLs firmadas, nunca como claves

Toda respuesta de la API que incluya una imagen guardada SHALL entregarla como una URL de lectura
firmada y de vida corta, lista para pintarse. El sistema NO SHALL exponer la clave del almacén ni
obligar al cliente a construir la dirección por su cuenta.

El almacén SHALL ser privado: una dirección sin firma NO SHALL dar acceso a ninguna imagen.

#### Scenario: Una imagen guardada se lee

- **WHEN** se consulta un recurso que tiene una imagen propia
- **THEN** la respuesta trae una URL con la que se puede mostrar directamente
- **AND** no trae la clave del almacén

#### Scenario: Un recurso sin imagen

- **WHEN** se consulta un recurso que no tiene ninguna imagen propia
- **THEN** la respuesta lo dice explícitamente y no trae ninguna dirección rota

#### Scenario: El almacén no es público

- **WHEN** se intenta acceder a una imagen sin una firma válida
- **THEN** el almacén deniega el acceso

### Requirement: Pedir una subida exige ser dueño de aquello que se va a ilustrar

Pedir una URL de subida SHALL exigir las mismas condiciones de rol y de propiedad que operar sobre el
recurso al que pertenece la imagen. Un recurso ajeno o inexistente SHALL responder como inexistente,
nunca confirmando que existe.

#### Scenario: Se pide subir sobre un recurso ajeno

- **WHEN** alguien pide una URL de subida para un recurso que no es suyo
- **THEN** la respuesta es la misma que para un recurso inexistente
- **AND** no se entrega ninguna URL

#### Scenario: Se pide subir con el rol equivocado

- **WHEN** alguien pide una URL de subida para algo que su rol no puede modificar
- **THEN** la operación se rechaza por falta de permiso

#### Scenario: Se pide subir sin haber elegido perfil

- **WHEN** se pide una URL de subida con la cuenta acreditada pero sin perfil activo
- **THEN** la operación se rechaza por falta de sesión

### Requirement: La batería de tests está aislada del almacén real por tres vías

La batería de tests VACÍA su bucket al arrancar. Para que eso no pueda alcanzar jamás a datos reales,
el aislamiento respecto del almacén de la aplicación SHALL sostenerse sobre **tres** separaciones
independientes, y las tres SHALL cumplirse a la vez:

1. **Bucket distinto.** El bucket de la batería SHALL ser distinto del de la aplicación, y arrancar
   con ambos iguales SHALL fallar con un mensaje que explique la consecuencia.
2. **Endpoint propio.** La batería SHALL apuntar a un endpoint declarado por su cuenta, y ese
   endpoint NO SHALL admitir el valor vacío, porque vacío significa «el almacén gestionado del
   proveedor».
3. **Credenciales propias.** La batería SHALL autenticarse con credenciales declaradas por su
   cuenta, distintas de las de la aplicación.

Ninguna de las tres es redundante: cada una tapa un camino por el que la batería podría acabar
hablando con el almacén real, y basta que falte una para que cambiar la configuración de desarrollo
arrastre a los tests.

#### Scenario: Desarrollo se pasa al proveedor real

- **WHEN** la aplicación se configura contra un almacén real, con su endpoint gestionado y sus
  credenciales
- **THEN** la batería sigue hablando con el almacén local, con su bucket y sus credenciales
- **AND** ninguna pasada de tests puede vaciar un bucket real

#### Scenario: Las credenciales de la aplicación dejan de servir para el almacén local

- **WHEN** las credenciales de la aplicación pertenecen a un proveedor distinto del que usa la batería
- **THEN** los tests de almacenamiento siguen pasando
- **AND** no fallan por autenticación

#### Scenario: El bucket de la batería coincide con el de la aplicación

- **WHEN** ambos nombres son iguales
- **THEN** la batería se niega a ejecutarse
- **AND** el mensaje explica que habría borrado los archivos con los que se está trabajando

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


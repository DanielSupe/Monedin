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

### Requirement: Las imágenes se reducen antes de salir del dispositivo

El cliente SHALL comprimir y redimensionar una imagen antes de subirla, para que lo que viaja y lo
que se guarda sea proporcionado a cómo se va a mostrar. Cuando la imagen sea un avatar, el cliente
SHALL además ofrecer recortarla en cuadrado antes de subir, porque un avatar se pinta pequeño y su
encuadre importa.

Las imágenes que no son avatares —la foto de un premio, la evidencia de una tarea— NO SHALL recortarse
a la fuerza: lo que hay que ver en ellas es el conjunto.

#### Scenario: Una foto grande se sube reducida

- **WHEN** alguien elige una foto tomada con la cámara del dispositivo
- **THEN** lo que se sube pesa sensiblemente menos que el archivo original
- **AND** sigue siendo suficiente para mostrarse donde se va a mostrar

#### Scenario: Encuadrar un avatar

- **WHEN** alguien elige una foto para usarla como avatar
- **THEN** puede ajustar el encuadre cuadrado antes de subirla

#### Scenario: Una foto de premio no se recorta a la fuerza

- **WHEN** alguien elige una foto para un premio o como evidencia de una tarea
- **THEN** se sube completa, sin obligar a recortarla en cuadrado

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

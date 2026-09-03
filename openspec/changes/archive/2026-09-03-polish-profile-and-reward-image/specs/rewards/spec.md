## REMOVED Requirements

### Requirement: Un premio puede llevar una foto, que se añade al editarlo

**Reason**: Su afirmación central se invierte. Decía que el sistema «NO SHALL aceptar una foto en el
alta», y ahora la acepta, así que no es un requisito que se reescriba: es uno que deja de ser cierto.
Se retira entero —con su escenario «El alta no acepta una foto», que pasaba a afirmar lo contrario de
lo que ocurre— y lo sustituye el de abajo.

La razón de aquel requisito no era de producto sino de orden: la clave de la imagen incluía el
identificador del premio, que no existe mientras se crea. Lo que cambia no es la regla sino de qué
cuelga una clave todavía sin dueño.

**Migration**: Ninguna para los datos: `Reward.image` no cambia y los premios publicados sin foto
siguen igual. Para quien llama, el alta pasa a aceptar `imageUploadKey` opcional, y lo que antes era
un 422 por mandarla ahora es un alta válida. La vía de subida que cuelga de un premio ya creado sigue
existiendo sin cambios, así que ningún cliente que solo editara se ve afectado.

## ADDED Requirements

### Requirement: Un premio puede llevar una foto, desde el alta o editándolo

Un padre SHALL poder ponerle una foto a un premio suyo **al publicarlo** y también **editándolo**. El
sistema SHALL aceptar en el alta una clave de imagen ya subida, y SHALL confirmarla con las mismas
dos comprobaciones que cualquier otra: que la clave empiece por el prefijo de quien la sube y que el
objeto exista de verdad.

El requisito decía lo contrario, y su razón era de orden y no de producto: la imagen se guardaba bajo
una clave que incluye el identificador del premio, y ese identificador no existe mientras el premio
se está creando. Lo que cambia es **de qué cuelga la clave de una foto todavía sin dueño**: al
publicar, del padre que la sube, que sí existe. Publicar un premio es una operación de un padre con
perfil activo, así que hay a quién atribuirla.

Una imagen subida para un premio que luego no se publica SHALL quedar huérfana sin más
consecuencias, según la decisión ya cerrada de no borrar objetos huérfanos.

Un premio sin foto SHALL seguir siendo un premio completamente válido, en el catálogo y en el
escaparate.

#### Scenario: El padre publica un premio con foto

- **WHEN** un padre sube una imagen y publica un premio indicando esa clave
- **THEN** el premio queda creado con esa foto
- **AND** el catálogo del padre la muestra

#### Scenario: El padre le pone una foto a un premio suyo

- **WHEN** un padre sube una imagen y la confirma sobre un premio suyo
- **THEN** el premio queda con esa foto
- **AND** el catálogo del padre la muestra

#### Scenario: Un premio se publica sin foto

- **WHEN** un padre publica un premio sin foto
- **THEN** el premio queda creado y es válido
- **AND** aparece en el catálogo y en el escaparate de los hijos a los que se ofrece

#### Scenario: El alta rechaza una clave que no es de quien publica

- **WHEN** un padre publica un premio indicando la clave de una imagen subida por otra persona
- **THEN** la operación se rechaza como entrada inválida
- **AND** el premio no se crea

#### Scenario: El alta rechaza una clave de una imagen que no se subió

- **WHEN** un padre publica un premio indicando una clave con su propio prefijo pero sin objeto detrás
- **THEN** la operación se rechaza como entrada inválida
- **AND** el premio no se crea

#### Scenario: Se quita la foto de un premio

- **WHEN** un padre borra explícitamente la foto de un premio suyo
- **THEN** el premio se queda sin foto
- **AND** sigue siendo válido en el catálogo y en el escaparate

#### Scenario: Un niño no le pone foto a un premio

- **WHEN** un perfil de niño intenta subir o confirmar la foto de un premio
- **THEN** la operación se rechaza por falta de permiso

#### Scenario: Un niño no pide una vía de subida para publicar

- **WHEN** un perfil de niño pide una vía de subida de imagen de premio
- **THEN** la operación se rechaza por falta de permiso

#### Scenario: Un premio ajeno no admite foto

- **WHEN** un padre pide subir la foto de un premio de otra familia
- **THEN** la respuesta es la misma que para un premio inexistente
- **AND** no se entrega ninguna URL de subida

#### Scenario: Pedir una vía de subida no crea ningún premio

- **WHEN** un padre pide una vía de subida y no llega a publicar el premio
- **THEN** su catálogo sigue igual que antes
- **AND** la imagen subida no aparece en ningún premio

### Requirement: La vía de subida para publicar no pide un premio que aún no existe

El sistema SHALL ofrecer una vía de subida de imagen que NO exija identificar un premio, para poder
elegir la foto antes de publicarlo. SHALL exigir perfil de padre activo, y la clave que entregue
SHALL colgar de quien la pide y no de ningún premio.

Esa vía SHALL convivir con la que sí cuelga de un premio concreto, que sigue siendo la de editar uno
ya publicado. NO SHALL conformarse con la sesión de cuenta: publicar un premio ya exige perfil de
padre, así que la subida previa puede exigir lo mismo y la lista de operaciones que se conforman con
la cuenta SHALL quedar igual que estaba.

#### Scenario: El padre pide una vía de subida antes de publicar

- **WHEN** un padre con perfil activo pide una vía de subida de imagen de premio sin indicar ninguno
- **THEN** recibe una dirección de subida y la clave con la que confirmarla
- **AND** la clave cuelga de él y no de ningún premio

#### Scenario: Sin perfil de padre activo no hay vía de subida

- **WHEN** se pide esa vía de subida con la cuenta acreditada pero sin perfil de padre activo
- **THEN** la operación se rechaza por falta de sesión o de permiso

#### Scenario: La clave de un padre no le sirve a otro

- **WHEN** un padre publica un premio con la clave que recibió otro padre
- **THEN** la operación se rechaza como entrada inválida

#### Scenario: La vía sin premio no tapa al detalle de un premio

- **WHEN** se piden por separado esa vía de subida y el detalle de un premio concreto
- **THEN** cada una responde lo suyo
- **AND** ninguna se interpreta como la otra

### Requirement: Un premio sin foto se dibuja con un respaldo, no con un hueco

Cuando un premio no tenga foto, las pantallas que lo muestran SHALL dibujar un respaldo visible en su
lugar. NO SHALL dejar el espacio vacío.

Vale tanto para el catálogo del padre como para el escaparate del niño. Un hueco donde el resto de
las filas tienen imagen se lee como algo que se rompió al cargar, no como un premio sin foto; y en
cuanto los premios se presenten como productos, una rejilla con huecos deja de ser una rejilla.

#### Scenario: Un premio sin foto en el escaparate del niño

- **WHEN** un niño mira un premio ofrecido a él que no tiene foto
- **THEN** ve un respaldo en el lugar de la imagen
- **AND** el premio sigue siendo pedible con normalidad

#### Scenario: Un premio sin foto en el catálogo del padre

- **WHEN** un padre mira en su catálogo un premio sin foto
- **THEN** ve un respaldo en el lugar de la imagen

#### Scenario: Un premio con foto no lleva respaldo

- **WHEN** un premio tiene foto
- **THEN** se muestra la foto
- **AND** no se muestra además el respaldo

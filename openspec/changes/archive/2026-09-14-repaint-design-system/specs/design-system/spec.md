## MODIFIED Requirements

### Requirement: El sistema distingue los tonos de un aviso

El sistema SHALL ofrecer una pieza de aviso con tonos diferenciados como mínimo para información,
éxito, advertencia y error, y SHALL permitir que un conflicto —dos personas actuando sobre lo mismo,
que la API resuelve con un 409— se comunique con un tono propio y un texto explicativo.

La API ya distingue sus errores con un código estable; la interfaz SHALL poder reflejar esa distinción
en lugar de aplanarla en un texto rojo único.

Cada tono SHALL nombrarse por **el papel que cumple** y no por el color que lleva, igual que se nombra
un token o una variante de botón. Un nombre que describe el valor se queda obsoleto en cuanto el valor
cambia; uno que describe el papel sobrevive.

El tono del error SHALL conservar un matiz propio, distinto del de la acción principal. Es la única
excepción admitida a la paleta de la marca, y lo es porque un color de peligro no es una decisión de
marca: si el mismo matiz dijera «pulsa aquí» y «esto falló», el color dejaría de hacer lo único para
lo que existe.

#### Scenario: Un error de validación y un conflicto

- **WHEN** una pantalla recibe un error de validación y otra recibe un conflicto
- **THEN** cada una dispone de un tono distinto con el que comunicarlo

#### Scenario: Un aviso es anunciado

- **WHEN** aparece un aviso de error como resultado de una acción del usuario
- **THEN** queda expuesto a las tecnologías de asistencia sin que la pantalla tenga que recordarlo

#### Scenario: El color de un tono cambia

- **WHEN** se reasigna el color de un tono del sistema
- **THEN** su nombre sigue describiéndolo, porque nombra el papel y no el color
- **AND** ningún punto de uso tiene que cambiar por el hecho de que el color sea otro

#### Scenario: El error y la acción principal aparecen en la misma pantalla

- **WHEN** una pantalla muestra a la vez su acción principal y un aviso de error
- **THEN** se distinguen por matiz, y no solo por posición o por texto

## ADDED Requirements

### Requirement: El tema se reasigna entero, y la paridad se comprueba

El front SHALL ofrecer un tema oscuro, y ese tema SHALL declararse **reasignando la capa semántica de
tokens**, sin que ninguna pieza lo conozca. Es el mismo mecanismo con el que una superficie de color
reasigna los neutros: una pieza pide «texto secundario» y lo que cambia es el VALOR de ese token.

El tema SHALL admitir tres estados: claro explícito, oscuro explícito, y **la preferencia del sistema
cuando no se ha elegido ninguno**. Con solo dos estados habría que escribir uno por defecto antes del
primer pintado, que es de donde salen los destellos al cargar.

El esquema de color declarado al navegador SHALL seguir al tema, para que los controles NATIVOS
—barras de desplazamiento, autocompletado, selectores de fecha y de archivo— no se queden con el
aspecto del tema contrario.

El bloque de un tema SHALL reasignar **todos** los tokens semánticos que declara el tema por defecto,
y eso SHALL comprobarse automáticamente. Es lo único de un tema que una batería puede verificar,
porque el entorno de pruebas no aplica CSS: el aspecto se comprueba abriendo pantallas, pero que no
falte ningún valor se comprueba leyendo el archivo.

#### Scenario: El dispositivo prefiere el tema oscuro y nadie ha elegido

- **WHEN** se abre la aplicación en un dispositivo configurado en oscuro y sin tema elegido
- **THEN** la interfaz se pinta en oscuro desde el primer pintado, sin destello

#### Scenario: Se añade un token semántico y se olvida su valor oscuro

- **WHEN** se declara un token semántico nuevo en el tema por defecto y no se declara en el oscuro
- **THEN** la verificación del proyecto falla nombrando el token que falta

#### Scenario: Una pieza no sabe en qué tema está

- **WHEN** se cambia de tema
- **THEN** ninguna pieza necesita una rama, una clase ni una prop para pintarse correctamente

#### Scenario: Un control nativo aparece en una pantalla

- **WHEN** se muestra un selector de fecha, un selector de archivo o una barra de desplazamiento
- **THEN** el control se pinta con el esquema del tema vigente y no con el contrario

### Requirement: Una superficie clara anidada vuelve a los valores del tema vigente

Cuando un componente que pinta su propio fondo se anide dentro de una superficie de color, los tokens
que restituya SHALL ser los del **tema vigente**, y NO SHALL ser los del tema claro escritos
literalmente.

Escribir ahí los valores claros funciona mientras solo haya un tema y se vuelve exactamente del revés
en cuanto hay dos: el componente restituiría una tinta oscura sobre el fondo oscuro que él mismo
acaba de pintar.

#### Scenario: Un aviso dentro de una superficie de color, en tema oscuro

- **WHEN** un componente con fondo propio se muestra dentro de una superficie de color y el tema es
  oscuro
- **THEN** su tinta y sus bordes son los del tema oscuro, y el texto se lee sobre su fondo

#### Scenario: El mismo componente en tema claro

- **WHEN** ese mismo componente se muestra en tema claro dentro de una superficie de color
- **THEN** restituye los valores claros, como hasta ahora

### Requirement: La escala de radios y de tipografía es cerrada y se nombra por su papel

El sistema SHALL declarar un número cerrado de pasos de radio y de tamaño tipográfico, y cada paso
SHALL nombrarse por **lo que envuelve o para qué sirve**, no por cuánto mide. Ningún punto de uso
SHALL introducir un paso intermedio.

Una escala abierta no es una escala: si cada pantalla puede elegir su valor, dos pantallas que
resuelven lo mismo acaban con medidas distintas y nadie puede decir cuál es la correcta.

El radio de una píldora entra en la escala como cualquier otro paso, aunque su valor sea trivial: hoy
se escribe a mano en cada punto de uso, que es justo lo que la regla del origen único prohíbe.

#### Scenario: Una pantalla necesita un radio intermedio

- **WHEN** una pantalla usa un radio que no es ninguno de los pasos declarados
- **THEN** la verificación del proyecto falla señalando el archivo de tokens como el sitio correcto

#### Scenario: Un paso se nombra por su medida

- **WHEN** se propone un paso de escala cuyo nombre describe cuánto vale
- **THEN** se nombra por su papel, para que reasignarlo no deje el nombre mintiendo

### Requirement: Una audiencia con otra distancia de lectura tiene su propia escala

Cuando una pantalla se lea a una distancia o con una intención distintas de las de las audiencias
existentes, SHALL declararse como una escala propia, y NO SHALL estirarse la escala de otra audiencia
para acomodarla.

Estirar una escala existente la deforma para todas las pantallas que la usan por culpa de una sola.

#### Scenario: La página pública necesita titulares mayores que cualquier pantalla

- **WHEN** la puerta pública necesita un tamaño que supera el mayor de las audiencias existentes
- **THEN** se declara una escala propia para esa audiencia
- **AND** las escalas del padre y del niño mantienen sus valores

### Requirement: Un componente de terceros se adopta sin adoptar su paleta

El sistema SHALL poder incorporar componentes de una librería externa **sin declarar los colores de
esa librería**. Los nombres de variable que el componente externo espera SHALL resolverse a los tokens
del sistema desde el archivo de tokens, y NO SHALL declararse un segundo juego de valores de color.

Copiar el bloque de tema de una librería daría dos fuentes de verdad del color, que es exactamente lo
que la regla del origen único existe para impedir.

El mecanismo de tema del sistema SHALL seguir siendo el suyo: un componente externo que traiga su
propia convención de tema se adapta al reasignar los valores, y no obliga a escribir esa convención en
los puntos de uso.

#### Scenario: Se incorpora un componente externo

- **WHEN** se trae un componente de una librería externa que espera sus propias variables de color
- **THEN** esas variables se resuelven a tokens del sistema desde el archivo de tokens
- **AND** el componente se repinta con la paleta del producto sin editar su color

#### Scenario: El tema cambia con un componente externo en pantalla

- **WHEN** se cambia de tema y hay un componente externo montado
- **THEN** se repinta como cualquier pieza propia, sin necesitar la convención de tema de su librería

#### Scenario: Alguien copia el bloque de tema de la librería

- **WHEN** un archivo distinto del archivo de tokens declara un color de la librería externa
- **THEN** la verificación del proyecto falla señalando el archivo y el valor

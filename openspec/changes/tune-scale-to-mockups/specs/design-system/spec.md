# design-system

## ADDED Requirements

### Requirement: La escala y el peso salen de las maquetas, y se pueden medir

Los pasos de cada escala tipográfica y el registro de pesos del sistema SHALL corresponder a lo que
las maquetas de referencia usan, y esa correspondencia SHALL ser verificable contando las
declaraciones de los artboards en lugar de mirándolos.

Los artboards son HTML con estilos en línea, así que cada tamaño y cada peso se puede contar. Eso
convierte «se ve distinto» en una cifra, y es lo que permite distinguir un defecto de una pantalla de
un defecto del sistema: si la aplicación escribe 30px donde la maqueta escribe 16 en dieciocho
sitios, lo que está mal es el token.

El registro de pesos SHALL declararse en la capa de tokens y NO SHALL reescribirse en cada pieza. Una
pieza pide «semibold» y lo que cambia es a qué apunta esa palabra en este producto, igual que un
color semántico cambia de valor sin que ninguna pieza se entere.

Cuando el registro declarado haga que un nombre signifique algo distinto de su valor habitual, SHALL
decirse en el propio archivo de tokens. Una palabra que significa otra cosa sin avisar es peor que un
valor raro.

#### Scenario: Se compara una pantalla con su maqueta

- **WHEN** se cuentan los tamaños y pesos de una pantalla y los de su maqueta
- **THEN** los pasos que domina cada una son los mismos

#### Scenario: El diseño ajusta su registro tipográfico

- **WHEN** las maquetas cambian el peso con el que se escribe el producto
- **THEN** se ajusta en la capa de tokens, sin tocar ninguna pieza ni ninguna pantalla

#### Scenario: Una cifra de la aplicación no sale de la maqueta

- **WHEN** un paso de la escala se aparta de lo que la maqueta usa por una decisión de producto
- **THEN** esa decisión queda escrita donde vive el token, en lugar de corregirse en silencio

### Requirement: El camino de entrada tiene su propia escala, y no hereda la del padre

Las pantallas previas a tener un rol —acceso, registro, rejilla de perfiles, teclado de PIN, alta de
perfil y restablecer PIN— SHALL declarar una escala propia, y NO SHALL quedarse con la escala base
por no declarar ninguna.

La escala base es la del padre, que es la más densa del producto. No declarar nada no significa «no
elegir»: significa elegir la del padre en silencio, y un valor por defecto que tapa una decisión
ausente es lo que este proyecto no admite en ninguna otra capa.

El conjunto de pantallas que la reciben SHALL seguir sin enumerarse. Las que van dentro del marco de
entrada la reciben del marco; las que van a sangre la declaran ellas, igual que la puerta pública
declara la suya.

#### Scenario: Se llega a una pantalla previa a tener un rol

- **WHEN** se abre cualquiera de ellas, con o sin marco
- **THEN** su texto se dibuja con la escala del camino de entrada, y no con la del padre ni con la
  del niño

#### Scenario: Se añade una pantalla al camino de entrada

- **WHEN** se declara una ruta nueva que llega sin actor y se conforma con el marco
- **THEN** recibe esa escala sin que nadie tenga que acordarse

### Requirement: Un paso de la escala sirve a UN papel

Cuando un mismo paso de la escala esté sirviendo a dos papeles que las maquetas dibujan a tamaños
distintos, SHALL repartirse entre los pasos que ya existen en lugar de ajustar su valor.

Un paso que sirve al encabezado de una sección, al logo y a un botón grande a la vez no se puede
corregir cambiando su valor, porque no hay un valor que sirva a los tres. La escala tiene siete pasos
nombrados por su papel precisamente para que cada papel tenga el suyo.

#### Scenario: Un paso sirve a dos papeles de tamaño distinto

- **WHEN** se corrige el valor de un paso y eso rompe otro papel que lo comparte
- **THEN** los papeles se reparten entre los pasos existentes, sin inventar uno nuevo

### Requirement: Una pieza declara sus tallas, y el CSS generado no decide ninguna

Una pantalla NO SHALL imponer el tamaño de texto de una pieza pasándole una utilidad por `className`.
Cuando una pieza necesite una talla que no tiene, SHALL declararla como opción de la pieza.

`cx` no fusiona utilidades de Tailwind, así que dos del mismo grupo las resuelve el orden del CSS
generado. Eso hace que una imposición desde fuera pueda funcionar hoy por el orden que tocó y dejar
de funcionar al cambiar el token que se pide, sin que nada falle.

#### Scenario: Una pantalla necesita una pieza a otro tamaño

- **WHEN** ese tamaño no está entre las tallas de la pieza
- **THEN** se añade como talla de la pieza, nombrada por su papel

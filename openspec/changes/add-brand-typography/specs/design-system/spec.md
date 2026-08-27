## ADDED Requirements

### Requirement: La tipografía la entrega el sistema, no el dispositivo

La familia tipográfica de la marca SHALL ser la **misma en todos los dispositivos**. El sistema SHALL
entregarla, y NO SHALL delegarla en lo que cada sistema operativo tenga instalado.

Una pila de familias del sistema resuelve a algo distinto en cada aparato: lo que en uno se ve
redondeado, en otro no. Eso convierte una decisión de diseño en una lotería, y es tan inaceptable
como dejar un color a criterio del navegador.

SHALL declararse igualmente una pila de respaldo del sistema **detrás** de la familia de la marca. Si
la fuente tarda o falla, lo que se ve es esa pila y nunca la serif por defecto del navegador.

#### Scenario: La misma pantalla en dos dispositivos distintos

- **WHEN** se abre la misma pantalla en dos sistemas operativos diferentes
- **THEN** el texto se dibuja con la misma familia tipográfica en los dos

#### Scenario: La fuente no llega a cargar

- **WHEN** el archivo de la fuente no está disponible
- **THEN** el texto se dibuja con la pila de respaldo del sistema
- **AND** sigue siendo legible, sin caer en la serif por defecto del navegador

#### Scenario: Mientras la fuente carga

- **WHEN** la página se pinta antes de que la fuente haya terminado de cargar
- **THEN** el texto es visible desde el primer momento con el respaldo
- **AND** no queda invisible esperando

### Requirement: Ningún recurso visual viene de un tercero

El front NO SHALL solicitar a un dominio de terceros ninguna fuente, imagen, hoja de estilos ni
script para pintarse. Todo lo que necesita SHALL servirse desde su propio origen.

Son dos razones, y las dos importan. Una: cada petición a un tercero le revela a ese tercero la IP de
una familia que usa el producto, y este producto es de niños. Dos: una dependencia externa en el
camino crítico es algo más que puede caerse, ir lento o estar bloqueado, y no lo controlamos.

#### Scenario: Se abre cualquier pantalla

- **WHEN** se carga una pantalla del front
- **THEN** todas las peticiones van al propio origen o a la API del producto
- **AND** ninguna va a un dominio de terceros

#### Scenario: Se añade un recurso visual nuevo

- **WHEN** el diseño necesita una fuente o un archivo que no está en el proyecto
- **THEN** se incorpora al proyecto y se sirve desde el propio origen
- **AND** no se enlaza desde el dominio de quien lo publica

### Requirement: Las cifras de una columna alinean

Cuando se muestren varias cantidades en monedas una debajo de otra, sus dígitos SHALL ocupar todos el
mismo ancho, de modo que las cifras queden alineadas en columna.

Con cifras de ancho variable, `120` y `1.250` desalinean sus dígitos y una lista de saldos se lee como
un texto en vez de como una tabla de números. Comparar de un vistazo cuánto tiene cada hijo es
justamente lo que un padre hace en esa pantalla.

#### Scenario: Varios saldos en una lista

- **WHEN** se muestran las cantidades de varios hijos, una debajo de otra
- **THEN** sus dígitos quedan alineados verticalmente

#### Scenario: Una cantidad que cambia

- **WHEN** una cantidad se anima contando de cero a su valor
- **THEN** el texto no se desplaza a cada paso de la cuenta

## ADDED Requirements

### Requirement: Las tareas del niño se agrupan por su etapa del ciclo

Las tareas de un niño SHALL presentarse agrupadas por la etapa en la que están —por hacer, esperando
revisión y hechas—, y el orden de los grupos SHALL ser siempre ese, el del ciclo.

Las tres etapas son la máquina de estados que el producto protege con transiciones condicionales y
pruebas de doble tap, y hasta ahora no se veía por ninguna parte: una columna con una insignia por
fila obliga a leer cada insignia para saber qué se puede hacer.

Un grupo sin tareas NO SHALL dibujarse, ni con un cero ni con un texto. La pantalla de un niño que no
tiene nada pendiente tiene que verse tranquila, no llena de ceros — es la misma regla que ya cumple el
panel del padre.

El orden de los grupos NO SHALL depender de cuántas tareas tenga cada uno. Ordenar por volumen haría
que la pantalla cambiara de forma cada día, y lo que se aprende de una pantalla es dónde están las
cosas.

#### Scenario: Un niño tiene tareas en las tres etapas

- **WHEN** se muestran sus tareas
- **THEN** aparecen en tres grupos, en el orden del ciclo
- **AND** cada grupo dice cuántas tiene

#### Scenario: Un niño no tiene ninguna esperando revisión

- **WHEN** una etapa no tiene ninguna tarea
- **THEN** ese grupo no se dibuja

#### Scenario: Una etapa tiene muchas más que las otras

- **WHEN** una etapa acumula la mayoría de las tareas
- **THEN** el orden de los grupos no cambia

### Requirement: El niño ve cuánto lleva hecho de sus tareas

El niño SHALL poder ver de un vistazo cuántas de sus tareas ha hecho sobre el total, sin contarlas.

Una tarea marcada cuenta como hecha desde el punto de vista del niño: él ya hizo su parte, y que falte
aprobarla es trabajo de otro. Lo que la cifra mide es lo suyo.

Esa cuenta NO SHALL recortarse por jornada ni presentarse como «lo de hoy». Una tarea no tiene
concepto de día: solo una fecha límite opcional que, por decisión del producto, ni caduca ni avisa.
Decir «hoy» sería enseñar como dato algo que el modelo no sabe.

#### Scenario: Un niño abre su inicio

- **WHEN** tiene cinco tareas y ha marcado o le han aprobado dos
- **THEN** ve que lleva dos de cinco, sin tener que contarlas

#### Scenario: La cuenta se anuncia sin verla

- **WHEN** se recorre la pantalla con un lector de pantalla
- **THEN** el avance se anuncia con su valor y lo que significa, no como una figura decorativa

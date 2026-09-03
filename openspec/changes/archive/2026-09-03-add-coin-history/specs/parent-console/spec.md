## ADDED Requirements

### Requirement: Un saldo se puede explicar

Tanto el niño como el padre SHALL poder ver de dónde salió un saldo, sin salir a buscarlo.

Para el niño es la mitad del ciclo que el producto enseña: «tienes 120» sin «esto vino de recoger la
mesa» es un número mágico para alguien de seis años. Para el padre es la respuesta a «este saldo no
me cuadra», que hoy no tiene dónde mirar.

El acceso SHALL salir del propio saldo: es el gesto natural —mirar el número y preguntar de dónde
viene— y no obliga a añadir un destino más a la navegación de un niño que ya tiene cuatro.

#### Scenario: El niño mira su saldo

- **WHEN** el niño está en su inicio, donde su saldo se ve en grande
- **THEN** puede llegar desde ahí a ver de dónde salió

#### Scenario: El padre mira el saldo de un hijo

- **WHEN** el padre ve el saldo de uno de sus hijos
- **THEN** puede llegar desde ahí a su historial

### Requirement: Un movimiento se lee sin hacer cuentas

Cada movimiento SHALL mostrar qué lo produjo, cuánto movió y el saldo con el que quedó, y SHALL
distinguirse por algo más que el signo del número si acredita o descuenta.

Que sume o reste es la información más importante de la fila, y un `-60` frente a un `60` la deja
dependiendo de un solo carácter. Como en el resto del producto, el color acompaña pero no lleva el
significado solo.

Ninguna pantalla SHALL sumar movimientos para saber un saldo: cada fila ya trae el suyo.

#### Scenario: Una fila que acredita y otra que descuenta

- **WHEN** el historial muestra una tarea aprobada y un canje aprobado
- **THEN** se distingue cuál sumó y cuál restó sin fijarse solo en el signo

#### Scenario: El saldo de cada momento

- **WHEN** se mira cualquier fila
- **THEN** dice con qué saldo quedó el niño después de ella

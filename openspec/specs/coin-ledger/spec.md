# coin-ledger Specification

## Purpose

Define cómo se guarda el saldo de monedas de un hijo y cómo se registra cada movimiento, de modo que
el saldo nunca pueda quedar en un valor imposible, nunca pueda divergir de su historial, y siempre se
pueda reconstruir cómo se llegó hasta él.
## Requirements
### Requirement: El saldo nunca es negativo

El saldo de monedas de un hijo SHALL ser siempre mayor o igual que cero. El almacén SHALL rechazar
cualquier operación que lo dejaría por debajo, con independencia de qué código la haya originado.

#### Scenario: Un descuento supera el saldo disponible

- **WHEN** se intenta descontar más monedas de las que el hijo tiene
- **THEN** el almacén rechaza la operación
- **AND** el saldo queda como estaba

#### Scenario: Un hijo recién creado

- **WHEN** se crea un perfil de hijo sin indicar saldo
- **THEN** su saldo es cero

### Requirement: Toda mutación de saldo deja su rastro

Cada cambio del saldo de un hijo SHALL escribir una entrada de historial en la **misma transacción**
que el cambio. NO SHALL ser posible que un saldo cambie sin su entrada correspondiente, ni que se
escriba una entrada sin que el saldo cambie.

#### Scenario: Se acredita una tarea aprobada

- **WHEN** se aprueba una tarea y se acreditan sus monedas
- **THEN** el saldo del hijo aumenta en esa cantidad
- **AND** queda una entrada de historial que registra el movimiento y su motivo

#### Scenario: Falla la escritura del historial

- **WHEN** el cambio de saldo se aplica pero la escritura de la entrada de historial falla
- **THEN** ninguna de las dos cosas queda almacenada
- **AND** el saldo es el que era antes de intentarlo

#### Scenario: Cada entrada dice de dónde viene

- **WHEN** se consulta una entrada de historial
- **THEN** indica el motivo del movimiento
- **AND** cuando el movimiento procede de una tarea o de un canje, permite llegar hasta él

### Requirement: El saldo se modifica de forma incremental

El saldo SHALL modificarse mediante operaciones relativas de suma o resta ejecutadas por el motor. NO
SHALL calcularse leyendo el valor actual, operando en memoria y escribiendo el resultado, porque dos
operaciones simultáneas escritas así pierden una de las dos.

#### Scenario: Dos acreditaciones simultáneas

- **WHEN** dos operaciones acreditan monedas al mismo hijo a la vez
- **THEN** el saldo final refleja ambas
- **AND** el historial contiene las dos entradas

#### Scenario: Una acreditación y un descuento simultáneos

- **WHEN** una operación acredita y otra descuenta sobre el mismo hijo a la vez
- **THEN** el saldo final refleja ambos movimientos
- **AND** en ningún momento intermedio queda por debajo de cero

### Requirement: El historial es inmutable

Una entrada de historial de monedas, una vez escrita, NO SHALL poder modificarse ni eliminarse. Esta
restricción SHALL estar garantizada por el almacén, no por la disciplina del código que lo usa.

#### Scenario: Se intenta modificar una entrada

- **WHEN** se intenta cambiar la cantidad o el motivo de una entrada ya escrita
- **THEN** el almacén rechaza la operación

#### Scenario: Se intenta borrar una entrada

- **WHEN** se intenta eliminar una entrada de historial
- **THEN** el almacén rechaza la operación

#### Scenario: Corregir un error se hace añadiendo

- **WHEN** hace falta corregir un movimiento equivocado
- **THEN** se registra un movimiento nuevo que lo compensa
- **AND** ambos quedan visibles en el historial

### Requirement: El historial permite auditar el saldo

Cada entrada de historial SHALL registrar el saldo resultante después de aplicar el movimiento, de
modo que se pueda comprobar la coherencia entre el saldo actual y su historia sin recalcular toda la
secuencia.

#### Scenario: El saldo actual coincide con su historia

- **WHEN** se suman todos los movimientos de un hijo desde el principio
- **THEN** el total coincide con su saldo actual
- **AND** coincide con el saldo resultante de la entrada más reciente

#### Scenario: Se detecta una divergencia

- **WHEN** el saldo de un hijo no coincide con el resultado de su último movimiento
- **THEN** la comprobación de coherencia lo señala indicando de qué hijo se trata

### Requirement: El historial sobrevive a la baja de un hijo

Los movimientos de monedas SHALL conservarse aunque el hijo al que pertenecen deje de estar activo.

#### Scenario: Se consulta el historial de un hijo dado de baja

- **WHEN** se consulta el historial de un hijo que ya no está activo
- **THEN** sus movimientos siguen disponibles íntegros

### Requirement: El origen de un movimiento no lo produce dos veces

Cuando un movimiento de monedas procede de un hecho concreto —aprobar una tarea, resolver un canje—,
ese hecho SHALL producir **un único movimiento**, aunque la orden llegue repetida o simultánea. La
garantía SHALL venir de condicionar el cambio de estado de ese hecho a su estado de origen y
comprobar que afectó exactamente una fila, dentro de la misma transacción que el movimiento.

Este requisito no se deriva de los anteriores y por eso se escribe aparte. Que cada movimiento sea
atómico y deje rastro NO impide que se apliquen dos movimientos idénticos: la operación de mover
monedas hace exactamente lo que se le pide, tantas veces como se le pida. Lo que impide el duplicado
es que el segundo intento no encuentre el estado de origen que esperaba.

Existe porque un niño con un teléfono lento va a tocar dos veces, y porque la diferencia entre
acreditar cincuenta monedas y acreditar cien es justo lo que el producto enseña a valorar.

#### Scenario: Dos aprobaciones simultáneas de la misma tarea

- **WHEN** llegan a la vez dos órdenes de aprobar la misma tarea
- **THEN** solo una acredita
- **AND** la otra se rechaza señalando el conflicto
- **AND** existe una única entrada de historial que señala esa tarea

#### Scenario: Repetir una orden ya aplicada

- **WHEN** se vuelve a dar una orden que ya tuvo efecto sobre el mismo hecho
- **THEN** se rechaza señalando el conflicto
- **AND** el saldo del hijo no cambia

#### Scenario: El saldo cuadra pese a las órdenes repetidas

- **WHEN** se lanzan órdenes repetidas y simultáneas sobre varios hechos del mismo hijo
- **THEN** su saldo coincide con la suma de las entradas de su historial
- **AND** cada hecho ha producido como mucho un movimiento

#### Scenario: Un rechazo no deja rastro en el historial

- **WHEN** una orden se rechaza por conflicto de estado
- **THEN** no queda ninguna entrada de historial de ese intento
- **AND** el saldo es el que era antes de intentarlo

### Requirement: El historial de un niño se puede leer

El sistema SHALL exponer el historial de movimientos de monedas de un niño, paginado y en orden del
más reciente al más antiguo.

La tabla existe desde `add-data-model`, es append-only y está protegida por un disparador. Lo que
faltaba era poder leerla: el producto enseña un ciclo —esforzarse, ganar, decidir en qué gastar— y
mirar atrás es la mitad de ese ciclo.

Cada movimiento SHALL decir **qué pasó, cuánto y con qué saldo quedó**. El saldo resultante se guarda
en cada fila a propósito, para que auditar sea una comparación y no una suma; devolverlo es lo que
hace que la pantalla no tenga que calcular nada.

#### Scenario: Un niño mira su historial

- **WHEN** un niño pide su historial
- **THEN** recibe sus movimientos, del más reciente al más antiguo
- **AND** cada uno dice qué lo produjo, cuánto movió y el saldo que dejó

#### Scenario: Un historial vacío

- **WHEN** un niño que nunca ha ganado ni gastado pide su historial
- **THEN** recibe una lista vacía, no un error

### Requirement: Cada quien lee solo el historial que le corresponde

Un `CHILD` SHALL leer únicamente su propio historial. Un `PARENT` SHALL leer el de cualquiera de sus
hijos, y NO SHALL leer el de un hijo ajeno.

Es la misma regla de acceso que gobierna el resto del producto, y aquí importa más que en otros
sitios: **los hermanos comparten la tablet**. Un historial es el registro más detallado que existe de
lo que otro niño ha hecho y ha gastado.

La ruta del niño NO SHALL admitir ningún parámetro que pueda apuntar a otro perfil, igual que sus
otros listados.

#### Scenario: Un niño intenta el historial de su hermano

- **WHEN** un niño pide un historial que no es el suyo
- **THEN** no lo obtiene

#### Scenario: Un padre y un hijo ajeno

- **WHEN** un padre pide el historial de un hijo que no es suyo
- **THEN** responde como si no existiera, sin confirmar que existe

#### Scenario: Un padre y su propio hijo

- **WHEN** un padre pide el historial de uno de sus hijos
- **THEN** lo obtiene

### Requirement: El historial se lee, no se escribe

Los endpoints del historial SHALL ser de lectura. NO SHALL ofrecerse ninguna operación que cree,
edite o borre un movimiento.

Editar o borrar ya es imposible —el disparador lo impide en el motor—, y **crear** un movimiento
suelto es otra cosa: mueve dinero, así que exige transacción, comprobación de fila afectada y pruebas
de doble tap. `MANUAL_ADJUSTMENT` existe en el enum esperando exactamente eso, y sigue sin exponerse.

#### Scenario: Se recorre la superficie del módulo

- **WHEN** se enumeran sus rutas
- **THEN** todas son de lectura

### Requirement: El historial pagina como el resto de los listados

El listado SHALL paginar con el patrón del proyecto: tamaño por defecto y máximo de las constantes
compartidas, metadatos en el cuerpo, un `pageSize` por encima del máximo es 422 y no un recorte
silencioso, y el orden SHALL llevar el identificador como desempate.

Sin desempate, dos movimientos creados en el mismo milisegundo pueden salir en dos páginas o en
ninguna. Y aquí ocurre de verdad: aprobar una tarea de un reparto escribe varias filas dentro de la
misma transacción.

#### Scenario: Dos movimientos del mismo instante

- **WHEN** dos movimientos comparten el mismo momento de creación
- **THEN** el orden entre ellos es estable
- **AND** ninguno se repite ni se pierde entre páginas

#### Scenario: Se pide una página más allá de la última

- **WHEN** se pide una página posterior a la última
- **THEN** la lista viene vacía, no un 404


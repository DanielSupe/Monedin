## ADDED Requirements

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

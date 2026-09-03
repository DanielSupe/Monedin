## Context

El historial de monedas lleva construido desde `add-data-model`: tabla append-only, disparador de
PostgreSQL que hace fallar cualquier `UPDATE` o `DELETE`, y una columna `balanceAfter` guardada de más
**a propósito**, «para que auditar el saldo sea una comparación y no una agregación».

Lo escriben aprobar una tarea y aprobar un canje. No lo lee nadie: no hay módulo, ni ruta, ni
pantalla.

Este es el **primer cambio de API de esta etapa de interfaz**, que hasta ahora no ha tocado el
servidor ni una vez. Por eso se hace solo de lectura.

## Goals / Non-Goals

**Goals**

- Que un niño pueda ver de dónde salieron sus monedas.
- Que un padre pueda explicar el saldo de un hijo.
- Aprovechar `balanceAfter`, que existe justo para esto.

**Non-Goals**

- **El ajuste manual.** Ver la decisión 5.
- **Filtros por fecha, exportar, o agrupar por mes.** Un listado paginado y en orden.
- **Tocar el esquema de base de datos.** La tabla ya está.

## Decisions

### 1. Módulo propio, no dentro de `children`

Las rutas cuelgan del hijo —`/children/me/coins` y `/children/:childId/coins`— pero el módulo es
`coins`, con sus cinco capas.

Meterlo en `children` significaría que su repositorio lea `coin_transactions`, y ese repositorio es
de perfiles. La anatomía del proyecto ata un módulo a lo que consulta, no a lo que dice su URL: es la
misma razón por la que reponer el PIN de un hijo vive en `auth` y no en `children` aunque la pantalla
lo enseñe junto al perfil.

### 2. Dos rutas, y la del niño sin ningún parámetro que apunte a otro

```
GET /children/me/coins          requireChild   el suyo, y no puede ser otro
GET /children/:childId/coins    requireParent  el servicio comprueba de quién es
```

La del niño **no admite ningún identificador**, ni en la ruta ni en la query, y su esquema es
`.strict()`. Ahí está la garantía de que no puede leer el de su hermano: no hay parámetro que
pudiera apuntar a otro perfil, así que no hay nada que comprobar. Es lo mismo que ya hacen
`listOwnTasksQuerySchema` y sus hermanos.

La del padre sí lleva identificador, así que el **servicio** comprueba la propiedad —no el
controlador— y un hijo ajeno responde **404 y no 403**, para no confirmar que existe.

Y esto importa más aquí que en otros listados: **los hermanos comparten la tablet**, y un historial
es el registro más detallado que existe de lo que otro niño ha hecho y ha gastado.

### 3. `balanceAfter` se devuelve, y la pantalla no suma nada

La columna se guarda redundante desde el principio con una razón escrita. Devolverla es lo que hace
que la pantalla no tenga que acumular: cada fila trae su propio saldo.

Sumar en el cliente sería además incorrecto en cuanto haya paginación —la página 2 no sabe con qué
saldo empezó—, así que no es una optimización sino la única forma correcta.

### 4. Acreditar y descontar se distinguen por MÁS que el signo

Que una fila sume o reste es lo más importante que dice, y `-60` frente a `60` lo deja colgando de un
carácter. Se distingue con texto y con tono, como el resto del producto: el color acompaña y nunca
lleva el significado solo.

Un descuento **no es un error ni algo malo**: es el niño gastándose sus monedas en algo que quería,
que es justo lo que el producto enseña. Así que no va en peligro.

### 5. El ajuste manual NO entra, y esto es lo que costaría

`MANUAL_ADJUSTMENT` está en el enum desde `add-data-model` y no lo escribe nadie. `config.yaml` lo
dice con todas las letras: «corregir una acreditación equivocada NO se hace editando el historial,
que es inmutable, sino registrando un movimiento que la compense. Ese mecanismo todavía no lo expone
ningún endpoint».

Sigue sin exponerse después de este change, y **es una decisión, no un olvido**: crear un movimiento
mueve dinero, y en este proyecto eso significa transacción interactiva en el repositorio,
`applyCoinMovement`, comprobación de fila afectada y tests de doble tap. Es un change entero, no un
endpoint más.

Queda anotado lo que además habría que decidir cuando se haga: si el importe tiene límites, si el
motivo es obligatorio, y qué impide que un ajuste deje el saldo negativo — que el motor ya rechaza
con un `CHECK`, así que la interfaz tendría que contarlo bien.

### 6. Se llega desde el SALDO, no desde un destino nuevo

El niño tiene cuatro destinos en su navegación y su saldo en 4rem en el inicio. Añadir un quinto
destino le carga la barra; poder tocar el número y ver de dónde viene es el gesto natural y no le
cuesta nada.

El padre llega desde el saldo de cada hijo, que ya sale en su panel y en su listado de perfiles.

## Risks / Trade-offs

- **Es el primer cambio de API de la etapa.** Solo lectura y sin migración, que es lo que lo hace
  aceptable ahora.
- **Un historial largo.** Pagina como todo, y el orden lleva desempate por identificador, que aquí no
  es teórico: aprobar un reparto escribe varias filas en la misma transacción y comparten instante.
- **Un movimiento apunta a una tarea o a un canje que puede haberse retirado.** Las claves ajenas son
  restrictivas, así que la fila referenciada sigue existiendo; lo que hay que decidir es cuánto de
  ella se enseña, y este change enseña lo mínimo.

## Migration Plan

Sin migración: la tabla, su disparador y sus restricciones ya existen.

## Open Questions

Ninguna que bloquee.

## Decisiones que este change NO toma

- **El ajuste manual.** Decisión 5, con lo que costaría ya escrito.
- **Si el historial debería agrupar por día.** Se mira con un historial de verdad delante.
- **Si el padre necesita un historial de toda la familia**, y no de hijo en hijo. No hay evidencia de
  que haga falta.

# Lo que las maquetas enseñan y hoy no existe

Todo lo que se ve sale de datos que la API ya devuelve: **ningún endpoint nuevo**.
Pero hay cuatro cifras que se COMPONEN en el cliente, y en las maquetas parecen
dato del producto. Si nadie las define, quien implemente se las inventa, y quedan
como si fueran parte del modelo.

Cada una va aquí con la regla exacta y con el caso que la rompe.

---

## 1. El anillo «2 de 5 hechas hoy» — el más peligroso

**«Hoy» no existe en el modelo.** Una tarea tiene `status` y una `dueDate`
opcional que, según el propio catálogo de textos, «solo se muestra: no caduca ni
avisa». No hay fecha de asignación por hijo, ni jornada, ni nada que corte el día.

Así que el anillo, tal y como está dibujado, **no se puede calcular**. Tres
salidas, y me quedo con la tercera:

| Salida | Qué cuenta | Por qué no / por qué sí |
| --- | --- | --- |
| Las de hoy por `dueDate` | tareas cuya fecha límite es hoy | la fecha es opcional: la mayoría no tiene, y el anillo saldría casi siempre `0 de 0` |
| Las creadas hoy | por `createdAt` | una tarea repartida ayer y sin hacer desaparecería de la cuenta, que es justo la que hay que hacer |
| **Todas las suyas, sin «hoy»** | `APPROVED + COMPLETED` sobre el total | es lo único cierto con lo que hay |

**Decidido: se quita la palabra «hoy».** El anillo dice «2 de 5 hechas», sobre
todas sus tareas vigentes. Es honesto y no inventa un concepto de jornada que el
producto no tiene.

```
hechas = tareas con status COMPLETED o APPROVED
total  = todas las tareas del niño
```

`COMPLETED` cuenta como hecha **desde el punto de vista del niño**: él ya hizo su
parte. Que falte aprobarla es trabajo de otro, y el anillo mide lo suyo.

Si algún día se quiere el «hoy» de verdad, eso **sí** es un cambio de modelo, y
hay que decirlo en su propio change.

---

## 2. «Tu próximo premio»

El premio **más barato de los que todavía no alcanza**. Sale entero de
`GET /rewards/mine`, que ya devuelve `coins` y `affordable` por premio.

```
candidatos = premios con affordable === false
próximo    = el de menor coins
faltan     = próximo.coins − saldo
```

Los casos que hay que dibujar y no están en las maquetas:

- **Le alcanzan todos.** No hay «próximo»: el panel se sustituye por uno que lo
  celebra, no por un hueco. `elige.png` o `celebra.png`.
- **No hay premios para él.** El panel no se monta. Es distinto del caso anterior
  y se lee distinto.
- **Empate a precio.** Desempata el identificador, como cualquier orden de este
  proyecto. Sin desempate, el panel cambia de premio entre dos recargas sin que
  haya pasado nada.

---

## 3. Los grupos «Por hacer · 2 / Esperando revisión · 1 / Hechas · 2»

Es un `group by status` sobre la lista que ya llega, en el cliente. Nada más.

```
Por hacer            → PENDING
Esperando revisión   → COMPLETED
Hechas               → APPROVED
```

**Un grupo vacío no se dibuja**, ni con un «0» ni con un texto: la pantalla de un
niño sin nada pendiente tiene que verse tranquila, no llena de ceros. Es la misma
regla que ya cumple el panel del padre —«un aviso con cero no se dibuja»—.

Y **el orden de los grupos es fijo**, no por cantidad: por hacer, esperando,
hechas. Es el orden del ciclo, y reordenarlo por volumen haría que la pantalla
cambiara de forma cada día.

---

## 4. Las cifras del lateral y de los contadores

**La insignia del lateral cuenta lo que le toca a QUIEN MIRA**, y por eso el mismo
canje aparece en una cuenta y no en otra:

| Dónde | Qué cuenta | Ojo |
| --- | --- | --- |
| Lateral del niño, «Tareas» | sus tareas en `PENDING` | solo las suyas |
| Lateral del padre, «Tareas» | tareas en `COMPLETED` de todos sus hijos | **se cuentan FILAS, no repartos** |
| Lateral del padre, «Canjes» | canjes en `PENDING` de todos sus hijos | aquí la unidad sí es la fila |
| Contadores de «Mis canjes» | los del niño, por estado | solo los suyos |

La trampa está en la segunda fila, y ya está escrita en `CLAUDE.md`: **`GET /tasks`
pagina por REPARTO**, así que su `total` cuenta repartos y no tareas. Un reparto
con dos hermanos esperando y uno sin hacer nada da `1` por `total`, `3` por filas
y **`2` de verdad**. Se cuentan las filas con el estado buscado, nunca el `total`.

En `GET /redemptions` el `total` sí es la cifra. **Que dos cuentas del mismo panel
se obtengan de dos maneras no es una incoherencia que unificar**: es que las dos
listas tienen unidades distintas porque sus pantallas las tienen.

---

## 5. Las tres últimas líneas de «Tus monedas»

Las tres primeras filas de `GET /me/coins`, que ya viene ordenado por fecha
descendente con desempate. **La pantalla no reordena**, y el enlace «Ver todo»
lleva al historial completo.

El color de cada fila sale del signo, y no es decorativo:

- **Ganó → ámbar**, porque es la moneda entrando.
- **Gastó → morado**, porque es un premio conseguido.

Antes de este rediseño las dos salían idénticas, y son lo contrario.

---

## Lo que NO se compone en el cliente

Por si alguien intenta ahorrarse una llamada: **el saldo nunca se calcula sumando
el historial.** `ChildProfile.coins` es la fuente de verdad y llega en el actor.
El historial es un registro de lo que pasó, no la cuenta.

El caso de prueba que lo distingue ya existe en la batería, con importes 10 y 20 y
saldos 500 y 777: acumular daría 30. Si alguien «optimiza» sumando, ese test cae.

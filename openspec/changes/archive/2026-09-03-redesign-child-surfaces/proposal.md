## Why

**Los tres destinos del niño se dibujan exactamente igual, y no son la misma cosa.**

```
/me/rewards      <ul className="flex flex-col gap-3">   una lista de tarjetas
/me/tasks        <ul className="flex flex-col gap-3">   una lista de tarjetas
/me/redemptions  <ul className="flex flex-col gap-3">   una lista de tarjetas
```

No es una coincidencia de implementación: es que las tres se vistieron por separado
—`redesign-child-shop`, `redesign-child-tasks`— y cada una resolvió bien su contenido dentro de la
única forma que había. Lo que ninguna pudo decidir sola es **en qué se diferencian entre sí**, y ese
es justo el trabajo que queda.

Y sí se diferencian, porque son los tres tiempos del ciclo que el producto existe para enseñar:

| Destino | Qué es de verdad | Qué pregunta responde |
| --- | --- | --- |
| Premios | un **escaparate** | «¿qué puedo conseguir?» |
| Tareas | lo que **tengo entre manos** | «¿qué hago ahora?» |
| Canjes | lo que **ya pasó** | «¿qué he pedido?» |

Un escaparate se recorre con los ojos y se compara de un vistazo; una lista de una columna obliga a
desplazar para ver dos precios juntos, que es exactamente lo que hay que comparar para elegir. Lo que
está entre manos es de uno en uno y con una acción encima. Y un historial no se explora: se repasa,
y para eso las mismas columnas alineadas ganan a repetir la etiqueta en cada fila.

El cimiento de la primera lo puso `polish-profile-and-reward-image`: un premio tiene foto desde que
se publica y uno sin foto dibuja un respaldo, así que una rejilla ya no sale con huecos.

## What Changes

- **El escaparate pasa a rejilla de productos**: dos columnas en el ancho del niño, con la foto
  arriba, el precio debajo y la acción al pie de cada uno. Se comparan dos precios sin desplazar.
- **Las tareas se quedan en tarjetas, y por fin se distinguen de las otras dos**: una sola columna
  ancha, cada una con su estado y su acción, que es lo que ya son — lo que cambia es que dejan de ser
  la forma por defecto para pasar a ser una elección.
- **Los canjes pasan a historial en filas alineadas**, del más reciente al más antiguo, con premio,
  cantidad, estado y cuándo en las mismas posiciones.
- **Una pieza nueva en el sistema para las filas del historial**, porque no existe ninguna y
  escribirla suelta en la pantalla sería la copia que el sistema evita.
- **Las tres dicen CUÁNTAS cosas hay** antes de que se recorran.

## Capabilities

### Modified Capabilities

- `rewards`: el escaparate del niño se recorre como una rejilla y no como una lista.
- `tasks`: las tareas del niño se distinguen en forma de los otros dos destinos.
- `redemptions`: los canjes del niño se leen como un historial en filas alineadas.
- `design-system`: el sistema gana la pieza de filas alineadas, con lo que eso obliga.

## No incluye

- **Las pantallas del padre.** Su catálogo y sus dos bandejas ya se vistieron una a una en
  `redesign-parent-authoring` y `redesign-parent-inbox`, así que el problema que este change resuelve
  —tres contenidos distintos con la misma forma— ahí no existe. Que el historial de canjes del padre
  quiera algún día esta misma pieza es probable, y no se decide aquí.
- **Cambiar qué datos trae cada pantalla.** Ninguna necesita un campo más: es presentación. La única
  que necesitaba algo del servidor era la tienda, y ya lo tiene.
- **Filtrar u ordenar el historial del niño.** Un historial en orden y paginado como el resto. Filtrar
  es una función de adulto y el niño tiene pocas filas.
- **Tocar la navegación.** Los cuatro destinos y el marco se quedan como están.
- **El historial de monedas** (`/me/coins`), que ya se vistió en `add-coin-history` y no entra en la
  comparación de estas tres.

## Impact

- `apps/web/src/ui/`: una pieza nueva y su entrada obligatoria en el catálogo vivo.
- `apps/web/src/features/rewards/MyRewards.tsx`, `features/tasks/MyTasks.tsx`,
  `features/redemptions/MyRedemptions.tsx`.
- `apps/web/src/lib/messages.ts`: los textos nuevos, ninguno suelto.
- **Cero cambios en la API, en los contratos y en la base de datos.**

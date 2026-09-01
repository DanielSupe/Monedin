## Why

**El inicio del padre es una copia exacta de su propia barra de navegación.** No es una impresión:
los cinco destinos que ofrece son los cinco que el marco ya tiene arriba, en todas las pantallas.

```
la barra del marco          el inicio del padre
──────────────────          ───────────────────
/tasks                      /tasks
/rewards                    /rewards
/redemptions                /redemptions
/children                   /children
/account                    /account
```

Una pantalla que repite el menú que la rodea no es una pantalla sin vestir: es una pantalla **sin
motivo**. Vestirla con tarjetas la haría más bonita y seguiría sin decir nada que no estuviera ya a
dos centímetros por encima.

**Un padre abre Monedín para aprobar.** Ese es el gesto que sostiene el producto entero: el niño
marca, el padre revisa, y solo entonces se acreditan monedas. Hay exactamente dos bandejas que
esperan por él —tareas en `COMPLETED`, que el propio filtro llama «Por aprobar», y canjes en
`PENDING`—, y hoy tiene que ir a buscarlas a dos pantallas distintas para descubrir si hay algo. Los
datos ya existen y no hace falta tocar la API.

Hay además tres cosas sueltas que caen aquí porque no caen en ningún otro sitio:

- **`/account` es la última ruta con deuda.** Es la única de las veintidós que sigue con estilo en
  línea, y sus dos pantallas —la foto y el PIN del padre— siguen en la lista de deuda. Le pasa lo
  mismo que le pasaba a «Mi perfil» del niño: cuelga del avatar del marco y no es tareas, ni premios,
  ni hijos, así que ningún change de área la reclama nunca.
- **`routes/index.tsx` lleva un texto visible incrustado**: `Hola, {actor.name}` escrito a mano en el
  módulo. Es una violación directa de la regla 1 y sobrevivió porque nadie miró esa rama del
  condicional al vestir la otra.
- **Cerrar sesión vive en el inicio**, junto a los atajos, cuando es la acción más rara y menos
  reversible que tiene un padre.

## What Changes

- **El inicio del padre pasa a ser un panel de lo que le espera**: cuántas tareas hay por aprobar,
  cuántos canjes esperan respuesta, y el saldo de cada hijo. Cada bandeja lleva **a su listado ya
  filtrado**, que es lo que permite que los filtros vivan en la dirección.
- **Las dos cuentas NO se obtienen igual, y esa asimetría es de la API**: los canjes paginan por fila
  y su `total` es la cifra buscada; las tareas paginan por REPARTO y además devuelven el reparto
  entero, así que su `total` cuenta otra cosa y sus filas vienen sin filtrar. Contar mal ahí es
  silencioso: daría «1 tarea» cuando hay tres hijos esperando.
- **`/account` se viste** y deja de ser dos pantallas apiladas con tres enlaces de «volver».
  **Cerrar sesión se muda aquí** desde el inicio.
- **Se retiran tres entradas de la lista de deuda**: `ParentAvatarScreen`, `ChangePinScreen` y
  `routes` entera. De 13 a 10.
- **El saludo del padre sale al catálogo de mensajes.**

## Capabilities

### New Capabilities

- `parent-console`: qué le enseña Monedín a un padre cuando entra a su perfil, y de dónde salen las
  cifras que le enseña. Nace aquí y lo heredarán `redesign-parent-tasks` y
  `redesign-parent-children`.

### Modified Capabilities

- `parent-authentication`: la cuenta del padre —su foto y su PIN— es un destino vestido, y es donde
  vive cerrar sesión.

## Impact

- **Front, y solo front.** Cero cambios en la API, cero en los contratos, cero en la base de datos.
- Nace `apps/web/src/features/parents/`: el panel y sus piezas.
- `ParentHome.tsx` se reescribe entero; `routes/index.tsx` pierde su literal.
- `routes/account.tsx`, `ParentAvatarScreen.tsx` y `ChangePinScreen.tsx` se visten.
- Dos listas de deuda pierden tres entradas — `apps/web/eslint.config.js` y
  `tests/ui/style-rules.test.ts`.
- `apps/web/src/lib/messages.ts` gana el bloque del panel.

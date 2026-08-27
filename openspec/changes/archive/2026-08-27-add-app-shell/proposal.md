## Why

El front tiene TanStack Router cableado desde `setup-foundations` y cinco rutas que funcionan. Lo que
nunca se construyó es la navegación de **una de las dos audiencias**: las cuatro rutas que existen son
todas del padre, y **el niño no tiene ninguna**.

Sus cuatro pantallas —tareas, escaparate, canjes y ajustes— se abren y se cierran con booleanos dentro
de `/`, así que un niño nunca sale de la ruta raíz. En la tablet familiar eso significa que pulsar
**atrás** esperando volver al escaparate **saca de Monedín**, y que recargar devuelve al inicio.

No fue un descuido. Cada change anterior añadió su pantalla al andamio de la forma más barata, y era
lo correcto cuando el objetivo era el dominio. Ahora que empieza la etapa de interfaz, esa deuda
bloquea lo que viene: **no hay dónde colgar un marco persistente**. Una cabecera o una barra inferior
necesitan una capa que sobreviva a la navegación, y hoy toda la aplicación del niño es un único
componente que se repinta entero.

Y hay una pieza esperando: `add-design-system` dejó la doble escala lista —`data-scale="child"` y
`data-scale="parent"` reasignan tipografía, radios y objetivo de toque— pero **sin nada que la
enchufe**, porque el contenedor por rol no existía. Este change es ese contenedor.

Es la **única excepción no visual** de los doce de la etapa, y por eso va segundo: los diez que
siguen visten pantallas, y necesitan que el marco ya esté.

## What Changes

- **El niño estrena navegación**: `/me/tasks`, `/me/rewards`, `/me/redemptions` y `/me/settings`. Cada
  destino con su URL, su botón atrás y su recarga.
- **Tres clases de estado dejan de hacer de router**: los seis booleanos de `routes/index.tsx`, las
  cuatro vistas de `ProfileGrid` y las tres uniones `Vista`/`View` de `RewardCatalog`, `ChildrenList`
  y `TaskBatchList`. Con ellas se va el prop `onDone` de **quince componentes**, que es el cableado a
  mano que sustituía al router.
- **Las pantallas previas a ser alguien también son rutas**: el acceso, la rejilla, el teclado de PIN,
  el alta de hijo y el restablecimiento del PIN de adulto.
- **Dos marcos por rol**, en una carpeta `app/` nueva: cabecera con navegación y avatar para el padre,
  barra inferior de cuatro destinos para el niño. Cada uno declara su `data-scale`, que es lo que hace
  que la misma pieza rinda distinto para cada audiencia sin duplicarse.
- **Las guardas redirigen en vez de repintar.** `AuthGate` decide qué componente pintar; una guarda de
  ruta cambia la URL. La diferencia importa: hoy un niño en `/rewards` ve un mensaje en una dirección
  que no le corresponde, y a partir de ahora aterriza donde sí.
- **Los filtros y la paginación viajan en la URL**, con parámetros tipados. Es lo que hace que el
  botón atrás del padre sirva de algo: hoy abrir el formulario de reparto ya pierde el filtro, porque
  la lista se desmonta.
- **Ruta 404** con salida, para una dirección que no existe.
- **Ni una pantalla cambia de aspecto.** Lo que cambia es cómo se llega a ellas y qué las rodea.

## Capabilities

### New Capabilities

- `app-navigation`: qué destinos existen, quién puede llegar a cada uno y qué pasa cuando alguien
  abre una dirección que no le corresponde; qué marco rodea cada rol; y qué garantiza que el botón
  atrás, la recarga y un enlace compartido se comporten como en cualquier aplicación.

### Modified Capabilities

Ninguna. Las dieciséis specs vigentes describen comportamiento de la API y del sistema de diseño, y
este change no toca una ruta del servidor, un servicio, una tabla ni una pieza de `ui/`. Lo que hace
es estrenar la capa que faltaba entre el sistema de diseño y las pantallas.

## Impact

**Código nuevo**: rutas en `apps/web/src/routes/` y los dos marcos en `apps/web/src/app/`, con sus
tests.

**Código modificado**: `apps/web/src/main.tsx` (el contexto del router, para que una guarda pueda
resolver la sesión antes de pintar), `apps/web/src/routes/__root.tsx`, los quince componentes de
`features/` a los que se les quita `onDone` —su lógica de negocio y su marcado **no se tocan**— y el
catálogo de textos para los destinos y el 404.

**Código retirado**: `AuthGate`, `ParentOnly` y `ChildOnly` desaparecen cuando ninguna ruta los use.
Su lógica de tres estados es correcta y **no se reescribe**: `screenFor()` se conserva tal cual y pasa
a decidir una redirección en vez de un componente.

**API, base de datos y contratos**: sin tocar. Las cinco rutas de solo cuenta siguen siendo cinco, y
el test que las enumera lo seguirá comprobando.

**Arquitectura**: estrena `app/` como capa entre `ui/` —que no sabe de dominio— y `features/` —que sí—.
Un marco conoce el rol del actor y los destinos; una pieza de `ui/` no puede saber ninguna de las dos
cosas.

## No incluye

- **El aspecto del contenido de ninguna pantalla.** Las tareas del niño, el escaparate, los
  formularios y las bandejas del padre siguen exactamente como se ven hoy, con sus estilos en línea.
  Vestirlos es lo que hacen los nueve changes siguientes, y este change **no borra ninguna entrada**
  de las dos listas de deuda declarada.
- **El saldo fijo en la cabecera del niño.** Tenerlo siempre a la vista refuerza el ciclo que el
  producto enseña, pero es una decisión de diseño de `redesign-child-home` y no se toma desde aquí.
  Por ahora el saldo vive en su pantalla de inicio, como hoy.
- **Transiciones entre rutas.** Las duraciones son tokens y ya respetan `prefers-reduced-motion`, pero
  animar la navegación es pulido y llega al final de la etapa.
- **Precarga de datos en las rutas.** El router lo permite y mejoraría la percepción, pero cambia cómo
  cada pantalla obtiene sus datos y merece su propio change.
- **Pantallas de detalle** de una tarea o de un premio. No existen hoy y no se inventan: los únicos
  enlaces profundos que entran son los formularios que ya existían como vista interna.
- **Sacar el resto del estado local a la URL.** `confirming`, `editingTitle` y `editingOffers` son
  estado de interfaz de un momento, no destinos, y se quedan donde están.

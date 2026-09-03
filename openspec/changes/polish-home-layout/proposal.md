## Why

Las teselas del inicio se ven enormes, y **no es su tamaño: es que nada las para**.

El `<main>` de los dos marcos no tiene tope de ancho. Mientras la navegación estuvo detrás de un
botón no se notaba tanto; desde `pin-sidebar-on-desktop` el lateral está fijo y el contenido se
reparte por todo lo que sobra —1355px en un monitor normal—. Cuatro teselas en dos columnas acaban
midiendo unos 560px cada una, con un emoji de 28px flotando en medio.

```
lo que se ve                          la causa
────────────                          ────────
teselas gigantes y vacías             <main> sin `max-width`
la tarjeta del saldo, una banda       lo mismo
«Cambiar de perfil» de lado a lado    lo mismo
```

Es un solo defecto con tres síntomas, y afecta a **todas** las pantallas, no solo al inicio: los
listados del padre también se estiran. Ponerle un tope al contenido es lo que arregla los tres a la
vez; retocar el tamaño de las teselas sin eso sería tapar el síntoma.

## What Changes

- **El contenido de los dos marcos recibe un ancho máximo** y se centra. Sale de un token que ya
  existe, no de una medida nueva.
- **El inicio del niño se ciñe al ancho de lectura**: es una pantalla focal —un saldo y cuatro
  destinos—, no un listado, y a 40rem sus teselas recuperan una proporción en la que el glifo se ve.
- **«Cambiar de perfil» deja de ocupar todo el ancho.**

## Capabilities

### Modified Capabilities

- `design-system`: que el contenido de una pantalla tenga un ancho máximo, en vez de repartirse por
  todo el monitor.

## Impact

- **Front, y solo front.** Cero cambios en la API, en los contratos o en la base de datos.
- `ChildShell.tsx` y `ParentShell.tsx`: el `<main>` gana su tope.
- `ChildHome.tsx`: ancho de lectura y las teselas ajustadas.
- Afecta al aspecto de **todas** las pantallas de dentro de un perfil, que es el objetivo.

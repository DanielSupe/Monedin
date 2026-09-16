# Elegir el tema, y que cada uno tenga el suyo

## Why

`repaint-design-system` construyó el modo oscuro entero y lo dejó **siguiendo al
sistema, sin interruptor**. La razón estaba escrita y sigue siendo buena: la
tablet es compartida, y una preferencia en `localStorage` haría que el niño
heredase el tema de su padre.

Lo que aquel change decidió no fue «no se elige nunca», sino «no se elige
todavía, y cuando se elija va DENTRO del actor como `tutorialSeen`». Esto es
ese día.

Hoy no hay forma de ver el tema oscuro salvo cambiando la preferencia del
sistema operativo entero, y eso lo paga cualquiera que quiera mirar el producto
en los dos temas: hay que salir de la aplicación para cambiar de tema.

## What Changes

- **El perfil recuerda su tema**, en su propia fila: el padre en `User`, cada
  hijo en `ChildProfile`. Tres estados —seguir al sistema, claro, oscuro— con
  «seguir al sistema» como valor por defecto, que es lo que hay hoy.
- **Viaja dentro del actor**, junto a `tutorialSeen`, por el mismo argumento: el
  front lo necesita para decidir qué pintar nada más cargar, y un segundo camino
  traería su propia caché que puede separarse de la del actor.
- **Un endpoint**, `PATCH /auth/theme`, calcado de `/auth/tutorial`: uno solo
  para los dos roles, con la rama por rol en el servicio.
- **Un control en la cabecera**, a la derecha, en los dos marcos. Recorre los
  tres estados y guarda al momento.
- **Las pantallas de entrada no lo llevan**: ahí todavía no hay actor, así que
  no hay preferencia que leer y se sigue al sistema.

## Impact

- `packages/contracts`: un valor nuevo en los dos actores y un esquema de
  entrada. Es un campo obligatorio más en el actor, así que **rompe todos los
  actores de prueba** — que es justo lo que hay que mirar, como cuando entró
  `tutorialSeen`.
- `apps/api`: una migración con dos columnas, una ruta, y la rama por rol.
- `apps/web`: el marco estampa el atributo y la cabecera gana un control.

## No incluye

- **Un tema por dispositivo.** La preferencia es del PERFIL, no del navegador:
  el mismo niño en la tablet y en el móvil de su madre ve su tema en los dos, y
  su hermano no hereda el suyo. Es la mitad del argumento por la que esto no se
  hizo con `localStorage`.
- **Más temas que los dos.** El sistema tiene dos juegos de valores y ninguna
  pieza conoce el tema; un tercero sería otro change y otra conversación.
- **Recordar el tema antes de entrar a un perfil.** Acceso, rejilla y teclado de
  PIN siguen al sistema, porque ahí todavía no se sabe quién está delante.

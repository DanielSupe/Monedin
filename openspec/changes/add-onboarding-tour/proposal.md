## Why

**Quien entra por primera vez a su perfil aterriza en una pantalla que no le explica nada.**

```
   el padre                          el niño
   ────────                          ───────
   panel sin hijos                   un saldo en cero
   sin tareas ni premios             cuatro teselas sin nombre que las explique
   ↓                                 ↓
   ¿por dónde empiezo?               ¿qué son estas monedas y cómo consigo más?
```

Y el segundo tiene entre seis y once años. El producto entero existe para enseñarle un ciclo —se
esfuerza, gana, decide en qué gastarlo— y la primera pantalla que ve no le cuenta ninguna de las tres
cosas.

Las veinte ilustraciones de la mascota llevan en el repositorio desde hace un rato y **no las usa
nada** salvo una en la puerta pública. Se prepararon para esto.

**Son DOS tutoriales y no uno con ramas.** Lo que hay que explicarle a un adulto que gestiona —dónde
aprueba, dónde crea, dónde ve a sus hijos— no se parece a lo que hay que explicarle a un niño —qué
son esas monedas y cómo consigue más—. Comparten el mecanismo y no el contenido, que es exactamente
la relación que el producto ya tiene entre sus dos escalas.

## What Changes

- **Un recorrido guiado la primera vez que alguien entra a su perfil**, con la mascota explicando y
  el resto de la pantalla atenuado: solo se ve nítido lo que se está explicando.
- **Uno por rol**, con su propio guion y sus propias ilustraciones.
- **«Ya lo vio» se recuerda en el servidor**, dentro del actor, así que sobrevive a cambiar de
  dispositivo y a limpiar el navegador.
- **Se puede saltar** desde el primer paso, y **volver a verlo** desde los ajustes del perfil.
- **Una pieza nueva en el sistema** para el foco, porque el diálogo que hay tapa la pantalla entera y
  aquí hace falta lo contrario.

## Capabilities

### New Capabilities

- `onboarding-tour`: qué se le explica a cada rol la primera vez, cómo se sale y cómo se vuelve.

### Modified Capabilities

- `session-management`: el estado de la sesión dice además si a ese perfil ya se le explicó.
- `design-system`: el sistema ofrece una pieza para destacar una parte de la pantalla.

## No incluye

- **Tutoriales en otras pantallas.** Este cubre el inicio de cada rol. Si mañana hace falta uno en
  premios, el mecanismo ya estará y el contenido será otro change.
- **Que el recorrido enseñe datos de ejemplo.** Ilumina lo que hay en la pantalla de verdad, esté
  vacía o llena — un panel vacío es justo lo que ve quien más lo necesita.
- **Reiniciarlo para otro perfil.** Cada quien reinicia el suyo; un padre que quiera que su hijo lo
  vuelva a ver lo hace desde el perfil del hijo.
- **Que el recorrido deje tocar lo que ilumina.** Lo que se pulsa es «seguir»; el foco señala, no
  invita a interactuar.

## Impact

- **Migración**: dos columnas anulables, una en `User` y otra en `ChildProfile`. Sin restricciones
  nuevas y sin tocar las que la migración inicial instaló.
- `packages/contracts`: los dos actores dicen si el recorrido está visto.
- `apps/api/src/modules/auth/`: **una sola ruta** para los dos roles, y la rama por rol en el
  servicio — el precedente es el detalle de un premio.
- `apps/web`: una pieza de sistema, el módulo del recorrido, las anclas en las dos pantallas de
  inicio y la vuelta desde los dos ajustes.
- **Cuarta excepción de estilo en línea** del proyecto, declarada y acotada a un archivo: la posición
  del foco se mide en ejecución y ningún token la expresa.

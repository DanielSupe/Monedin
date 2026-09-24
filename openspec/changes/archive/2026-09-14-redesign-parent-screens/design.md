## Context

Ver `proposal.md` para el porqué, `specs/` para los requisitos y `design/ui/pantallas/Padre*.dc.html`
para las doce pantallas dibujadas. Las restricciones:

1. **La escala del padre es 40 px de objetivo de toque, no 44.** Está declarada a propósito: un padre
   usa el pulgar sobre una lista densa. Las maquetas la respetan y no hay que «arreglarla».
2. **`GET /tasks` pagina por REPARTO.** Su `total` cuenta repartos, así que la insignia del lateral se
   calcula contando filas con el estado buscado. Ya se pagó una vez.
3. **Un reparto filtrado se enseña entero**, con las tareas de los hermanos que no casan con el
   filtro. Eso ya está decidido y ya se explica en pantalla desde `redesign-parent-inbox`.
4. **Los filtros son enlaces, no pestañas.** El filtro vive en la dirección.
5. **Una acción irreversible se confirma con un diálogo**, y la ceremonia se mide contra lo que cuesta
   deshacerla.

## Goals / Non-Goals

**Goals**

- Que un padre pueda decidir sobre un canje sin dudar de lo que cuesta la decisión.
- Que aprobar se vea como lo que es: lo único que mueve monedas.
- Que quien busca desbloquear no acabe dando de baja.

**Non-Goals** (además de lo que excluye el proposal)

- Cambiar cómo se paginan las bandejas o cómo se filtran.
- Convertir el editor de ofertas en una pantalla.

## Decisions

### 1. Las tres reglas del canje se dicen en la bandeja, no en la ayuda

Las tres —se descuenta al aprobar, el precio está congelado, rechazar no cuesta— son ciertas desde
`add-redemptions` y ninguna llega a la interfaz.

Van **donde se decide**. Una regla que hay que ir a buscar no está disponible en el momento en que
hace falta, y este es un producto que se usa con prisa entre dos cosas.

**Alternativa descartada: ponerlas en las preguntas frecuentes.** Ya están, de hecho, y no han
resuelto nada: nadie abre la ayuda antes de pulsar un botón que cree entender.

### 2. Aprobar es la acción principal; rechazar no es un peligro

Aprobar mueve monedas y rechazar devuelve la tarea a pendiente. Darles la misma forma dice que son
simétricas, y no lo son.

Pero **rechazar no se pinta como destructivo**. No destruye nada, y pintarlo en el tono del peligro
enseñaría a un padre a evitarlo — cuando rechazar una tarea mal hecha es justo lo que hace que
aprobarla signifique algo.

### 3. El diálogo de la baja ofrece la salida al que se confundió

Dar de baja y desbloquear se parecen desde fuera: un perfil al que no se puede entrar. Solo uno es
reversible, y el que no lo es se lleva por delante el saldo y el historial del niño.

Un padre cuyo hijo lleva tres intentos fallidos no busca «dar de baja»: busca «que pueda entrar». Que
el diálogo irreversible nombre la alternativa reversible es más barato que cualquier confirmación
extra, y es lo único que ataja el error de verdad.

### 4. La ceremonia se mide contra lo que cuesta deshacer

Retirar un premio se revierte publicándolo otra vez: diálogo corto, que además lo dice. Dar de baja no
se deshace: diálogo que lo escribe con todas las letras y que ofrece la alternativa.

Hasta `redesign-parent-children` esto estuvo al revés, y conviene no volver ahí: retirar abría un
diálogo y la baja preguntaba con dos botones sueltos dentro de la fila, a un toque de la fila del hijo
de al lado.

## Risks / Trade-offs

- **Explicar tres reglas ocupa sitio en una bandeja que ya es densa.** Se acepta: es la pantalla donde
  se decide con dinero de por medio, y la densidad se paga con una decisión mejor.
- **Traer los cuatro controles de shadcn cambia el comportamiento de formularios que hoy funcionan.**
  Se mitiga sustituyéndolos de uno en uno y comprobando el envío con teclado en cada uno.
- **Doce pantallas es el change más largo de los cinco.** Se acepta porque comparten marco y piezas: lo
  que se repite es aplicar, no decidir.

## Open Questions

- Ninguna.

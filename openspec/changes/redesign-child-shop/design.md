## Context

Ver `proposal.md` — Why.

Lo que condiciona el cómo:

- **`ProgressBar` existe y está sin estrenar.** Su cabecera nombra esta pantalla, y es la primera
  excepción de estilos en línea del proyecto, justificada por este caso exacto.
- **`affordable` viene del servidor**, calculado contra el precio de ese niño. La diferencia se
  calcula en el cliente contra el saldo de la sesión, y el contrato **no lleva el saldo en cada fila**
  a propósito: ver la decisión 5 del design de `add-rewards`.
- **«Ya lo pediste» se cruza en el cliente** entre el escaparate y los canjes pendientes, sin tocar el
  contrato de `rewards`. Decisión 8 del design de `add-redemptions`.
- **Las piezas ya existen**: `Card`, `Badge`, `Button`, `Alert`, `Coins`, `EmptyState`, `ProgressBar`.
- **El patrón de estados ya se resolvió** en `redesign-child-tasks`: un `Badge` con el tono que el
  sistema ya tiene, y lo que se puede hacer va con lo que se ve.

## Goals / Non-Goals

**Goals:**

- Que un niño perciba cuánto le falta sin leer la cifra.
- Que los tres estados de un canje se distingan.
- Cerrar el área del niño.

**Non-Goals:**

- Tocar el contrato, el cruce de «ya lo pediste» ni la asimetría del rechazo.
- Las pantallas del padre, aunque vivan en las mismas carpetas.

## Decisions

### 1. `ProgressBar` se estrena donde su comentario dice

```
   hoy                             después
   ───                             ───────
   Ir al cine                      Ir al cine
   200 monedas                     🪙 200
   Te faltan 130 monedas           ████░░░░░░░░  70 / 200
                                   Te faltan 130
   una cifra en una frase          una distancia que se ve
```

`value` es el saldo y `max` el precio. La pieza recorta a los extremos por su cuenta, así que un
premio más barato que el saldo no la desborda.

**La cifra se queda.** La barra dice «estás por aquí» y el número dice cuánto exactamente; quitarlo
sería cambiar precisión por gráfico.

**Por qué esto importa más de lo que parece**: es la mitad del ciclo. Las tareas enseñan que el
esfuerzo da monedas; esta pantalla enseña que las monedas se guardan para algo. Sin ver la distancia,
un saldo es un número y no una decisión.

### 2. El premio ya pedido es un estado, no un párrafo

Un premio puede estar en cuatro situaciones, y las cuatro se leen distinto:

| Situación | Qué se ofrece |
| --- | --- |
| No alcanza | La barra y cuánto falta |
| Alcanza | Pedirlo |
| Ya pedido | Nada: esperar |
| — | — |

«Ya lo pediste» pasa a ser un `Badge`, igual que el estado de una tarea. Lo que se ve y lo que se
puede hacer van juntos, que es la regla que `redesign-child-tasks` dejó puesta.

### 3. Los canjes, con el mismo patrón que las tareas

Tres estados, tres tonos que el sistema ya tiene: pendiente es neutro, aprobado es éxito y rechazado
es **advertencia y no peligro**.

**Por qué advertencia**: es la misma razón por la que `Alert` pinta un conflicto en `warning` y no en
rojo — *«nadie hizo nada mal»*. Que un padre rechace un canje no es un error del niño, y pintarlo de
rojo se lo dice.

**Y no devuelve monedas**, porque el descuento solo ocurre al aprobar. La pantalla lo enseña; no lo
cambia.

### 4. La foto del premio, con medida del sistema

Hoy lleva `maxWidth: "10rem"` y un radio a mano. Pasa a una medida del sistema dentro de la tarjeta.

### 5. Un test que no cazaba lo que perseguía

**Escrito al implementar, y es la corrección que más vale la pena.**

El test de los tres estados comprobaba que las tres etiquetas estuvieran en pantalla. Al inyectar la
violación —el mismo tono para los tres— **siguió en verde**: las etiquetas seguían ahí, solo que ya
no se distinguían. Y eso mismo pasaba ya antes de vestir la pantalla.

Un test que no falla ante la violación que persigue no está probando nada. Se cambió por uno que
compara los tres tonos y exige que sean distintos, y esta vez la inyección sí cae.

La tarea de comprobar que los tests fallan de verdad existe justo para esto: sin ella, este habría
entrado al repositorio dando una garantía que no daba.

## Risks / Trade-offs

- **Una barra por premio puede recargar una lista larga** → Solo aparece cuando NO alcanza; los que
  alcanzan enseñan su botón. Se mira con varios premios.
- **`ProgressBar` no se ha usado nunca en producción** → Se estrena aquí, así que hay que mirarla con
  saldo cero, con saldo justo y con saldo de sobra.
- **Dos pantallas en un change** → Son las dos mitades de la tienda y comparten el cruce de «ya lo
  pediste»; separarlas obligaría a montar ese cruce dos veces.

## Migration Plan

1. El escaparate, con la barra.
2. Los canjes.
3. Estrechar la deuda y comprobar que los tests de estilo cazan las pantallas nuevas.

**Vuelta atrás**: son dos pantallas independientes del resto.

## Open Questions

Ninguna.

## Decisiones que este change NO toma

- **Si el escaparate debería ordenar por cercanía** —lo que casi alcanza, primero—. Es tentador y es
  producto, no aspecto.
- **El historial de monedas**: `add-coin-history`.
- **Las pantallas del padre.**

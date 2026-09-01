## Why

El escaparate del niño es **la otra mitad del ciclo que el producto enseña**: las tareas dan monedas
y aquí se ve para qué sirven. Y la pieza que existe para contarlo lleva desde el primer día sin
estrenar.

`ProgressBar` se escribió en `add-design-system` con esta cabecera:

> *«La estrenará el "te faltan 30 monedas" del escaparate del niño, que es la mitad del ciclo que el
> producto existe para enseñar: ver cuánto le falta para su meta es lo que convierte un saldo en una
> decisión de ahorro.»*

Es además **la primera excepción de estilos en línea del proyecto**, justificada exactamente por eso:
«el ancho de la barra depende del saldo de un niño y de lo que cuesta un premio». Hoy solo la usa el
catálogo. La pantalla para la que se hizo escribe esto:

```tsx
<p>{messages.rewards.missingPrefix} {faltan} {messages.rewards.coins.toLowerCase()}</p>
```

Un número dentro de una frase. Un niño de siete años no lee «te faltan 30 monedas» y entiende que
está a un tercio; una barra sí lo dice.

Y los canjes tienen el mismo problema que tenían las tareas antes de vestirlas: sus tres estados
—pendiente, aprobado, rechazado— se pintan como texto plano, cuando **rechazar es terminal y no
devuelve nada** porque el descuento solo ocurre al aprobar. Esa asimetría es de las que un niño tiene
que poder ver.

## What Changes

- **`ProgressBar` se estrena** donde su propio comentario dice: el «te faltan N monedas» del
  escaparate. Deja de ser una pieza que solo existe en el catálogo.
- **El escaparate, vestido**: cada premio con su foto, su precio y si alcanza o no.
- **Los canjes, vestidos**, con sus tres estados distinguibles de un vistazo.
- **«Ya lo pediste» deja de ser un párrafo** y pasa a ser el estado del premio.

## Capabilities

### Modified Capabilities

- `rewards`: cuánto le falta a un niño para un premio se presenta como progreso, no como una cifra
  dentro de una frase.
- `redemptions`: el estado de un canje se distingue por su forma.

### New Capabilities

Ninguna.

## Impact

**Código modificado**: `features/rewards/MyRewards.tsx`,
`features/redemptions/MyRedemptions.tsx`, `lib/messages.ts` si falta algún texto, y las dos listas de
deuda declarada.

**API, contratos y base de datos**: sin tocar. `affordable` y el saldo de la sesión ya dan todo lo que
hace falta.

**Dependencias**: ninguna.

**Con este change se cierra el área del niño.** Sus cuatro pantallas quedan vestidas.

## No incluye

- **Las pantallas del padre**: `redesign-parent-home`, `redesign-parent-tasks` y
  `redesign-parent-children`. El catálogo de premios del padre —`RewardCatalog`, 369 líneas— y el
  formulario de premios son suyos, aunque estén en la misma carpeta.
- **El historial de monedas**: `add-coin-history`.
- **Cambiar cómo se sabe «ya lo pediste».** Se sigue cruzando en el cliente el escaparate con los
  canjes pendientes, que es la decisión 8 del design de `add-redemptions`.
- **Que un canje rechazado devuelva monedas.** No devuelve nada porque el descuento solo ocurre al
  aprobar; esto lo enseña, no lo cambia.

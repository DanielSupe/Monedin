## Why

`design/ui/` tiene las 32 pantallas del producto redibujadas, en claro y en oscuro, con una paleta
distinta. Antes de tocar una sola pantalla hay que reasignar el sistema, y este change hace **solo
eso**: los tokens, la escala y el tema. Ninguna pantalla cambia de estructura.

El orden no es una preferencia. Las maquetas son HTML plano con **2 489 estilos en línea y cero
componentes**, y traducirlas pantalla por pantalla es exactamente lo que reproduce esos 2 489
estilos —que además el lint prohíbe— y lo que hace que cada pantalla resuelva la misma pieza de una
manera distinta. Con los tokens reasignados primero, casi toda la aplicación se repinta sola: eso es
para lo que la capa semántica existe, y hasta hoy nunca se ha ejercido.

Tres cosas que el rediseño obliga a resolver aquí, y no más tarde:

- **La paleta baja de cinco tonos a dos.** Índigo, verde y azul salen; entran naranja —hacer— y
  morado —conseguido y ahorrado—. El ámbar de la moneda no se toca. «Esperando» pierde su color a
  propósito: no es un estado con voz, es la AUSENCIA de acción.
- **Dos de los cuatro tonos de aviso se quedan sin su color.** `success` deja de ser verde y
  `warning` deja de ser ámbar, así que sus nombres pasan a mentir el día que se apliquen. Se
  renombran por su PAPEL. `info` y `danger` conservan el suyo, que nunca describió un color.
- **El tema oscuro existe desde el primer día**, y no como una capa añadida después. `tokens.css`
  lleva previsto desde `add-design-system` que el modo oscuro «será reasignar la capa 2 y nada más»;
  esto lo cobra.

## What Changes

- **La capa 1 se sustituye entera.** Neutros cálidos, naranja, morado; el ámbar y el rojo se quedan.
- **La capa 2 se reasigna**, y dos tonos se renombran por su papel: `success → done` y
  `warning → conflict`. `info` y `danger` no cambian de nombre.
- **El rojo sobrevive como la única excepción declarada a los dos tonos.** No es una decisión de
  marca: es una señal universal. Colapsarlo con el naranja de la acción haría que el mismo color
  dijera «pulsa aquí» y «esto falló».
- **La escala de radios y de tipografía se cierra**: cinco radios y siete tamaños, nombrados por su
  papel. Las maquetas usan 20 radios y 24 tamaños; sin consolidar, cada pantalla elegiría su píxel.
- **La puerta pública pasa a ser una TERCERA escala**, `[data-scale="public"]`. Sus titulares van a
  46 y 58 px y meterlos en la escala del niño la deformaría para toda la aplicación por una pantalla.
- **El tema oscuro entra como un tercer bloque de reasignación**, con tres estados: claro explícito,
  oscuro explícito y, sin atributo, lo que diga el sistema. **Sigue al sistema y no se elige**: sin
  interruptor, sin almacenamiento y sin campo nuevo en el contrato.
- **Se añade una capa de alias para componentes de terceros**, para poder adoptar shadcn/ui sin traer
  su paleta. Sus nombres, nuestros valores.
- **Y la paridad clara/oscura se comprueba con un test**: el bloque oscuro tiene que reasignar todos
  los tokens que declara el claro. Es lo único de un tema que una batería puede verificar, porque
  jsdom no aplica CSS.

## Capabilities

### Modified Capabilities

- `design-system`: la pieza de aviso cambia de tonos y de nombres, y el sistema gana tres cosas que
  hoy no tiene: un tema que se reasigna entero, una escala cerrada de radios y tipografía, y la
  posibilidad de adoptar componentes de terceros sin adoptar su color.

## No incluye

Este change **no toca ninguna pantalla ni ninguna pieza**. Cambia valores y añade mecanismo; lo que
se ve cambia porque los puntos de uso ya referencian tokens, no porque se editen.

Queda fuera, y va en los cuatro changes siguientes, en este orden:

1. **`add-design-pieces`** — las cinco piezas de marca (`HeroPanel`, `IconTile`, `ProgressRing`,
   `Mascota`, y `CoinPill` si procede), lo que se trae de shadcn, y los doce avatares de emoji a SVG.
2. **`redesign-child-screens`** — las ocho del niño. Aquí se resuelve la decisión abierta del saldo
   en la cabecera, porque es donde se ve.
3. **`redesign-parent-screens`** — las doce del padre, incluidos los tres diálogos.
4. **`redesign-entry-screens`** — la puerta pública, el acceso, el registro, la rejilla, el PIN y el
   alta de perfil.

También queda fuera de todo lo anterior, y se dice para que no se cuele de rondón:

- **Elegir el tema.** Si algún día se quiere, va dentro del actor como `tutorialSeen`, nunca en el
  navegador: la tablet es compartida y `localStorage` es del dispositivo, así que el niño heredaría
  el tema de su padre.
- **El contraste de blanco sobre naranja.** Da 2,8:1 y el mínimo es 4,5:1. Se probó la salida que
  conserva el color —tinta oscura encima, 5,3:1— y se descartó por aspecto. Queda **aceptado a
  conciencia**, escrito en `design/ui/tokens.md`, y no se arregla aquí.

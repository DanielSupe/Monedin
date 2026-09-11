## Context

Ver `proposal.md` para el porqué, `specs/` para los requisitos y `design/ui/pantallas/` para las ocho
pantallas dibujadas. Las restricciones que descartan la solución directa:

1. **Existe un requisito vigente que las maquetas incumplen**: el saldo tiene que ser el elemento más
   grande del inicio. Las referencias visuales lo habían movido a una píldora en la cabecera.
2. **«Hoy» no existe en el modelo.** Una tarea tiene estado y una fecha límite opcional que ni caduca
   ni avisa. Cualquier cifra que hable de jornada es un dato inventado.
3. **`GET /tasks` pagina por reparto**, así que su `total` cuenta repartos y no tareas. Esta pantalla
   usa el listado propio del niño, que sí pagina por fila — pero la confusión ya se pagó una vez y
   conviene no repetirla al contar.
4. **Una pantalla no declara colores ni medidas.** Todo sale de las piezas de `add-design-pieces` y de
   los tokens de `repaint-design-system`.
5. **La navegación es del router.** Ninguna pantalla decide con estado qué se enseña.

## Goals / Non-Goals

**Goals**

- Que el inicio conteste «¿qué hago ahora?» sin dar un paso más.
- Que las tres etapas del ciclo se vean, porque son lo que el producto enseña.
- Que se vea cuál es la meta más cercana, no solo cuánto falta para cada una.

**Non-Goals** (además de lo que excluye el proposal)

- Tocar la API, el contrato o cualquier regla de negocio.
- Cambiar qué destinos tiene el marco del niño.

## Decisions

### 1. El saldo vuelve al inicio, y el marco se queda sin él

La decisión estaba tomada y escrita: el saldo es el elemento más grande del inicio. Las maquetas la
habían revocado sin argumento —una referencia visual lo llevaba arriba— y una referencia no revoca una
decisión de producto.

Se añade además lo que faltaba por escribir: **que el marco no lo muestre**. Hasta hoy solo estaba
dicho dónde vive el saldo, no dónde no puede vivir, y esa mitad es la que evita que vuelva a subirse.

**Alternativa descartada: dejarlo en la cabecera solo donde decide algo** —el escaparate y los
canjes—. Una regla con «a veces» es más difícil de sostener que una con «nunca», y donde decidiría
algo la pantalla ya lo dice mejor: cada premio anuncia lo que le falta.

### 2. El anillo cuenta lo suyo, y no cuenta días

Las hechas y las que esperan revisión, sobre el total de sus tareas. Marcada cuenta como hecha porque
el niño ya hizo su parte.

La alternativa que la referencia proponía —«2 de 5 hechas hoy»— exigiría una jornada que el modelo no
tiene. Las tres formas de fabricarla fallan: por fecha límite saldría casi siempre cero de cero porque
es opcional; por fecha de creación desaparecería la tarea repartida ayer y sin hacer, que es justo la
que hay que hacer; y por una jornada nueva sería un cambio de modelo disfrazado de detalle visual.

### 3. Los grupos tienen orden fijo y los vacíos no se dibujan

El orden es el del ciclo, no el del volumen. Ordenar por cantidad haría que la pantalla cambiara de
forma cada día, y de una pantalla se aprende dónde están las cosas.

Un grupo vacío no se dibuja, por lo mismo que un aviso con cero no se dibuja en el panel del padre:
leer un cero para concluir lo que la ausencia ya dice es trabajo que la pantalla existe para ahorrar.

### 4. La meta más cercana necesita desempate

El premio más barato de los que no alcanza. Con dos al mismo precio hace falta un desempate estable
—el identificador—, o el panel cambiaría de premio entre dos recargas sin que haya pasado nada. Es el
mismo bug clásico que obliga a desempatar cualquier orden de este proyecto.

Y los dos casos sin meta se distinguen entre sí: **le alcanzan todos** se celebra, **no tiene
premios** no destaca nada. Tratar los dos igual diría que no hay nada que conseguir cuando lo que pasa
es lo contrario.

## Risks / Trade-offs

- **El inicio gana contenido y puede alargarse.** Se acepta: lo que gana es lo que la pantalla existía
  para decir. Lo que no puede pasar es que el saldo deje de ser lo primero.
- **Quitar el saldo del marco contradice las maquetas** que ya se han visto. Se hace porque la spec
  vigente manda y porque en el inicio el saldo estaría dicho dos veces.
- **Agrupar por etapa oculta la fecha límite como criterio.** Hoy no ordena nada, así que no se pierde
  nada; si algún día ordenara, sería dentro de cada grupo.

## Open Questions

- Ninguna. La única que había —el saldo en la cabecera— la resuelve la decisión 1.

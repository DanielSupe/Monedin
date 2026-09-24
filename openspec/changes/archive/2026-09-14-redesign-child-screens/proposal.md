## Why

Con el sistema repintado y las piezas construidas, las ocho pantallas del niño pasan a la forma de
`design/ui/`. Son las que el rediseño existe para arreglar: quien las usa tiene entre seis y once años
y las abre en una tablet compartida.

Lo que cambia de verdad no es el color, es **qué se ve sin desplazar**:

- **El inicio no dice qué hacer.** Hoy es el saldo y cuatro teselas que llevan a otro sitio. Un niño
  que entra a ver qué le toca tiene que dar un paso más para averiguarlo.
- **Las tareas no dicen en qué punto está el ciclo.** Están todas en una columna con su estado escrito
  en una insignia. Las tres etapas —por hacer, esperando revisión, hechas— son la máquina de estados
  que el producto protege con transiciones condicionales, y en pantalla no se ven.
- **El escaparate no dice cuál es la meta.** Cada premio dice lo que le falta, pero ninguno dice cuál
  está más cerca, que es la pregunta que convierte un saldo en una decisión de ahorro.

Y hay un requisito vigente que las maquetas de referencia incumplían: **el saldo tiene que ser el
elemento más grande del inicio**. Las maquetas lo habían movido a una píldora en la cabecera de todas
las pantallas. Este change vuelve a lo decidido, y de paso escribe lo que faltaba: que el marco no
muestre el saldo.

## What Changes

- **El inicio del niño gana lo que hay que hacer y hacia dónde va**: sus tareas pendientes con su
  acción, y el premio más cercano con su progreso. El saldo **vuelve a ser el elemento más grande**,
  como exige la spec vigente.
- **El marco deja de llevar el saldo.** Tenerlo siempre delante convierte la navegación en un tablero
  de puntuación; el inicio es el sitio donde el niño lo mira a propósito, y en las otras pantallas
  está haciendo otra cosa.
- **Las tareas se agrupan por etapa del ciclo**, en orden fijo y sin dibujar los grupos vacíos.
- **El niño ve cuánto lleva hecho** de sus tareas, con el anillo. **Sin la palabra «hoy»**: una tarea
  no tiene concepto de jornada, solo una fecha límite opcional que ni caduca ni avisa. Decir «hoy»
  sería inventar un dato.
- **El escaparate anuncia la meta más cercana** y lo que falta para ella, con sus dos casos límite
  dibujados: cuando le alcanzan todos, y cuando no hay ninguno para él.
- **Las ocho pantallas pasan a las piezas del sistema**: realce, tesela de icono, anillo y mascota. Ni
  un estilo en línea, ni un color literal.

## Capabilities

### Modified Capabilities

- `app-navigation`: el marco gana una prohibición que hoy no está escrita — no muestra el saldo.
- `tasks`: las del niño se agrupan por etapa, y se ve cuánto lleva hecho.
- `rewards`: el escaparate anuncia cuál es la meta más cercana.

## No incluye

- **Cualquier cifra que exija un dato que no existe.** El anillo no cuenta «lo de hoy», el escaparate
  no ordena por «lo que más quiere» y ninguna pantalla infiere una racha. Si alguna de esas hiciera
  falta, es un cambio de modelo y va en su propio change.
- **Las pantallas del padre y las de entrada**, que van en los dos changes siguientes.
- **`CoinPill`.** Al resolverse la decisión a favor del saldo grande en el inicio, esa pieza no llega
  a existir. Quedaba excluida de `add-design-pieces` justo por esto.

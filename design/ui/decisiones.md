# Las decisiones del rediseño

Lo que el cambio de paleta obliga a resolver, y cómo se resolvió. Cada una se
implementa en el change de OpenSpec que cubra el rediseño; aquí queda el porqué,
para que nadie tenga que reconstruirlo leyendo un hex.

---

## 1. La paleta son DOS tonos, la moneda, y un rojo que solo existe para el error

**Decidido.** Naranja `#FF6B4A` = hacer. Morado `#6C4BD6` = conseguido y ahorrado.
Ámbar `#F5B93B` = la moneda, y solo la moneda. Neutro arena = esperando.

Antes había cinco tonos en pantalla más un degradado pastel distinto por tesela
—unos diez colores— y ninguno mandaba.

**Lo que esto rompe**: `Alert` tiene hoy cuatro tonos con cuatro colores, y tres
de ellos cambian de valor. La reasignación es:

| Tono de hoy | Pasa a ser | Color |
| ----------- | ---------- | ----- |
| `success`   | `done`     | morado `#6C4BD6` sobre `#EDE8FC` |
| `info`      | `info`     | arena `#6B6053` sobre `#F1E9DA` |
| `warning`   | `conflict` | naranja apagado `#B5533A` sobre `#F9E4DC` |
| `danger`    | `danger`   | **rojo**, sin cambiar de papel |

**El rojo se queda, y es la única excepción declarada a los dos tonos.** No es una
decisión de marca: es una señal universal. Colapsarlo con el naranja de la acción
haría que el mismo color dijera «pulsa aquí» y «esto falló», que es exactamente lo
que un color de peligro existe para impedir.

**«Esperando» pierde su color propio a conciencia.** No es un estado con voz: es la
AUSENCIA de acción. Cuando la pelota está en el tejado del otro no hay nada que
hacer, y el color no debe fingir que sí. Es lo que más limpia la pantalla: antes
era azul y competía con todo.

**Y el 409 sigue sin ser un error**, que es de lo que va media API. Va en naranja
apagado y nunca en rojo: nadie hizo nada mal, el padre aprobó dos veces o el
hermano llegó antes.

---

## 2. Se renombra el tono que nombra un COLOR; el que nombra un papel, no

**Decidido.** `--color-success` deja de ser verde, así que su nombre pasa a mentir
el día que se aplique la paleta. Se renombra, y con él la prop de `Alert` y de
`Badge`:

```
--color-success  →  --color-done       tone="success"  →  tone="done"
--color-warning  →  --color-conflict   tone="warning"  →  tone="conflict"
--color-info     →  --color-info       sin cambio
--color-danger   →  --color-danger     sin cambio
```

**`info` y `danger` NO se tocan, y esa es la mitad que importa.** Un renombrado
que arrastra todo lo que puede no es una regla, es una moda: `info` nombra un
papel —información— y sigue siendo exacto con un valor arena.

Se descubrió al implementarlo, y conviene dejar dicho cómo: el aviso de «dos
claves, para dos cosas distintas» del registro no espera a nadie, solo explica.
Con el nombre `waiting` habría quedado mintiendo en la única pantalla donde ese
tono se usa para informar de verdad.

Cuesta visitar todos los puntos de uso, y se hace igual. Es la misma razón por la
que `Button` nombra su variante `contrast` y no por el color que lleva: un nombre
que describe el VALOR se queda obsoleto en cuanto el valor cambia; uno que describe
el PAPEL sobrevive. Y ya se pagó esa lección aquí — la variante `contrast` pasó de
tinta oscura a ámbar sin tocar su nombre ni un solo punto de uso.

Los dos nombres nuevos además dicen algo que el producto ya tiene: `done` es una
tarea aprobada y un canje resuelto, y `conflict` es exactamente el 409 que la API
distingue.

---

## 3. Los doce avatares pasan de emoji a SVG

**Decidido.** `ui/avatars.ts` deja de mapear cada clave a un emoji y pasa a
mapearla a un dibujo. Los doce están dibujados en `pantallas/NuevoPerfil.dc.html`
y en `pantallas/NinoPerfil.dc.html`.

El motivo no es estético: **un emoji lo pinta cada dispositivo a su manera**, así
que el mismo perfil se ve distinto en la tablet compartida y en el portátil del
padre, y a un niño de seis años su cara es cómo se reconoce.

El comentario de `avatars.ts` ya lo anticipaba con todas las letras: «hoy son
emojis; cuando haya ilustraciones de verdad, cambia este archivo y nada más: ni la
base de datos ni la validación saben cómo se pinta un avatar». Eso sigue siendo
cierto, y por eso este cambio no toca `AVATAR_KEYS` ni el contrato.

**Los colores de un animal son SUYOS y no del tema.** No entran en la paleta de dos
tonos ni se reasignan en oscuro: un avatar es contenido, como una foto.

---

## 4. El tema oscuro sigue al SISTEMA, y no se elige

**Decidido.** Sin interruptor, sin almacenamiento y sin campo nuevo en el
contrato: la media query aplica antes del primer pintado, así que no hay destello
y no hay nada que persistir.

Las otras dos salidas, y por qué no:

- **`localStorage`** es la peor justo en este producto. Es del DISPOSITIVO, no del
  perfil, y la tablet es compartida: el niño heredaría el tema que eligió su
  padre. Además el proyecto hoy no usa almacenamiento del navegador para nada —el
  lateral contraído se pierde al recargar, y eso se aceptó a conciencia—.
- **Preferencia del perfil**, viajando dentro del actor como `tutorialSeen`. Es lo
  coherente con la regla de que un dato del perfil viaja DENTRO del actor, pero
  es una columna, un campo en el contrato y el primer cambio de API de esta etapa.
  Si algún día se quiere elegir el tema, **es por aquí y no por el navegador**.

El mecanismo completo —los tres estados, `color-scheme`, y la trampa de
`[data-surface="default"]`— está en `tokens.md`.

---

## 5. Lo máximo de shadcn, y a mano solo lo que es marca

**Decidido.** Si shadcn tiene la pieza, se trae y se edita lo que haga falta —son
archivos propios en cuanto entran—. Si la tiene a medias, se trae igual por el
esqueleto: el cableado de Radix, el foco, el teclado y los roles ARIA. A mano solo
lo que ninguna librería puede dar: la moneda, la mascota, el anillo y el panel de
degradado. **Y si en algún punto estorba, se descarta sin discutirlo: manda que se
vea como el diseño.**

Encaja mejor de lo que parece, porque **Radix ya está instalado** —dialog,
accordion, tabs y toast— y la mitad de los shadcn son envoltorios de Radix. Varios
no añaden dependencia: sustituyen envoltorios escritos a mano.

**Lo que NO se trae es su paleta.** Sus componentes leen variables; esas variables
las declara `tokens.css` apuntando a los tokens de Monedín, con una capa de alias
de once líneas. Copiar su bloque de tema daría dos fuentes de verdad del color.

Dos fricciones conocidas, con su salida:

- **`cn()` es `clsx` + `tailwind-merge`; el `cx` de aquí no lo es, a propósito.**
  Un componente traído que dependa de fusionar clases se adapta: las variantes se
  declaran como props y no se imponen desde fuera. Si alguno lo necesita de
  verdad, se añade `tailwind-merge` y se dice por qué.
- **Su modo oscuro es una clase `.dark`**, y aquí el tema cambia el valor de las
  variables. Sus componentes se repintan solos sin escribir un `dark:`. Si aparece
  uno en el código, es que se copió un componente sin adaptarlo.

El mapa completo —qué se trae, qué ya existe y qué hay que hacer a mano— está en
`piezas.md`.

---

## 6. El saldo en la cabecera — RESUELTA por una spec que ya existía

**Decidido: vuelve al inicio y sale de la cabecera.** Y no hizo falta decidirlo:
al escribir `redesign-child-screens` apareció un requisito vigente que las
maquetas incumplían —«el saldo SHALL ser el elemento más grande del inicio»—. La
spec ya lo había decidido y la maqueta era la desviación.

Lo que sí se añade es la mitad que faltaba por escribir: **que el marco no lo
muestre**. Hasta hoy solo estaba dicho dónde vive, no dónde no puede vivir.

Lo que sigue debajo es el planteamiento original, que se conserva porque explica
los dos precios:

Las maquetas del niño llevan una píldora con el saldo en la cabecera de todas sus
pantallas. `CLAUDE.md` dice exactamente lo contrario, y lo argumenta: el saldo vive
en el inicio porque «tenerlo siempre a la vista convertiría el marco en un tablero;
el inicio es el sitio donde el niño mira su saldo a propósito, y en las otras tres
pantallas está haciendo otra cosa».

Esa decisión no se revoca porque una referencia visual la llevara. Para cambiarla
hace falta un argumento sobre el producto, no sobre el aspecto.

Las dos salidas, y lo que cuesta cada una:

- **Se quita la píldora** y el inicio recupera el saldo GRANDE, con `--text-hero`
  en 4rem, que es el número para el que esa escala existe. Es volver a lo decidido.
  Cambia la cabecera de cinco pantallas del niño y el inicio entero.
- **Se queda la píldora** y se revoca la decisión por escrito, en el mismo change,
  diciendo qué argumento nuevo la revoca. Un documento que describe algo distinto
  de lo construido no es documentación de más: es una trampa.

Lo que NO vale es dejarlo así: las maquetas y `CLAUDE.md` diciendo cosas contrarias.

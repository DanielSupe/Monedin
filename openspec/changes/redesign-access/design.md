## Context

Ver `proposal.md` — Why.

Lo que condiciona el cómo:

- **`EntryShell` ya pone el marco**: logo arriba a la izquierda y contenido centrado. La pantalla no
  tiene que resolver eso, solo su interior.
- **El ancho lo declara cada pantalla**, no el marco. Lo aprendimos en `add-entry-frame`.
- **`cx` no fusiona utilidades de Tailwind.** Una variante de una pieza es una prop, no una clase
  desde fuera. Lo dejó escrito `polish-profile-tiles`.
- **El movimiento va bajo `motion-safe:`**, no bajo una duración corta. Misma fuente.
- **`Orbits` ya cuenta el ciclo**, con su conjunto de emojis y su tratamiento como UNA imagen para
  las tecnologías de asistencia.
- **`ProgressBar` y `Orbits` son las dos únicas excepciones de estilos en línea**, y cada llamada
  nueva a `allowInlineStyles()` debilita la regla.
- **Los contratos ya validan**: `passwordSchema` lleva su mínimo dentro y `registerParentSchema` pide
  las dos credenciales. Nada de eso hay que reescribirlo, solo enseñarlo antes.

## Goals / Non-Goals

**Goals:**

- Que quien viene a registrarse llegue al registro.
- Que entrar y registrarse se comporten como dos destinos, porque lo son.
- Que la primera pantalla del producto se vea como el producto.
- Que las reglas de las credenciales se lean antes de chocar con ellas.

**Non-Goals:**

- Vestir el resto de las pantallas de credenciales.
- Tocar la API o los contratos.
- Añadir un panel de bienvenida: ya existe y es `/welcome`.

## Decisions

### 1. Dos rutas, y un marco compartido que NO es un componente con `if`

**Elegido**: `/sign-in` y `/sign-up`, cada una con su componente, y una pieza local que aporta lo
común —saludo, cinta y tarjeta— recibiendo el formulario como hijo.

```
   antes                          después
   ─────                          ───────
   /sign-in                       /sign-in  → AccessLayout > SignInForm
     useState<"signIn"|"signUp">  /sign-up  → AccessLayout > SignUpForm
     un componente con ifs
     por todo el árbol            cada formulario sabe solo lo suyo
```

**Descartado — una ruta con un parámetro** (`/sign-in?mode=signup`): el modo de la rejilla viaja en
la dirección porque tiene que **sobrevivir a una navegación** al teclado de PIN. Aquí no hay nada que
sobrevivir: son dos formularios distintos, con campos distintos y validación distinta. Un parámetro
sería el mismo `if` con otro sitio donde vivir.

**El marco compartido recibe el formulario como hijo y no decide nada.** Si tuviera un `if` sobre
cuál enseñar, habríamos movido el problema en vez de resolverlo.

### 2. La cinta se hace con clases, y NO pide una tercera excepción de estilos en línea

```
   Orbits                             La cinta
   ──────                             ────────
   rotate(a) translate(r) rotate(-a)  translateX(-50%)
   nueve ángulos y tres radios        una sola traslación
   geometría CALCULADA                una tira duplicada
   → excepción justificada            → clases y un keyframe
```

Un `@keyframes` nuevo en `tokens.css` junto a `mnd-orbit`, con su `--animate-*`. La tira se escribe
dos veces y se desplaza la mitad: cuando llega al final, la copia está exactamente donde estaba la
primera, así que el salto no se ve. Eso son clases, no geometría, y por tanto **no hace falta una
tercera llamada a `allowInlineStyles()`**.

### 3. Con movimiento reducido la cinta se PARA, y eso ya es un estado final

El bloque del sistema pone las duraciones a 1 ms. Para un deslizamiento continuo eso significa
saltar al final de golpe y quedarse ahí — molesto justo para quien pidió no ver movimiento.

Por eso el movimiento va bajo `motion-safe:`. Y aquí hay una ventaja que no tenían la máquina de
escribir ni la cuenta de la landing: **una cinta parada sigue estando completa**. No hace falta un
hook que sepa el estado final, como `usePrefersReducedMotion` en la landing, porque el estado final
de una cinta es la cinta.

### 4. La píldora es una variante de `Input`, y el icono es decorativo

Misma razón que la forma de `Avatar`: `cx` no fusiona utilidades, así que un radio pasado desde la
pantalla lo resuelve el orden del CSS generado.

El icono **no nombra el campo**. Lo nombra su etiqueta, que se queda encima. La maqueta de referencia
usa solo marcador de posición, y eso borra qué campo era en cuanto alguien escribe — en un formulario
que se rellena una vez cada muchos meses, es exactamente cuando peor viene.

### 5. La flecha lleva nombre

El envío es un botón circular con una flecha, como la referencia. Una flecha sola no dice si envía,
avanza o vuelve, así que declara su nombre. Es la misma regla que se aplicó a la tecla de borrar del
teclado de PIN y a la corona del adulto: **si lo visible es solo un símbolo, el nombre no es
opcional**.

### 6. Un defecto ajeno que este change destapó, y arregló

**Encontrado mirando el móvil, no con un test.**

`polish-profile-tiles` dejó las teselas de la rejilla en `w-40` —10 rem— y yo medí que a 390 px
seguían cabiendo dos por fila. La medición era correcta y la conclusión no: había **cuatro** teselas
y la página cabía entera, así que no había barra de desplazamiento y el ancho útil era 358.

Con un perfil más aparece la barra, el ancho útil baja a 343, y hacen falta 344. **Falla por un
píxel** — y al caer a una columna la página se alarga, así que la barra se queda: un bucle que no se
deshace solo.

La tesela pasa a `w-36` sin relleno lateral, o sea exactamente lo que mide el avatar: hacen falta
312 y hay 343, con 31 de holgura. La lección no es el número: es que **medir con el contenido de hoy
no es medir**, y que una barra de desplazamiento cambia el ancho disponible justo cuando hay más
cosas que enseñar.

## Risks / Trade-offs

- **Partir la pantalla toca el registro, que es el camino más caro de romper** → Se prueba
  registrando una cuenta de verdad hasta llegar a la rejilla, no solo con tests.
- **Una fila infinita desborda de lado con facilidad** → Es lo que hay que mirar a 390 px.
- **`Input` gana una prop** → Se acepta por lo mismo que la de `Avatar`: la alternativa no funciona
  de forma fiable.
- **Dos rutas donde había una** → Es la corrección, no el coste.

## Migration Plan

1. Las dos rutas y el reparto de los enlaces de la puerta pública, con sus tests. Es la corrección y
   no se ve.
2. El marco compartido y los dos formularios, vestidos.
3. La variante de `Input` y el botón de flecha.
4. La cinta y su comportamiento bajo movimiento reducido.
5. Estrechar la deuda declarada.

**Vuelta atrás**: los enlaces vuelven a apuntar a `/sign-in`, que sigue existiendo.

## Open Questions

Ninguna. Las cuatro se cerraron antes de escribir esto.

## Decisiones que este change NO toma

- **El aspecto de las otras tres pantallas de credenciales.** Siguen en la lista de deuda.
- **El recorte de foto con `react-easy-crop`**: vive en `ParentAvatarScreen`, que queda fuera. La
  pregunta que `add-design-system` dejó abierta sobre cómo declarar su excepción sigue abierta.
- **Subir una foto al crear un perfil.**

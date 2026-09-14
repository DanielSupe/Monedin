## Context

Ver `proposal.md` para el porqué, `specs/` para los requisitos y `design/ui/` para las maquetas y la
traducción token por token. Lo que este documento establece son las restricciones que descartan la
solución directa:

1. **`[data-surface="brand"]` y `[data-surface="default"]` ya reasignan la capa 2.** Un tercer eje
   —el tema— tiene que convivir con esos dos sin que ninguno gane por accidente.
2. **`[data-scale]` también reasigna**, y la escala nueva le añade tres pasos y una tercera audiencia.
3. **Un test escanea el archivo entero buscando colores literales y valores arbitrarios**, no solo los
   `className`. Cualquier atajo con un hex suelto cae.
4. **`cx` no es `twMerge`, a propósito.** Cualquier componente de terceros que dependa de fusionar
   clases hay que adaptarlo, no envolverlo.
5. **jsdom no aplica CSS.** Lo que este change hace no se puede ver desde la batería; hay que decidir
   qué SÍ se puede comprobar, o el tema oscuro entra sin red.

## Goals / Non-Goals

**Goals**

- Que cambiar los tokens repinte la aplicación sin editar una sola pieza. Es la promesa de la capa
  semántica, y hasta hoy nunca se ha ejercido.
- Que el tema oscuro no pueda quedarse a medias sin que la batería lo diga.
- Que se pueda adoptar shadcn sin adoptar su paleta.

**Non-Goals** (además de lo que excluye el proposal)

- Cambiar una sola estructura de pantalla, un solo texto o un solo dato.
- Arreglar el contraste de blanco sobre naranja.

## Decisions

### 1. El tema son tres estados, no dos

```css
:root                             { /* la capa 2 en claro */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* la capa 2 en oscuro */ }
}
:root[data-theme="dark"]          { /* lo mismo */ }
```

Claro explícito, oscuro explícito, y **sin atributo = lo que diga el sistema**. Con solo dos estados
habría que decidir uno por defecto y escribirlo en el HTML antes del primer pintado, que es de donde
salen los destellos.

Hoy nadie escribe el atributo: el producto sigue al sistema y ya está. El selector existe para que el
día que se quiera elegir no haya que rehacer el mecanismo.

**Y `color-scheme` sigue al tema.** Hoy `html` lo tiene fijo en `light`. Si no cambia, se quedan
claros los controles nativos: las barras de desplazamiento, el autocompletado, el selector de fecha
límite de una tarea y el `input[type=file]` de las fotos. Esta aplicación tiene los cuatro.

**Alternativa descartada: la clase `.dark` de shadcn.** Obliga a un `@custom-variant` y a que alguien
ponga y quite la clase. El atributo encaja con los dos ejes que ya existen —`data-surface` y
`data-scale`— y el mecanismo del proyecto pasa a ser uno solo en vez de dos parecidos.

### 2. `[data-surface="default"]` deja de escribir valores

Ese bloque existe porque `Alert` pinta su propio fondo claro y necesita el camino de vuelta dentro del
panel de marca. **En oscuro se vuelve exactamente al revés**: el fondo de `Alert` pasa a ser oscuro, y
si el bloque sigue apuntando a los primitivos claros, dentro del acceso saldría texto claro sobre
fondo claro.

No se arregla con más selectores, sino dejando de escribir valores ahí. Los valores por defecto se
declaran una vez y el tema los reasigna:

```css
:root                    { --tema-ink: …; --tema-surface-raised: …; }
:root[data-theme="dark"] { --tema-ink: …; --tema-surface-raised: …; }

[data-surface="default"] { --color-ink: var(--tema-ink); … }
```

Así «volver al valor por defecto» significa el del tema VIGENTE, no el claro. Es la misma razón por la
que ese bloque hoy repite las REFERENCIAS a los primitivos en vez de copiar sus valores.

Lo que **no** hace falta resolver: anidar `[data-surface="brand"]` dentro de una raíz oscura. Son
elementos distintos, así que la declaración del descendiente gana en su subárbol sin pelear
especificidad con la raíz.

### 3. Los tonos de aviso se renombran por su papel

`--color-success` deja de ser verde. Un nombre que describe el VALOR se queda obsoleto en cuanto el
valor cambia; uno que describe el PAPEL sobrevive. Ya se pagó esa lección aquí: la variante `contrast`
de `Button` pasó de tinta oscura a ámbar sin tocar su nombre ni un solo punto de uso.

```
--color-success → --color-done       tone="success" → tone="done"
--color-warning → --color-conflict   tone="warning" → tone="conflict"
--color-info    → --color-info       sin cambio: nunca nombró un color
--color-danger  → --color-danger     sin cambio
```

> **Corregido durante la implementación.** Este change decía TRES renombrados.
> Son dos: `info` nunca nombró un color, nombró un papel —información—, y sigue
> siendo exacto ahora que su valor es arena. Lo destapó el aviso de «dos claves,
> para dos cosas distintas» del registro, que no espera a nadie: solo explica.
> Renombrarlo habría sido cambiar por cambiar, que es lo contrario de la regla
> que este change defiende.

Los dos nombres nuevos además dicen algo que el producto ya tiene: `done` es una tarea aprobada y un
canje resuelto, y `conflict` es exactamente el 409 que la API distingue.

**Y `danger` conserva el rojo**, que es la única excepción declarada a los dos tonos. Un color de
peligro no es una decisión de marca. Colapsarlo con el naranja de la acción haría que el mismo color
dijera «pulsa aquí» y «esto falló», que es justo lo que un color de peligro existe para impedir.

**Alternativa descartada: dejar los nombres viejos con valores nuevos.** Cuesta menos hoy y deja una
trampa: el siguiente que lea `tone="success"` esperando verde escribirá la pantalla equivocada.

### 4. La escala se cierra, y la puerta pública es una tercera audiencia

Cinco radios y siete tamaños, con la tabla completa en `design/ui/tokens.md`. Las maquetas usan 20
radios y 24 tamaños porque se dibujaron a mano; sin consolidar, cada pantalla elegiría su píxel y la
regla del origen único quedaría en el papel.

Dos tokens son NUEVOS y hoy se escriben a mano en el punto de uso: `--radius-panel` y `--radius-pill`.
El 999 aparece decenas de veces en las maquetas, y en la aplicación de hoy ya aparece suelto.

**La puerta pública se declara como `[data-scale="public"]`.** Sus titulares van a 46 y 58 px, que no
son ni la del padre ni la del niño: es una página de marketing, se lee de pie y de un vistazo.

**Alternativa descartada: estirar la escala del niño hasta 58px.** Deformaría la escala de toda la
aplicación por una sola pantalla, y el `--text-hero` del niño está calibrado para el saldo.

### 5. Los componentes de terceros leen nuestros tokens

Una capa de alias en `tokens.css`: los nombres que shadcn espera, apuntando a los tokens de aquí.
Once líneas, y el detalle en `design/ui/tokens.md`.

**Alternativa descartada: copiar su bloque de tema.** Daría dos fuentes de verdad del color, que es la
regla que este proyecto protege con más celo. Y su modo oscuro es una clase, que chocaría con el
atributo de la decisión 1.

### 6. Lo único que una batería puede comprobar de un tema

jsdom no aplica CSS, así que **el aspecto se verifica abriendo pantallas**, igual que hoy al tocar
tokens. Pero hay una cosa que sí es comprobable leyendo el archivo, y es la que evita la regresión de
verdad:

**el bloque oscuro tiene que reasignar TODOS los tokens que declara el claro.** El día que alguien
añada un semántico nuevo y se olvide de su valor oscuro, falla la batería —en vez de aparecer un texto
negro sobre negro tres meses después, en la pantalla que nadie abre.

Y es un test que **se puede inyectar**: se quita una línea del bloque oscuro y tiene que caer
nombrando el token. Sin esa comprobación no prueba nada.

## Risks / Trade-offs

- **El renombrado de los tonos toca todos los puntos de uso de `Alert` y `Badge`.** Es mecánico y el
  typecheck lo caza entero, pero es el trozo más largo del change y no aporta nada visible.
- **Cambiar la capa 1 repinta la aplicación de golpe y sin red.** Ningún test lo ve. Por eso hay una
  tarea de abrir pantallas de los tres marcos, y por eso este change no toca ninguna estructura: si
  algo se ve raro, la causa solo puede ser un token.
- **Los tres pasos nuevos de tipografía y los dos de radio empiezan sin usarse.** Los estrenan los
  changes siguientes. Se declaran aquí porque declararlos a trozos es cómo se acaba con dos escalas.
- **El contraste de blanco sobre naranja entra con el rediseño y no se arregla.** Está aceptado a
  conciencia y escrito; si algún día entra una verificación de contraste en la batería, esto es lo
  primero que va a fallar, y va a fallar por decisión y no por descuido.

## Migration Plan

El renombrado y el repintado van juntos y en un solo paso: dejar los nombres viejos como alias
«mientras se migra» significa tener dos nombres para lo mismo, que es el problema que el renombrado
resuelve. El typecheck señala cada punto de uso, así que el paso no puede quedarse a medias.

## Open Questions

- **El saldo en la cabecera del niño.** Las maquetas lo llevan; `CLAUDE.md` decidió lo contrario con
  un argumento de producto. No se resuelve aquí porque este change no toca pantallas: se resuelve en
  `redesign-child-screens`, que es donde se ve. Está planteado en `design/ui/decisiones.md`.

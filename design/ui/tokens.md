# La traducción, token por token

Casi toda la aplicación se repinta **sin tocar una sola pieza**, porque ninguna
escribe un color: reasignando la capa 2 de `apps/web/src/styles/tokens.css` cambia
todo lo que la usa. Eso es exactamente para lo que esa capa existe.

Lo que sigue es el mapa. La columna «hoy» son los primitivos de la capa 1; la
columna «nuevo» son los valores del rediseño, que sustituyen a esos primitivos.

## Capa 1 — los primitivos

El índigo y el slate azulado desaparecen; entran el naranja, el morado y una
familia de neutros CÁLIDOS. El ámbar se queda como está.

| Familia | Hoy | Nuevo |
| ------- | --- | ----- |
| Neutros | slate con una pizca de azul | arena: `#FFF7EC` `#F8F1E5` `#F1E9DA` `#F0E6D8` `#E3D6C4` `#C9BCAE` `#6B6053` `#2A2438` |
| Acción | índigo `#5B4BD6`… | naranja `#FF7C5A` `#FF6B4A` `#F5533A` `#C7452A` · suaves `#FFE9E2` `#FFD9CC` `#FFB49C` |
| Marca / ahorro | (no existía aparte) | morado `#8464E8` `#7B5BE0` `#6C4BD6` `#5836BC` `#452B96` · suaves `#EDE8FC` `#E0D8FB` `#B9A6F2` |
| Moneda | ámbar `#F5B93B` | **sin cambio** `#F5B93B` `#FFF4DD` `#8A5A10` |
| Atención | ámbar de aviso | naranja apagado `#B5533A` `#EFC0AD` `#F9E4DC` |
| Peligro | rojo | **sin cambio** |

## Capa 2 — los semánticos, que es lo único que usa una pieza

| Token | Hoy | Nuevo |
| ----- | --- | ----- |
| `--color-surface` | slate-50 | `#FFF7EC` |
| `--color-surface-raised` | slate-0 | `#FFFFFF` |
| `--color-surface-sunken` | slate-100 | `#F1E9DA` |
| `--color-ink` | slate-900 | `#2A2438` |
| `--color-ink-muted` | slate-500 | `#6B6053` |
| `--color-border` | slate-200 | `#F0E6D8` |
| `--color-border-strong` | slate-300 | `#E3D6C4` |
| `--color-primary` | indigo-500 | `#FF6B4A` |
| `--color-primary-hover` | indigo-600 | `#F5533A` |
| `--color-primary-soft` | indigo-100 | `#FFE9E2` |
| `--color-brand` | indigo-800 | `#5836BC` |
| `--color-brand-deep` | indigo-700 | `#3E2590` |
| `--color-brand-line` | indigo-600 | `#7B5BE0` |
| `--color-brand-soft` | indigo-300 | `#B9A6F2` |
| `--color-coin` | amber-400 | **sin cambio** |
| `--color-coin-soft` | amber-100 | `#FFF4DD` |
| `--color-coin-ink` | amber-800 | `#8A5A10` |
| `--color-done` *(era success)* | green-600 | `#6C4BD6` / soft `#EDE8FC` |
| `--color-waiting` *(era info)* | blue-600 | `#6B6053` / soft `#F1E9DA` |
| `--color-conflict` *(era warning)* | orange-700 | `#B5533A` / soft `#F9E4DC` |
| `--color-danger` | red-600 | **sin cambio** |

El renombrado de los tres últimos está argumentado en `decisiones.md`.

## La superficie de marca

`[data-surface="brand"]` ya existe y hace lo correcto: reasigna la tinta, los
bordes **y las superficies** sobre un fondo de color. Solo cambia de color: de
índigo profundo a morado profundo.

Sigue valiendo su lección entera, que es la que hace que `Input` y `Field`
compongan solos: sobre oscuro no basta con invertir la tinta, porque un campo
blanco acabaría con texto claro dentro.

## El tema oscuro

Un tercer bloque de reasignación de la capa 2, con la misma mecánica. Los valores
salen de `a-oscuro.mjs`, que es donde vive el mapa completo.

| Token | Claro | Oscuro |
| ----- | ----- | ------ |
| `--color-surface` | `#FFF7EC` | `#1C1620` |
| `--color-surface-raised` | `#FFFFFF` | `#262031` |
| `--color-surface-sunken` | `#F1E9DA` | `#322B3C` |
| `--color-ink` | `#2A2438` | `#F5F0EA` |
| `--color-ink-muted` | `#6B6053` | `#C9BCAE` |
| `--color-border` | `#F0E6D8` | `#332B40` |
| `--color-border-strong` | `#E3D6C4` | `#453B52` |
| `--color-primary` | `#FF6B4A` | **sin cambio** |
| `--color-primary-soft` | `#FFE9E2` | `#3D2620` |
| `--color-done` | `#6C4BD6` | `#8B6BF0` |
| `--color-done-soft` | `#EDE8FC` | `#302847` |
| `--color-coin` | `#F5B93B` | **sin cambio** |
| `--color-coin-soft` | `#FFF4DD` | `#3D3220` |
| `--color-coin-ink` | `#8A5A10` | `#F5C978` |

Cuatro cosas que no son obvias y que el mapa resuelve a propósito:

1. **El papel es tinta cálida, no negro.** Con negro puro el naranja vibra, y se
   pierde justo la calidez que define la marca.
2. **Las tarjetas SUBEN** en vez de bajar: en oscuro lo que separa una tarjeta es
   su luminosidad, no su sombra. Las sombras dejan de hacer trabajo.
3. **El morado se aclara y el naranja no.** Un morado medio se hunde sobre fondo
   oscuro; el naranja aguanta, y el ámbar hasta brilla más.
4. **Los fondos suaves se invierten DE VERDAD**: el morado suave pasa a morado
   oscuro con tinta clara, no a un gris. Volverlos neutros borraría lo que cada
   estado significa, que es lo único que esos fondos existen para decir.

## Cómo se resuelve el tema, mecánicamente

Un tercer bloque de reasignación de la capa 2, con el mismo mecanismo que
`[data-surface]`. **Tres estados, no dos**: claro explícito, oscuro explícito, y
sin atributo = lo que diga el sistema.

```css
:root                                     { /* la capa 2 en claro */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"])         { /* la capa 2 en oscuro */ }
}
:root[data-theme="dark"]                  { /* lo mismo */ }
```

Y `color-scheme` tiene que seguirlo. Hoy `html` lo tiene fijo en `light`, y si no
cambia, los controles NATIVOS se quedan claros: las barras de desplazamiento, el
autocompletado, el selector de **fecha límite** de una tarea y el `input[type=file]`
de las fotos. Esta aplicación tiene los cuatro.

### El único conflicto real: `[data-surface="default"]`

Ese bloque existe porque `Alert` pinta su propio fondo claro y necesita el camino
de vuelta dentro del panel de marca. **En oscuro se vuelve exactamente al revés**:
el fondo de `Alert` pasa a ser oscuro, y si el bloque sigue apuntando a los
primitivos claros, dentro del acceso saldría texto claro sobre fondo claro.

No se arregla con más selectores, sino dejando de escribir valores ahí. Los
valores por defecto se declaran una vez y el tema los reasigna:

```css
:root                    { --tema-ink: #2A2438; --tema-surface-raised: #FFFFFF; }
:root[data-theme="dark"] { --tema-ink: #F5F0EA; --tema-surface-raised: #262031; }

[data-surface="default"] {
  --color-ink: var(--tema-ink);
  --color-surface-raised: var(--tema-surface-raised);
}
```

Así «volver al valor por defecto» significa el del tema VIGENTE, no el claro. Es
la misma razón por la que hoy ese bloque repite las referencias a los primitivos
en vez de copiar sus valores.

Lo que **no** es un problema: anidar `[data-surface="brand"]` dentro de una raíz
oscura. Son elementos distintos, así que la declaración del descendiente gana en
su subárbol sin pelear especificidad con la raíz.

### Lo que se puede verificar, y lo que no

jsdom no aplica CSS, así que el aspecto se comprueba abriendo pantallas — igual
que hoy al tocar tokens. Pero sí hay algo comprobable con una herramienta, y es
lo que evita la regresión de verdad:

**un test que lea `tokens.css` y exija que el bloque oscuro reasigne TODOS los
tokens que declara el claro.** El día que alguien añada un semántico nuevo y se
olvide de su valor oscuro, falla la batería, en vez de aparecer un texto negro
sobre negro tres meses después.

## La escala, que las maquetas NO respetan

Dibujando a mano salieron **20 radios distintos** (de 7px a 44px) y **24 tamaños
de fuente** (de 10px a 58px). El sistema tiene 3 radios y 4 tamaños. Esa
consolidación es una decisión, y si la toma cada pantalla sobre la marcha, cada
una la toma distinta.

### Radios: cinco pasos, por lo que envuelven

| Token | Padre | Niño | Qué envuelve | Absorbe de las maquetas |
| --- | --- | --- | --- | --- |
| `--radius-control` | 12px | 14px | botones, campos, teselas de icono | 7 · 10 · 11 · 12 · 13 · 14 · 15 |
| `--radius-card` | 18px | 22px | tarjetas, filas, avisos | 16 · 17 · 18 · 20 · 22 |
| `--radius-panel` | 26px | 26px | paneles de degradado y diálogos | 24 · 26 · 28 · 30 |
| `--radius-sheet` | 34px | 34px | la tarjeta del PIN, la lámina | 32 · 34 · 42 · 44 |
| `--radius-pill` | 999px | 999px | píldoras, insignias, avatares | 999 |

`--radius-control` y `--radius-card` ya existen y solo cambian de valor.
`--radius-sheet` existe. **`--radius-panel` y `--radius-pill` son nuevos**: hoy el
999 se escribe a mano en cada punto de uso, que es justo lo que la regla prohíbe.

### Tipografía: siete pasos, nombrados por su papel

| Token | Padre | Niño | Dónde |
| --- | --- | --- | --- |
| `--text-micro` | 12px | 13px | etiquetas en mayúsculas, metadatos |
| `--text-small` | 13px | 14px | ayuda de un campo, fecha de una fila |
| `--text-body` | 15px | 17px | el texto corriente |
| `--text-lead` | 17px | 19px | el título de una fila o de una tesela |
| `--text-title` | 21px | 26px | el título de una sección |
| `--text-display` | 26px | 34px | el título de la pantalla |
| `--text-hero` | 44px | 64px | el saldo, y solo el saldo |

Tres pasos nuevos —`micro`, `lead`, `display`— porque las maquetas los usan en las
32 pantallas, y sin ellos cada una elegiría su píxel. `body`, `small`, `title` y
`hero` ya existen.

### Y la puerta pública es una TERCERA escala

Sus titulares van a 46 y 58 px, que no son ni la del padre ni la del niño: es una
página de marketing, se lee de pie y de un vistazo. Meterlos en la escala del niño
la deformaría para toda la aplicación por una sola pantalla.

Se declara como `[data-scale="public"]`, con el mismo mecanismo que las otras dos.
Es la única pantalla que la usa, y esa es la razón de que exista aparte.

### Espaciado: no hacen falta tokens

Los huecos de las maquetas caen todos en la escala de Tailwind (`gap-2` a `gap-8`,
`p-3` a `p-6`). No hay nada que declarar: lo que sí sigue prohibido es un valor
arbitrario, y eso ya lo caza un test.

---

## Los componentes de terceros leen los tokens de aquí

shadcn/ui espera unas variables propias —`--background`, `--foreground`,
`--primary`, `--muted-foreground`…— y sus componentes las usan en clases como
`bg-background` o `text-muted-foreground`. Si se copiara su bloque de tema,
habría **dos fuentes de verdad del color**, que es la regla que este proyecto
protege con más celo.

La salida es una capa de alias en `tokens.css`: sus nombres, nuestros valores.

```css
@theme inline {
  --color-background:        var(--color-surface);
  --color-foreground:        var(--color-ink);
  --color-card:              var(--color-surface-raised);
  --color-card-foreground:   var(--color-ink);
  --color-popover:           var(--color-surface-raised);
  --color-muted:             var(--color-surface-sunken);
  --color-muted-foreground:  var(--color-ink-muted);
  --color-accent:            var(--color-primary-soft);
  --color-destructive:       var(--color-danger);
  --color-input:             var(--color-border-strong);
  --color-ring:              var(--color-primary);
}
```

`--color-primary` y `--color-border` **ya se llaman igual** en los dos sistemas y
significan lo mismo, así que no necesitan alias.

**Y el modo oscuro de shadcn no se usa.** Su convención es una clase `.dark` y un
`@custom-variant`; aquí el tema cambia el VALOR de las variables, así que sus
componentes se repintan solos sin escribir ni un `dark:`. Si aparece un `dark:` en
el código, es que alguien copió un componente sin adaptarlo.

---

## Lo que NO cambia

- **La escala.** `[data-scale="child"]` y `[data-scale="parent"]` siguen siendo lo
  que son, con sus mismos valores. Las maquetas los respetan: el niño con
  objetivos de 44 px y cifras grandes, el padre con 40 px y todo más denso.
- **Los radios, las sombras, las duraciones y los anchos con nombre.**
- **La tipografía.** Nunito variable, autoalojada, con su pila de respaldo detrás.

## Una deuda que el rediseño hereda, y no resuelve

**Texto blanco sobre `#FF6B4A` da 2,8:1, y el mínimo es 4,5:1.** Afecta a todos los
botones de acción principal.

Se probó la salida que conserva el color —tinta oscura encima, 5,3:1— y se
descartó por aspecto. La otra salida conserva el texto blanco pero exige bajar el
naranja hasta `#CE3E24`, y eso ya no es este naranja.

Queda **aceptado a conciencia**, no olvidado. Si algún día entra una verificación
de contraste en la batería, esto es lo primero que va a fallar, y va a fallar por
decisión y no por descuido.

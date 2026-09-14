## Context

Ver `proposal.md` para el porqué, `specs/` para los requisitos y `design/ui/piezas.md` para el reparto
completo: qué bloque de las maquetas es qué componente. Las restricciones que descartan la solución
directa:

1. **ESLint prohíbe el prop `style` en todo `src`**, con tres excepciones declaradas y ninguna lista
   de deuda. Desde `close-style-debt` la maquinaria de excepciones **ya no existe**, y no se reabre:
   una lista vacía es una puerta abierta.
2. **Ningún valor arbitrario de Tailwind y ningún color literal**, cazados por un test que escanea el
   archivo entero y no solo los `className`.
3. **Una pieza no conoce el dominio** ni importa de `features/` o `api/`. Es lo que la hace montable
   en una prueba sin proveedores y en el catálogo sin aplicación.
4. **`cx` no es `twMerge`, a propósito.** Una variante se declara como prop; no se impone desde fuera
   con clases, porque dos utilidades del mismo grupo las resuelve el orden del CSS generado.
5. **Una pieza nueva sin entrada en el catálogo vivo hace fallar un test.** No es opcional.

## Goals / Non-Goals

**Goals**

- Que las 32 pantallas tengan de dónde copiar en vez de dónde inventar.
- Que los controles que en las maquetas están dibujados pasen a funcionar de verdad.
- Que el mismo perfil se vea igual en los dos dispositivos de la casa.

**Non-Goals** (además de lo que excluye el proposal)

- Cambiar el contrato, `AVATAR_KEYS` ni la validación del avatar.
- Añadir un gestor de formularios.

## Decisions

### 1. El realce de color es UNA pieza, y recibe su tono

`HeroPanel` toma el tono (`action` naranja | `saving` morado), una pose de la mascota opcional y su
contenido. Dibuja el degradado, los dos círculos translúcidos y el recorte.

**Es la decisión más importante de este change.** No porque la pieza sea difícil, sino porque es la
que más se repite: 13 pantallas. Que exista una sola es la mitad de que el rediseño aguante seis
meses.

El degradado va SIEMPRE dentro del mismo tono, nunca de un tono a otro. Eso deja de ser una convención
del documento y pasa a ser algo que el punto de uso no puede equivocar, porque solo elige el tono.

**Alternativa descartada: un `Card` con una prop `gradient`.** `Card` es la superficie neutra del
sistema y la usan todas las pantallas; darle un modo de color la convertiría en dos piezas con un
`if`, y el día que el realce necesite su mascota habría que meterla ahí también.

### 2. El anillo recibe su dato y no lo calcula

`ProgressRing` toma hechas y total. De dónde salen esas dos cifras está en
`design/ui/datos-derivados.md`, y no es obvio: **«hoy» no existe en el modelo**, así que el anillo
cuenta `COMPLETED + APPROVED` sobre el total de sus tareas, sin recortar por jornada.

Si la pieza calculara, tendría que conocer el estado de una tarea, y una pieza del sistema no conoce
el dominio. Es la misma frontera que impide a `Pagination` construir sus propios enlaces.

### 3. La mascota lee el mapa que ya existe

`app/widget-lines.ts` ya asocia contexto y pose. La pieza lo lee de ahí; **no se escribe un segundo
mapa**. Dos mapas para lo mismo se separan, y el día que se separen nadie sabrá cuál manda — es
literalmente lo que le pasó al avatar del padre antes de `add-file-storage`.

Consecuencia que hay que aceptar: ese mapa vive hoy en `app/` y una pieza de `ui/` no puede importar
de `features/`. `app/` no es `features/`, así que la frontera aguanta; si algún día estorbase, el mapa
baja a `ui/` y no al revés.

### 4. Lo traído de shadcn es nuestro desde el primer minuto

Se trae con la CLI, se mueve a `ui/` y **se edita sin contemplaciones**: su color sale de los tokens
—vía la capa de alias que instaló `repaint-design-system`—, sus estilos en línea desaparecen y sus
variantes se declaran como props en vez de admitir `className` desde fuera.

A partir de ahí tiene los mismos deberes que cualquier pieza: entrada en el catálogo, sin dominio,
con sus estados, y sin `dark:` —aquí el tema cambia el valor de las variables, así que un `dark:` en
el código significa que alguien copió sin adaptar—.

**Radix ya está instalado** (dialog, accordion, tabs, toast), así que `sheet` y `popover` no añaden
familia nueva: sustituyen o acompañan a lo que ya hay. `Drawer` se sustituye por `sheet` en el mismo
paso, o quedarían dos piezas para lo mismo.

**Alternativa descartada: escribir los seis a mano.** El deslizador, la casilla y el grupo de opción
son controles con teclado, foco y roles ARIA que ya están resueltos y probados en miles de proyectos.
Escribirlos aquí sería rehacer la parte aburrida y arriesgada para no depender de una CLI.

### 5. Los doce animales, dibujados y con su color propio

`ui/avatars.ts` pasa a `ui/avatars.tsx` y cada clave devuelve un SVG en vez de un emoji. Los doce
están dibujados en `design/ui/pantallas/NuevoPerfil.dc.html`.

**El color de un animal es SUYO y no del tema.** No entra en la paleta de dos tonos ni se reasigna en
oscuro: un avatar es contenido, como una foto. Lo que sí sigue el tema es el círculo sobre el que va.

Lo que NO cambia, y es el motivo de que este paso sea barato: ni `AVATAR_KEYS`, ni la validación, ni
la base de datos. Siguen sin saber cómo se pinta un avatar.

## Risks / Trade-offs

- **Cuatro piezas nacen sin usarse.** Es correcto y es el punto: existen para que las pantallas no
  inventen. El riesgo real es el contrario —construirlas dentro del primer rediseño de pantalla y que
  la segunda las encuentre atadas a un caso—.
- **Traer seis componentes de golpe añade superficie que nadie ha revisado.** Se mitiga con la regla
  de que entran como piezas propias: si uno no puede cumplir los deberes de una pieza, no entra.
- **Doce SVG a mano son doce oportunidades de que uno desentone.** Se dibujan todos en el mismo paso y
  se miran juntos en el catálogo, no de uno en uno.
- **`Drawer` desaparece.** Es un punto de uso en el marco del niño y otro en el del padre; si la
  sustitución se deja para después, quedan dos piezas para lo mismo, que es la deuda que este change
  existe para no crear.

## Open Questions

- **Ninguna que bloquee.** La del saldo en la cabecera afecta a `CoinPill`, que este change excluye a
  propósito: se resuelve en `redesign-child-screens`, donde se ve.

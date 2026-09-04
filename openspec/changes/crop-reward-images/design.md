## Context

Ver `proposal.md` — Why. El estado del código que condiciona el cómo:

- `ImageUploadField` es **una sola pieza para los cuatro puntos de uso** —avatar, alta de premio,
  edición de premio y evidencia— y lo que los diferencia es una prop.
- Esa prop, `aspect`, decide dos cosas: si monta el recortador, y —vía
  `prepareImage({ forAvatar: aspect !== undefined })`— si el resultado se reduce a
  `AVATAR_MAX_DIMENSION` (512) o a `PHOTO_MAX_DIMENSION` (1280).
- El recortador ya existe y funciona: `react-easy-crop`, con su zoom y su confirmación, y con la
  tercera excepción de estilo en línea del proyecto declarada y justificada.
- `RewardImage` dibuja hoy `max-h-40 w-full object-cover` para la foto y `h-40` para el respaldo. La
  altura de la foto **depende de su proporción**; la del respaldo no.

## Goals / Non-Goals

**Goals:**

- Que la foto de un premio se recorte al elegirla, con el recortador que ya hay.
- Que recortar deje de arrastrar el tamaño de salida.
- Que la rejilla del escaparate deje de depender de con qué foto se subió cada premio.

**Non-Goals:**

- Recortar la evidencia de una tarea.
- Reprocesar lo ya subido.
- Tocar la API, los contratos de datos o el catálogo de avatares.

## Decisions

### 1. La decisión anterior se REVIERTE, y el argumento nuevo es la rejilla

`ImageUploadField` lleva escrito lo contrario de lo que este change hace:

> «Sin `aspect`, solo comprime. Es para la foto de un premio o la evidencia de una tarea, donde
> recortar a cuadrado quitaría justo lo que hay que ver: el juguete entero, la cama hecha.»

Se revierte **solo para el premio**, y por dos motivos que no existían al escribirla:

1. **La rejilla.** Cuando eso se escribió, el escaparate era una lista de una columna donde cada foto
   ocupaba el ancho entero y su altura no molestaba a nadie. Desde `redesign-child-surfaces` los
   premios van en rejilla, y ahí las proporciones dispares descuadran la fila.
2. **El recorte no es automático.** La objeción suponía un recorte por el centro. El recortador es
   interactivo: quien sube desplaza y acerca hasta que el juguete cabe. La frase describía un peligro
   que la herramienta que ya teníamos no tiene.

**Para la evidencia la decisión original se queda**, con su razón intacta: se mira de una en una en la
bandeja del padre, no junto a otras del mismo tamaño, y lo que hay que ver es el conjunto. Que la
misma frase cubriera los dos casos era el problema — uno cambió y el otro no.

### 2. `aspect` deja de decidir el tamaño, y esa es la parte que no se ve

```
   Hoy                                    Después
   ───                                    ───────
   aspect        ──┬─> recortador         aspect        ──> recortador
                   └─> forAvatar: true    maxDimension  ──> cuánto detalle
                       (512 px)

   premio con recorte -> 512 px           premio con recorte -> 1280 px
   (tamaño de avatar en media tablet)     (lo que la tesela necesita)
```

Son dos preguntas independientes —qué forma tiene la imagen y cuánto detalle guarda— y viajaban en la
misma prop porque hasta hoy coincidían: lo único que se recortaba era lo único que se guardaba
pequeño. En cuanto aparece un caso que recorta y necesita detalle, la coincidencia se rompe.

`prepareImage` **recibe** la medida en lugar de deducirla de una bandera. La bandera `forAvatar` no
sobrevive: nombrar una opción por su primer caso de uso es cómo se acaba pasando `forAvatar: true`
para algo que no es un avatar.

**Alternativa descartada: un tercer valor de `aspect` que signifique «recorta pero es una foto».**
Sería la misma conflación con más ramas. Dos props que dicen dos cosas se leen; una prop con tres
significados hay que recordarla.

**Alternativa descartada: una prop `purpose: "avatar" | "photo" | "evidence"`.** Mueve la decisión
dentro de la pieza, que pasaría a saber qué es un avatar y qué una evidencia. Es lo que
`ImageUploadField` evita a propósito desde `add-file-storage`: no sabe de hijos, premios ni tareas.

### 3. La caja de la imagen es de proporción fija, y la pone `RewardImage`

Recortar al subir arregla las fotos nuevas; la caja fija arregla **también las viejas**, que siguen
teniendo la proporción con la que se subieron.

```
   Hoy                              Después
   ───                              ───────
   foto:     max-h-40 w-full        foto:     caja cuadrada, object-cover
             (altura variable)      respaldo: la MISMA caja
   respaldo: h-40 fijo
```

Las dos ramas de `RewardImage` comparten ya la misma caja, que es lo que hace que un premio sin foto
no descuadre a su vecino. Y una foto vieja apaisada se encuadra dentro sin deformarse, sin
reprocesar nada en el almacén: `object-cover` recorta al mostrar lo que el recortador ya no tendrá
que recortar en las nuevas.

**Cuadrada** y no otra proporción, porque es la del recortador de los avatares —que es lo que se pidió
reutilizar— y la que un escaparate de productos usa por defecto.

### 4. La edición de un premio recorta igual que el alta

Son los dos puntos donde entra la foto de un premio, y hacer que uno recorte y el otro no dejaría el
catálogo con fotos de dos clases según por dónde entraron. Es la misma razón por la que las dos vías
de subida confirman igual.

## Risks / Trade-offs

- **Un paso más para el padre al publicar un premio** → Es el paso que ya da para su avatar y para el
  de sus hijos, así que no es una interacción nueva que aprender. Y sigue pudiendo cancelar.
- **Las fotos ya subidas no son cuadradas** → La caja fija las encuadra al mostrarlas. No se
  reprocesa nada: `object-cover` hace el trabajo, y el archivo del almacén no se toca.
- **Revertir una decisión escrita** → Con el argumento nuevo delante y por escrito, y **solo para el
  caso que cambió**. La evidencia conserva la suya, que es lo que evita que esto se lea como que la
  regla no valía.
- **Que el recorte no quepa en la pantalla del recortador** → El recortador ya existe y ya se usa en
  las dos pantallas de avatar del padre; no es superficie nueva.

## Migration Plan

Sin migración: no hay datos que mover ni objetos que reprocesar.

## Decisiones que este change NO toma

- **Si la evidencia debería recortarse alguna vez.** Hoy no, y con su razón intacta. Cambiaría el día
  que las evidencias se presenten en rejilla, que no está previsto.
- **Si conviene guardar más de una medida por imagen** —una para la tesela y otra para el detalle—.
  Es una optimización, y con el volumen de este producto no hay nada que optimizar todavía.
- **Si el avatar del padre y el de un hijo deberían guardarse más grandes.** Se decide mirando cómo se
  ven, no de pasada aquí.

## Context

`add-sidebar-nav` dejó la navegación detrás de un botón en todos los tamaños y lo declaró como
consecuencia aceptada. Al verlo no lo es: en escritorio y en tablet sobra ancho, y esconderla cuesta
un toque cada vez sin comprar nada.

Y se llevó el avatar de la cabecera, que era lo único siempre visible que respondía **quién está
usando esta tablet** — una pregunta real en un dispositivo que comparte toda la familia.

## Goals / Non-Goals

**Goals**

- Lateral fijo y contraíble cuando hay ancho; cajón cuando no.
- Que exista **una sola** navegación en el documento, no dos con una escondida.
- Devolver el avatar a la cabecera, a la derecha.
- Enmendar la regla de destinos duplicados **nombrando** su única excepción, no ablandándola.

**Non-Goals**

- Recordar el estado contraído entre recargas.
- Cambiar los destinos, los iconos o los colores. Este change mueve, no reviste.
- Tocar la API.

## Decisions

### 1. Se monta UNA forma, no dos con `hidden`

Lo barato sería renderizar la columna y el cajón a la vez y esconder una con `hidden lg:flex`. Se
descarta, y no por elegancia:

- **Dos listas de destinos son dos** para quien recorre el documento con teclado o con un lector de
  pantalla, aunque una no se vea. `display:none` la saca del árbol de accesibilidad, sí, pero eso deja
  la garantía dependiendo de una utilidad de CSS que nadie comprueba.
- **jsdom no aplica CSS.** Un test que cuente enlaces vería las dos formas siempre, así que el test
  de «ningún destino dos veces» —que es la regla central de la navegación— dejaría de poder
  escribirse.

Nace `app/use-wide.ts`, sobre `matchMedia`, y el marco monta la columna **o** el cajón. Como efecto
secundario los tests pueden probar **los dos modos de verdad**, que antes no se podía.

`matchMedia` no existe en jsdom: se rellena en `tests/setup.ts`, junto a los otros huecos del entorno
que ya se rellenan ahí para Radix. Por defecto **estrecho**, que es lo que los tests existentes
suponen.

El corte va en `lg` (1024px). Por debajo —tablet en vertical incluida— el cajón se lleva la pantalla
entera al abrirse y la devuelve al cerrarse, que es mejor que dejar 500px de contenido.

### 2. Contraído es solo iconos, y cada uno conserva su nombre

Al contraer, el texto desaparece de la vista pero **no del documento**: va con `sr-only`. Un icono sin
nombre accesible es un cuadrado para quien usa un lector de pantalla, y estos iconos son decorativos
a propósito —lo que nombra al destino es su texto—. Quitar el texto sin más dejaría los cinco
destinos sin nombre de golpe.

El estado vive en `useState` en el marco. Sobrevive a la navegación porque el marco no se desmonta
—hay un test que lo garantiza— y **se pierde al recargar**, que se acepta: persistirlo pediría
almacenamiento que el proyecto no usa hoy, y volver a la forma ancha tras recargar no rompe nada.

### 3. El avatar vuelve a la cabecera, y la regla se enmienda NOMBRANDO la excepción

El perfil pasa a ser alcanzable desde dos sitios: el avatar de la cabecera y la fila del pie del
lateral. Eso choca con la regla que `add-sidebar-nav` escribió, así que se enmienda la regla en vez
de dejarla mintiendo.

Y se enmienda **nombrando la excepción**, no ablandando la regla a «casi ninguno»:

- el avatar **no es solo un destino**: responde a quién está usando el dispositivo, que la lista no
  responde y que en una tablet compartida se pregunta de verdad;
- la fila del lateral **tampoco sobra**: un destino que solo se alcanza pulsando una foto sin texto no
  se encuentra, que es exactamente el defecto que `add-sidebar-nav` existió para arreglar.

El test no se relaja: sigue comprobando que **todos los demás** aparecen una sola vez, y comprueba el
perfil **por su nombre**, para que la excepción sea una y no una puerta abierta.

### 4. El botón de menú desaparece en ancho

Si la navegación está delante, un botón para abrirla no tiene qué abrir. Desaparece con la forma
estrecha, porque van juntos: es la misma decisión de montar una sola forma.

## Risks / Trade-offs

- **`matchMedia` decide en el primer render**, así que en un navegador muy estrecho no hay parpadeo,
  pero en uno ancho el primer pintado ocurre ya con el valor correcto porque se lee de forma síncrona
  al inicializar el estado, no en un efecto.
- **El estado contraído se pierde al recargar.** Declarado en la decisión 2.
- **El corte en `lg` deja la tablet en vertical con cajón.** Se mira con el dispositivo delante; el
  valor está en un solo sitio.

## Migration Plan

Sin migración: mismas direcciones, mismas guardas, mismos destinos.

## Open Questions

Ninguna que bloquee.

## Decisiones que este change NO toma

- **Recordar la preferencia de contraído.** Cuando el proyecto necesite guardar preferencias de
  dispositivo, se decide para todas a la vez y no para esta sola.
- **Si el corte debe ser `md` en vez de `lg`.** Se mira con la tablet delante.

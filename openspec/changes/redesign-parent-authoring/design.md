## Context

Quedan las tres pantallas donde el padre escribe. Al mirarlas, lo que hay no es andamio sin vestir
sino **la misma decisión de negocio escrita tres veces**: elegir hijos y ponerle monedas a cada uno,
íntegro en las dos altas y otra vez dentro del catálogo.

Y aparecieron dos cosas que no venían en el plan: que dos de las tres no son un formulario, y que la
regla contra «pásame una función para cerrarme» tenía un test que perseguía un nombre concreto, así
que cinco archivos con `onCancel` pasaron por delante sin que saltara.

## Goals / Non-Goals

**Goals**

- Una sola pieza para «a quién y por cuánto».
- Que las tres sean formularios de verdad.
- Cerrar el agujero de `onCancel`, y cerrarlo **por la forma** y no añadiendo un nombre más.
- Bajar la lista de deuda de 8 a 5.

**Non-Goals**

- **Sacar la edición de un premio a su propia ruta.** Decidido: se queda en línea.
- **Vestir `children/`.** Sus tres archivos pierden `onCancel` y nada más.
- **Tocar la API.** Ni un endpoint: los dos esquemas ya admiten las dos formas del precio.
- **Subir foto al crear.** La clave lleva dentro el identificador, que no existe todavía. Sigue
  pendiente y sin decidir.

## Decisions

### 1. `ChildrenPicker`: la pieza que faltaba

Vive en `features/children/` y no en `ui/`: sabe qué es un hijo, pide la lista y conoce los dos modos
del precio. Una pieza del sistema no sabe de dominio, y esto es dominio puro.

Lo que resuelve:

```
elegir hijos (casillas)
modo: el mismo valor para todos  |  uno por hijo
la cantidad, según el modo
```

Devuelve **lo que el contrato espera** —`{ childIds, coins }` o `{ assignments }`— para que quien la
usa no tenga que reconstruirlo. Las dos altas ya validan con el esquema compartido antes de enviar, y
eso se conserva: el error sale sin viaje al servidor y con el mismo criterio que aplicará la API.

`RewardCatalog` la usa **sin el selector de modo**: reasignar precios es siempre uno por hijo. El
modo entra por prop, no se adivina.

### 2. Las tres pasan a ser `<form>`

`TaskForm` y `RewardForm` son hoy un `<section>` con `type="button"` y un `onClick`. Escribir el
título y pulsar Enter no hace nada.

No es un detalle de purismo: es lo que hace cualquiera al terminar de escribir, y `ChildForm` sí lo
hace, así que dentro del mismo producto la misma tecla responde distinto según la pantalla.

Pasa a `onSubmit` con `preventDefault()` y el envío a `type="submit"`, que es como ya lo hace
`ChildForm` y las dos pantallas de acceso.

### 3. `onCancel` se va, y el test deja de perseguir NOMBRES

`add-app-shell` prohibió que una pantalla reciba una función para cerrarse y dejó un test. El test
busca `onDone`. Hay cinco archivos con `onCancel`.

```
lo que el test buscaba        lo que había
──────────────────────        ────────────
/\bonDone\b/                  onCancel  ×5
```

Es el caso puro de lo que este proyecto tiene escrito como regla 2: la convención tenía herramienta,
pero la herramienta perseguía **un nombre** y no **una forma**. Un sinónimo la sortea.

El test pasa a perseguir la forma: una prop cuyo nombre significa cerrarse —`onDone`, `onCancel`,
`onClose`, `onBack`, `onDismiss`— y declarada como función que no recibe nada. Sigue dejando pasar
`onSaved`, que es un evento de dominio y es legítimo.

**Se corrigen los cinco**, incluidos los tres de `children/` que no se visten aquí. Cambiar
`onCancel={volver}` por que la pantalla navegue ella misma es una traducción de una línea, y traducir
no es vestir: el precedente ya está sentado en `redesign-child-home`.

### 4. Editar un premio se queda en línea

Decidido contigo. Es un retoque pequeño y frecuente —subir un precio, cambiar una foto— y sacarlo a
otra pantalla obliga a ir y volver por cada cambio.

Los tres booleanos de `RewardCard` **no son estado-como-router** y por eso no se tocan por principio:
`confirming` abre un diálogo, y `editingTitle`/`editingOffers` son edición en el sitio. Ninguno decide
qué PANTALLA se enseña, que es lo que la regla prohíbe. Lo que sí se hace es que cada uno abra un
formulario de verdad.

Queda anotada la asimetría con los hijos, que sí se editan en su propia ruta. No se resuelve aquí
porque decidirlo mirando solo una de las dos mitades es cómo se toma la decisión equivocada:
`redesign-parent-children` mira la otra.

### 5. Lo que NO se unifica, y por qué

`TaskForm` tiene fecha de vencimiento y `RewardForm` tiene foto. Se parecen mucho pero no son el
mismo formulario, y fundirlos en uno con banderas cambiaría dos pantallas legibles por una con
condicionales. Lo que se comparte es el bloque que **de verdad** es idéntico.

## Risks / Trade-offs

- **`ChildrenPicker` nace con tres consumidores a la vez.** Es lo contrario del riesgo habitual —una
  pieza adivinada contra un solo uso—, pero obliga a que su forma sirva a los tres desde el primer
  día; por eso el modo entra por prop.
- **Tocar `children/` sin vestirlo** deja tres archivos a medias entre dos changes. Se acepta: la
  alternativa es dejar el test con una lista de excepciones, que es peor que un cambio mecánico.
- **`RewardCatalog` es la pantalla más grande que queda** (369 líneas) y se toca entera.

## Migration Plan

Sin migración: mismas direcciones, mismas guardas, mismos contratos.

## Open Questions

Ninguna que bloquee.

## Decisiones que este change NO toma

- **Si editar un hijo y editar un premio deben unificarse.** `redesign-parent-children`.
- **Subir una foto al crear.** Sigue pendiente y sin decidir, con sus dos caminos ya escritos.
- **Si `RewardCatalog` debería listar en tabla.** Sigue siendo tarjetas, como decidió
  `redesign-parent-inbox` para las dos bandejas.

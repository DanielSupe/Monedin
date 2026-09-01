## Context

Ver `proposal.md` — Why.

Lo que condiciona el cómo:

- **La causa del desbordamiento está medida**, no supuesta: 384 px pedidos contra 358 disponibles, en
  las dos pantallas, y por el mismo elemento.
- **`ImageUploadField` lo usan cuatro sitios**: el avatar del padre, el del hijo desde la gestión, la
  foto del premio y la evidencia de una tarea. Vestirlo mejora cuatro pantallas que no están en el
  alcance.
- **Ahí vive `react-easy-crop`** y sus tres estilos en línea, uno de ellos un color literal. Es la
  pregunta que `add-design-system` dejó abierta: *«se resolverá al integrarlo en `redesign-access`, y
  `allowInlineStyles()` existe precisamente para que esa respuesta quede escrita en un archivo de
  configuración en vez de en la cabeza de alguien»*. `redesign-access` no lo tocó porque la pantalla
  del recorte no está en el camino de entrar; aquí sí toca.
- **Las piezas ya existen**: `Card`, `Badge`, `Button`, `Alert`, `Coins`, `EmptyState`.
- **La escala del niño** ya da tamaños y toque amplios; la pantalla solo tiene que usarla.

## Goals / Non-Goals

**Goals:**

- Que el ciclo de una tarea se lea sin leer.
- Que el subidor deje de imponer su medida a lo que lo rodea.
- Cerrar el área del niño salvo la tienda, y poder retirar el parche del marco.

**Non-Goals:**

- Tocar la máquina de estados, la acreditación ni el doble tap.
- Hacer obligatoria la evidencia.
- Los premios y los canjes.

## Decisions

### 1. El estado es un `Badge`, y decide qué se puede hacer

```
   hoy                              después
   ───                              ───────
   ┌────────────────────┐           ┌────────────────────┐
   │ Hacer la cama      │           │ Hacer la cama   ⬤ │  ← el estado, visible
   │ 50 monedas         │           │ 🪙 50              │
   │ [elegir archivo]   │           │ [ Marcar hecha ]   │  ← solo si toca
   │ [Marcar hecha]     │           └────────────────────┘
   └────────────────────┘
   los tres estados, iguales        pendiente / esperando / pagada
```

Los tres estados ya tienen tono en el sistema: pendiente es neutro, esperando revisión es información
y pagada es éxito. No se inventa una paleta: se usa la que `Badge` ya tiene.

**Lo que se ve y lo que se puede hacer van juntos.** Solo una tarea pendiente ofrece marcarla, que es
exactamente lo que la API permite. La interfaz deja de poder pedir algo que va a acabar en 409.

### 2. El subidor deja de enseñar el control nativo, y esa es la corrección de fondo

**No es cuestión de aspecto.** Un `<input type="file">` tiene un ancho mínimo intrínseco de unos
360 px —el botón del sistema más «ningún archivo seleccionado»— y en una rejilla, donde el mínimo por
defecto es `auto`, **arrastra a su columna**. Por eso dos pantallas desbordaban sin tener el problema
en su código, y por eso el marco lleva un parche.

El control se queda —es lo que abre el selector del sistema— pero oculto detrás de un `Button` que lo
dispara. Sigue siendo alcanzable con el teclado y sigue anunciándose: **ocultar visualmente no es
quitar**.

### 3. La excepción del recorte, por fin declarada

`react-easy-crop` necesita un contenedor con posición y altura, y monta su lienzo dentro. De sus tres
estilos en línea, dos son medidas y uno es un color literal:

- **El color se va.** `background: "#333"` pasa a un token: es un velo bajo la imagen y el sistema ya
  tiene con qué pintarlo.
- **La altura y la posición se quedan**, y se declaran con `allowInlineStyles()` **solo para ese
  archivo**. Es la tercera excepción del proyecto, y `CLAUDE.md` avisa de que cada una debilita la
  regla, así que se justifica: el lienzo lo dimensiona una librería de terceros en tiempo de
  ejecución, y no hay token que exprese «lo que esa librería necesita para medir su área».

Queda así respondida la pregunta que `add-design-system` dejó abierta, en el archivo de configuración
y no en la cabeza de alguien.

### 4. El parche del marco se retira, si se lo ha ganado

`ChildShell` lleva `overflow-x-auto` con esta promesa escrita:

> *«la causa vive en esas pantallas y la arregla su change de rediseño»*

Con este change caen las dos que faltaban. **Se mide otra vez, y si las cuatro caben, se quita.** Si
alguna sigue desbordando, se deja y se dice cuál — quitarlo por optimismo es peor que dejarlo.

### 5. «Mi perfil» entra aquí porque comparte la causa

No es un hueco de conveniencia: `/me/settings` desbordaba **por lo mismo** que `/me/tasks`, y las dos
son las pantallas que un niño abre desde su inicio. Vestirlas juntas es lo que permite retirar el
parche.

`AvatarPicker` viene con ella, porque es quien contiene el subidor.

### 6. El «Volver» de cada pantalla se retira

Las dos pantallas traían un enlace de «Volver» al final. El marco del niño tiene una barra abajo con
sus cuatro destinos, así que ese enlace repetía lo que el marco ya hace y ocupaba el sitio peor: el
final de un desplazamiento.

No es alcance colado, es consecuencia de vestir: al pasar a tarjetas, un enlace suelto flotando
debajo se lee como un descuido.

### 7. Correcciones escritas al implementar

**El anillo de foco, dos intentos.** Ocultar el control con `sr-only` funcionaba para el teclado
—tabulando se llegaba— pero el anillo se dibujaba sobre un cuadro de 1 px que nadie ve: se llegaba al
control y no pasaba nada visible. Trasladarlo con `focus-within` tampoco salió: el color no se
aplicaba y caía a `currentColor`.

La salida buena es más simple: el control **cubre su etiqueta**, absoluto y a opacidad cero. Así su
caja de foco coincide con lo que se ve y el `:focus-visible` que el sistema ya declara sirve tal cual
—comprobado: `oklch(0.55 0.19 275)`, el índigo del sistema—. Y sigue fuera del flujo, que es lo que
importaba para el ancho.

**«Mi perfil» desbordaba por DOS cosas, no una.** El control de archivo era la mitad; la otra era el
`fieldset` de `AvatarPicker`, que toma como ancho mínimo el de su contenido. Se arregla con
`min-w-0`. Lo dice el diagnóstico que faltaba: medir una vez da la causa que se ve, no todas.

**El parche del marco se retiró de verdad.** Medidas las cinco pantallas antes y después: las cinco
caben y el documento no se mueve de lado en ninguna. `min-w-0` se queda, porque no era el parche
—impide que un hijo ancho estire una columna flex— y eso un marco tiene que sostenerlo siempre.

## Risks / Trade-offs

- **Una tercera excepción de estilos en línea** → Declarada, acotada a un archivo y con su motivo. La
  alternativa era dejar un color literal en una pieza compartida.
- **Ocultar el control nativo puede romper el teclado o el lector de pantalla** → Es el riesgo real de
  este change, y se comprueba con el teclado, no leyendo el código.
- **Cuatro pantallas fuera de alcance cambian de aspecto** → A mejor, y hay que mirarlas: la foto del
  padre, la del hijo, la del premio y la evidencia.
- **El change es grande**: tres pantallas y una pieza compartida. Se acepta porque las tres comparten
  una causa medida, y separarlas dejaría el parche del marco puesto sin motivo.

## Migration Plan

1. `ImageUploadField`: el control oculto y el recorte. Aquí se arregla el desbordamiento, antes de
   vestir nada.
2. Medir otra vez las cuatro pantallas del niño.
3. Vestir las tareas.
4. Vestir «Mi perfil» y el selector de avatar.
5. Retirar el parche del marco si se lo ha ganado, y estrechar la deuda.

**Vuelta atrás**: el paso 1 es independiente y beneficia por sí solo.

## Open Questions

Ninguna. La del recorte, que venía de `add-design-system`, la cierra la decisión 3.

## Decisiones que este change NO toma

- **Si la evidencia debería ser obligatoria.** Sigue siendo opcional, y por el motivo de siempre.
- **Los premios y los canjes**: `redesign-child-shop`.
- **Las tres pantallas de credenciales**, que siguen sin change.
